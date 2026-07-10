# tiempo.py
# Utilidades de fecha y hora del sistema.
#
# Convención: en MySQL guardamos todo en UTC "naive" (sin zona horaria),
# igual que hacía datetime.utcnow(). Para agrupar por día en los reportes
# convertimos a la hora de Perú (UTC-5, sin horario de verano), porque un
# turno emitido a las 8 pm en Ica ya cae en el día UTC siguiente y sin esta
# conversión el reporte de "hoy" saldría vacío por la noche.

from datetime import datetime, timedelta, timezone

ZONA_PERU = timezone(timedelta(hours=-5))


def ahora_utc() -> datetime:
    """Fecha-hora actual en UTC sin tzinfo (reemplazo de utcnow, deprecado)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso_utc(dt: datetime | None) -> str | None:
    """Serializa un datetime naive-UTC como ISO 8601 con zona (+00:00).

    Sin la zona explícita, el navegador interpretaría la hora como local
    y todo saldría corrido 5 horas.
    """
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc).isoformat()


def inicio_dia_peru(dias_atras: int = 0) -> datetime:
    """Inicio (00:00) de un día de Perú, expresado en UTC naive.

    dias_atras=0 es hoy, 1 es ayer, etc.
    """
    dia = (datetime.now(ZONA_PERU) - timedelta(days=dias_atras)).date()
    inicio_local = datetime(dia.year, dia.month, dia.day, tzinfo=ZONA_PERU)
    return inicio_local.astimezone(timezone.utc).replace(tzinfo=None)


def fecha_peru(dt: datetime) -> str:
    """Fecha (YYYY-MM-DD) de un datetime naive-UTC vista desde Perú."""
    return dt.replace(tzinfo=timezone.utc).astimezone(ZONA_PERU).strftime("%Y-%m-%d")
