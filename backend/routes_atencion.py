# routes_atencion.py
# Módulo de ventanilla (back-office). TODOS los endpoints exigen rol
# administrativo — validado en el backend, no solo escondido en el menú.
#
# Flujo: llamar-siguiente (encola -> llamado, abre una fila en atenciones)
#        atender          (llamado -> atendido, cierra la atención)
#        no-presentado    (llamado -> cancelado, cierra la atención)

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Atencion, Servicio, Turno, Usuario
from seguridad import solo_administrativo
from tiempo import ahora_utc, inicio_dia_peru, iso_utc

router = APIRouter(prefix="/atencion", tags=["Atención"])


class LlamarSiguiente(BaseModel):
    ventanilla: int = Field(ge=1, le=99)


def atencion_abierta_de(db: Session, operador_id: int) -> Atencion | None:
    """La atención sin cerrar (fin IS NULL) del operador, si existe."""
    return (
        db.query(Atencion)
        .filter(Atencion.operador_id == operador_id, Atencion.fin.is_(None))
        .order_by(Atencion.inicio.desc())
        .first()
    )


def datos_turno_en_ventanilla(db: Session, atencion: Atencion) -> dict:
    turno = db.get(Turno, atencion.turno_id)
    servicio = db.get(Servicio, turno.servicio_id)
    solicitante = db.get(Usuario, turno.usuario_id)
    return {
        "turnoId": turno.id,
        "numero": turno.numero,
        "servicio": servicio.nombre,
        "solicitante": solicitante.nombre,
        "emitido": iso_utc(turno.creado_en),
        "llamadoEn": iso_utc(atencion.inicio),
        "ventanilla": atencion.observacion or "Ventanilla",
    }


@router.get("/estado")
def estado_ventanilla(
    db: Session = Depends(get_db),
    operador: Usuario = Depends(solo_administrativo),
):
    """Todo lo que la pantalla de Atención necesita en una sola llamada:
    el turno en ventanilla, la cola de espera y el historial de hoy."""
    abierta = atencion_abierta_de(db, operador.id)
    actual = datos_turno_en_ventanilla(db, abierta) if abierta else None

    cola = (
        db.query(Turno, Servicio.nombre, Usuario.nombre)
        .join(Servicio, Turno.servicio_id == Servicio.id)
        .join(Usuario, Turno.usuario_id == Usuario.id)
        .filter(Turno.estado == "encola")
        .order_by(Turno.creado_en.asc())
        .limit(50)
        .all()
    )

    historial = (
        db.query(Atencion, Turno, Servicio.nombre, Usuario.nombre)
        .join(Turno, Atencion.turno_id == Turno.id)
        .join(Servicio, Turno.servicio_id == Servicio.id)
        .join(Usuario, Turno.usuario_id == Usuario.id)
        .filter(Atencion.fin.isnot(None), Atencion.fin >= inicio_dia_peru(0))
        .order_by(Atencion.fin.desc())
        .limit(20)
        .all()
    )

    return {
        "actual": actual,
        "cola": [
            {
                "id": t.id,
                "numero": t.numero,
                "servicio": servicio,
                "solicitante": solicitante,
                "emitido": iso_utc(t.creado_en),
            }
            for t, servicio, solicitante in cola
        ],
        "historial": [
            {
                "id": t.id,
                "numero": t.numero,
                "servicio": servicio,
                "solicitante": solicitante,
                "estado": t.estado,
                "emitido": iso_utc(t.creado_en),
                "cerrado": iso_utc(a.fin),
            }
            for a, t, servicio, solicitante in historial
        ],
    }


@router.post("/llamar-siguiente")
def llamar_siguiente(
    request: Request,
    datos: LlamarSiguiente,
    db: Session = Depends(get_db),
    operador: Usuario = Depends(solo_administrativo),
):
    """Toma el turno más antiguo de la cola y lo pasa a ventanilla."""
    abierta = atencion_abierta_de(db, operador.id)
    if abierta is not None:
        turno_abierto = db.get(Turno, abierta.turno_id)
        raise HTTPException(
            status_code=409,
            detail=f"Ya estás atendiendo el turno {turno_abierto.numero}. Ciérralo primero.",
        )

    siguiente = (
        db.query(Turno)
        .filter(Turno.estado == "encola")
        .order_by(Turno.creado_en.asc())
        .first()
    )
    if siguiente is None:
        raise HTTPException(status_code=409, detail="No hay turnos en espera")

    # Cambio de estado atómico: si otro operador llamó este mismo turno una
    # milésima antes, rowcount será 0 y no lo duplicamos.
    tomado = (
        db.query(Turno)
        .filter(Turno.id == siguiente.id, Turno.estado == "encola")
        .update({"estado": "llamado"})
    )
    if tomado == 0:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Otro operador tomó ese turno; intenta de nuevo"
        )

    atencion = Atencion(
        turno_id=siguiente.id,
        operador_id=operador.id,
        inicio=ahora_utc(),
        observacion=f"Ventanilla {datos.ventanilla}",
    )
    db.add(atencion)
    db.commit()
    db.refresh(atencion)

    request.state.audit_turno = siguiente.numero
    request.state.audit_detalle = f"Llamado a Ventanilla {datos.ventanilla}"

    return datos_turno_en_ventanilla(db, atencion)


def _cerrar_atencion(
    request: Request, db: Session, operador: Usuario, estado_final: str, detalle: str
) -> dict:
    """Cierra la atención abierta del operador con el estado final indicado."""
    abierta = atencion_abierta_de(db, operador.id)
    if abierta is None:
        raise HTTPException(status_code=409, detail="No tienes ningún turno en ventanilla")

    turno = db.get(Turno, abierta.turno_id)
    turno.estado = estado_final
    abierta.fin = ahora_utc()
    db.commit()

    duracion_min = max(1, round((abierta.fin - abierta.inicio).total_seconds() / 60))
    request.state.audit_turno = turno.numero
    request.state.audit_detalle = f"{detalle} en {duracion_min} min · {abierta.observacion}"

    return {"numero": turno.numero, "estado": estado_final}


@router.post("/atender")
def marcar_atendido(
    request: Request,
    db: Session = Depends(get_db),
    operador: Usuario = Depends(solo_administrativo),
):
    return _cerrar_atencion(request, db, operador, "atendido", "Atención cerrada")


@router.post("/no-presentado")
def no_presentado(
    request: Request,
    db: Session = Depends(get_db),
    operador: Usuario = Depends(solo_administrativo),
):
    return _cerrar_atencion(request, db, operador, "cancelado", "No se presentó")
