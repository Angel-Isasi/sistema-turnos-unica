# routes_auditoria.py
# Consulta del registro de auditoría — solo administrativos.
# Las filas las escribe automáticamente auditoria_automatica.py; aquí
# solamente se leen.

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Auditoria, Usuario
from seguridad import solo_administrativo
from tiempo import iso_utc

router = APIRouter(prefix="/auditoria", tags=["Auditoría"])


@router.get("")
def listar_auditoria(
    accion: str | None = None,
    limite: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(solo_administrativo),
):
    consulta = (
        db.query(Auditoria, Usuario.nombre)
        .outerjoin(Usuario, Auditoria.usuario_id == Usuario.id)
        .order_by(Auditoria.timestamp.desc(), Auditoria.id.desc())
    )
    if accion:
        consulta = consulta.filter(Auditoria.accion == accion)

    return [
        {
            "id": a.id,
            "fecha": iso_utc(a.timestamp),
            "usuario": nombre or "—",
            "accion": a.accion,
            "turno": a.turno_numero or "—",
            "detalle": a.detalle or "",
            "resultado": a.resultado,
        }
        for a, nombre in consulta.limit(limite).all()
    ]
