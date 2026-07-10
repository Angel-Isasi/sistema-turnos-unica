# routes_turnos.py
# Endpoints de Servicios y Turnos (autoservicio del alumno).
#
# Todos exigen sesión iniciada. El usuario del turno sale SIEMPRE del token,
# nunca del cuerpo de la petición: así nadie puede sacar turnos a nombre de
# otra persona aunque manipule el JSON.

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import get_db
from limitador import limitador
from models import Atencion, Servicio, Turno, Usuario
from seguridad import solo_administrativo, usuario_actual
from tiempo import inicio_dia_peru, iso_utc

router = APIRouter(tags=["Turnos"])

# Si un servicio aún no tiene historial de atenciones, estimamos 5 minutos
# por persona para calcular la espera aproximada.
MINUTOS_POR_ATENCION_DEFECTO = 5

ESTADOS_ACTIVOS = ("encola", "llamado")


class ServicioCrear(BaseModel):
    nombre: str = Field(min_length=3, max_length=100)
    prefijo: str = Field(min_length=1, max_length=5)
    descripcion: str = Field(default="", max_length=255)
    ventanilla: str = Field(default="", max_length=50)
    activo: bool = True


class TurnoCrear(BaseModel):
    servicio_id: int


# ---------------------------------------------------------------------------
# Consultas auxiliares reutilizadas por varios endpoints
# ---------------------------------------------------------------------------

def minutos_promedio_por_servicio(db: Session) -> dict[int, float]:
    """AVG de duración de atención (min) por servicio, según el historial."""
    filas = (
        db.query(
            Turno.servicio_id,
            func.avg(func.timestampdiff(text("SECOND"), Atencion.inicio, Atencion.fin)),
        )
        .join(Atencion, Atencion.turno_id == Turno.id)
        .filter(Atencion.fin.isnot(None))
        .group_by(Turno.servicio_id)
        .all()
    )
    return {servicio_id: float(seg) / 60 for servicio_id, seg in filas if seg}


def en_espera_por_servicio(db: Session) -> dict[int, int]:
    """Cuántos turnos hay en cola ahora mismo, por servicio."""
    filas = (
        db.query(Turno.servicio_id, func.count(Turno.id))
        .filter(Turno.estado == "encola")
        .group_by(Turno.servicio_id)
        .all()
    )
    return dict(filas)


def turno_activo_de(db: Session, usuario_id: int) -> Turno | None:
    return (
        db.query(Turno)
        .filter(Turno.usuario_id == usuario_id, Turno.estado.in_(ESTADOS_ACTIVOS))
        .order_by(Turno.creado_en.desc())
        .first()
    )


def posicion_en_cola(db: Session, turno: Turno) -> int:
    """1 = el siguiente en ser llamado. Para un turno ya llamado es 0."""
    if turno.estado == "llamado":
        return 0
    delante = (
        db.query(func.count(Turno.id))
        .filter(Turno.estado == "encola", Turno.creado_en < turno.creado_en)
        .scalar()
    )
    return int(delante) + 1


def datos_turno(db: Session, turno: Turno) -> dict:
    """Serializa un turno con todo lo que la pantalla necesita mostrar."""
    servicio = db.get(Servicio, turno.servicio_id)
    posicion = posicion_en_cola(db, turno)
    promedios = minutos_promedio_por_servicio(db)
    min_atencion = promedios.get(servicio.id, MINUTOS_POR_ATENCION_DEFECTO)
    return {
        "id": turno.id,
        "numero": turno.numero,
        "estado": turno.estado,
        "servicio": servicio.nombre,
        "ventanilla": servicio.ventanilla or "Por asignar",
        "posicion": posicion,
        "esperaMin": max(1, round(posicion * min_atencion)),
        "emitido": iso_utc(turno.creado_en),
    }


# ===========================================================================
# SERVICIOS
# ===========================================================================

