# routes_reportes.py
# Métricas de gestión — solo administrativos.
# Todo se calcula con agregaciones SQL reales (COUNT, AVG, GROUP BY) sobre
# turnos y atenciones; nada de datos inventados.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import get_db
from models import Atencion, Servicio, Turno, Usuario
from seguridad import solo_administrativo
from tiempo import fecha_peru, inicio_dia_peru

router = APIRouter(prefix="/reportes", tags=["Reportes"])

# Rango -> cuántos días hacia atrás cubre (0 = solo hoy)
RANGOS = {"hoy": 0, "semana": 6, "mes": 29}

# TIMESTAMPDIFF(SECOND, a, b) espera la unidad como palabra clave.
SEGUNDOS = text("SECOND")


def _minutos(segundos) -> int:
    return 0 if segundos is None else round(float(segundos) / 60)


@router.get("/resumen")
def resumen(
    rango: str = "hoy",
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(solo_administrativo),
):
    if rango not in RANGOS:
        raise HTTPException(status_code=422, detail="Rango inválido: hoy, semana o mes")

    desde = inicio_dia_peru(RANGOS[rango])

    # ---- Tarjetas: COUNT por estado dentro del rango --------------------
    por_estado = dict(
        db.query(Turno.estado, func.count(Turno.id))
        .filter(Turno.creado_en >= desde)
        .group_by(Turno.estado)
        .all()
    )
    emitidos = sum(por_estado.values())
    atendidos = por_estado.get("atendido", 0)
    cancelados = por_estado.get("cancelado", 0)

    # Emitidos de ayer, para la nota comparativa de la primera tarjeta.
    emitidos_ayer = (
        db.query(func.count(Turno.id))
        .filter(
            Turno.creado_en >= inicio_dia_peru(1),
            Turno.creado_en < inicio_dia_peru(0),
        )
        .scalar()
    )

    # ---- Promedios: AVG de espera (emisión -> llamado) y de atención ----
    espera_seg = (
        db.query(func.avg(func.timestampdiff(SEGUNDOS, Turno.creado_en, Atencion.inicio)))
        .select_from(Atencion)
        .join(Turno, Atencion.turno_id == Turno.id)
        .filter(Turno.creado_en >= desde)
        .scalar()
    )
    atencion_seg = (
        db.query(func.avg(func.timestampdiff(SEGUNDOS, Atencion.inicio, Atencion.fin)))
        .select_from(Atencion)
        .join(Turno, Atencion.turno_id == Turno.id)
        .filter(Atencion.fin.isnot(None), Turno.creado_en >= desde)
        .scalar()
    )

    # ---- Gráfico: GROUP BY día (hora de Perú) de los últimos 5 días -----
    # DATE_SUB corre la hora UTC a hora de Perú antes de agrupar por fecha.
    dia_peru = func.date(func.date_sub(Turno.creado_en, text("INTERVAL 5 HOUR")))
    filas_dia = (
        db.query(dia_peru, Turno.estado, func.count(Turno.id))
        .filter(Turno.creado_en >= inicio_dia_peru(4))
        .group_by(dia_peru, Turno.estado)
        .all()
    )
    conteo_por_dia: dict[str, dict] = {}
    for fecha, estado, cantidad in filas_dia:
        dia = conteo_por_dia.setdefault(str(fecha), {"emitidos": 0, "atendidos": 0})
        dia["emitidos"] += cantidad
        if estado == "atendido":
            dia["atendidos"] += cantidad

    por_dia = []
    for dias_atras in range(4, -1, -1):  # del más antiguo a hoy
        fecha = fecha_peru(inicio_dia_peru(dias_atras))
        conteo = conteo_por_dia.get(fecha, {"emitidos": 0, "atendidos": 0})
        por_dia.append({"fecha": fecha, **conteo})

    # ---- Por servicio: COUNT + AVG agrupados, dentro del rango ----------
    filas_servicio = (
        db.query(
            Servicio.nombre,
            func.count(Atencion.id),
            func.avg(func.timestampdiff(SEGUNDOS, Turno.creado_en, Atencion.inicio)),
            func.avg(func.timestampdiff(SEGUNDOS, Atencion.inicio, Atencion.fin)),
        )
        .select_from(Atencion)
        .join(Turno, Atencion.turno_id == Turno.id)
        .join(Servicio, Turno.servicio_id == Servicio.id)
        .filter(Turno.estado == "atendido", Turno.creado_en >= desde)
        .group_by(Servicio.nombre)
        .order_by(func.count(Atencion.id).desc())
        .all()
    )
    por_servicio = [
        {
            "servicio": nombre,
            "atendidos": int(cantidad),
            "esperaMin": _minutos(espera),
            "atencionMin": _minutos(duracion),
        }
        for nombre, cantidad, espera, duracion in filas_servicio
    ]

    return {
        "rango": rango,
        "emitidos": emitidos,
        "atendidos": atendidos,
        "cancelados": cancelados,
        "emitidosAyer": int(emitidos_ayer or 0),
        "esperaPromedioMin": _minutos(espera_seg),
        "atencionPromedioMin": _minutos(atencion_seg),
        "porDia": por_dia,
        "porServicio": por_servicio,
    }