@router.get("/servicios")
def listar_servicios(
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(usuario_actual),
):
    """Servicios activos con su cola actual y espera estimada."""
    servicios = (
        db.query(Servicio).filter(Servicio.activo.is_(True)).order_by(Servicio.id).all()
    )
    espera = en_espera_por_servicio(db)
    promedios = minutos_promedio_por_servicio(db)

    return [
        {
            "id": s.id,
            "prefijo": s.prefijo or s.nombre[0].upper(),
            "nombre": s.nombre,
            "descripcion": s.descripcion or "",
            "ventanilla": s.ventanilla or "Por asignar",
            "enEspera": espera.get(s.id, 0),
            "minPorAtencion": round(
                promedios.get(s.id, MINUTOS_POR_ATENCION_DEFECTO)
            ),
        }
        for s in servicios
    ]


@router.post("/servicios", status_code=201)
def crear_servicio(
    request: Request,
    datos: ServicioCrear,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(solo_administrativo),
):
    """Crea un servicio nuevo (solo administrativos)."""
    nuevo = Servicio(
        nombre=datos.nombre.strip(),
        prefijo=datos.prefijo.strip().upper(),
        descripcion=datos.descripcion.strip(),
        ventanilla=datos.ventanilla.strip(),
        activo=datos.activo,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    request.state.audit_detalle = f"Servicio '{nuevo.nombre}' (prefijo {nuevo.prefijo})"
    return {"id": nuevo.id, "nombre": nuevo.nombre, "prefijo": nuevo.prefijo}


# ===========================================================================
# TURNOS
# ===========================================================================

@router.post("/turnos", status_code=201)
@limitador.limit("10/minute")  # red de seguridad extra contra spam de turnos
def crear_turno(
    request: Request,
    datos: TurnoCrear,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Saca un turno para el usuario de la sesión.

    Regla anti-abuso: una persona solo puede tener UN turno activo a la vez
    (en cola o llamado). Evita que alguien infle la cola durante la demo.
    """
    servicio = db.get(Servicio, datos.servicio_id)
    if servicio is None or not servicio.activo:
        raise HTTPException(status_code=404, detail="Ese servicio no existe o no está activo")

    activo = turno_activo_de(db, usuario.id)
    if activo is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Ya tienes el turno {activo.numero} activo. Espera a que sea atendido.",
        )

    # Correlativo del día por servicio: M-001, M-002... reinicia cada día.
    emitidos_hoy = (
        db.query(func.count(Turno.id))
        .filter(
            Turno.servicio_id == servicio.id,
            Turno.creado_en >= inicio_dia_peru(0),
        )
        .scalar()
    )
    prefijo = servicio.prefijo or servicio.nombre[0].upper()
    numero = f"{prefijo}-{int(emitidos_hoy) + 1:03d}"

    turno = Turno(
        numero=numero,
        estado="encola",
        usuario_id=usuario.id,
        servicio_id=servicio.id,
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)

    request.state.audit_turno = turno.numero
    request.state.audit_detalle = f"{servicio.nombre} · {usuario.nombre}"

    return datos_turno(db, turno)


@router.get("/turnos")
def listar_turnos(
    estado: str | None = None,
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(usuario_actual),
):
    """Cola en vivo. Filtra por estado, admite lista: ?estado=encola,llamado"""
    consulta = (
        db.query(Turno, Servicio.nombre, Usuario.nombre)
        .join(Servicio, Turno.servicio_id == Servicio.id)
        .join(Usuario, Turno.usuario_id == Usuario.id)
        .order_by(Turno.creado_en.asc())
    )
    if estado:
        estados = [e.strip() for e in estado.split(",") if e.strip()]
        consulta = consulta.filter(Turno.estado.in_(estados))
    else:
        # Sin filtro devolvemos solo lo de hoy para no arrastrar historia vieja.
        consulta = consulta.filter(Turno.creado_en >= inicio_dia_peru(0))

    return [
        {
            "id": t.id,
            "numero": t.numero,
            "estado": t.estado,
            "servicio": nombre_servicio,
            "solicitante": nombre_usuario,
            "emitido": iso_utc(t.creado_en),
        }
        for t, nombre_servicio, nombre_usuario in consulta.limit(100).all()
    ]


@router.get("/turnos/mio")
def mi_turno(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """El turno activo del usuario de la sesión (o null). Permite que la
    pantalla Turnos recupere el ticket aunque se recargue la página."""
    turno = turno_activo_de(db, usuario.id)
    if turno is None:
        return None
    return datos_turno(db, turno)
