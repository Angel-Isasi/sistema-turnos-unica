# routes_auth.py
# Login del sistema. No hay registro público a propósito: las cuentas se
# crean con seed.py o desde el panel de usuarios (solo administrativos).

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from limitador import limitador
from models import Usuario
from seguridad import crear_token, usuario_actual, verificar_password

router = APIRouter(prefix="/auth", tags=["Autenticación"])


class CredencialesLogin(BaseModel):
    email: str = Field(max_length=100)
    password: str = Field(max_length=72)


def usuario_publico(u: Usuario) -> dict:
    """Los datos del usuario que sí pueden viajar al frontend (sin password)."""
    return {"id": u.id, "nombre": u.nombre, "email": u.email, "rol": u.rol}


@router.post("/login")
@limitador.limit("5/minute")  # frena fuerza bruta: 5 intentos por minuto por IP
def login(
    request: Request,
    credenciales: CredencialesLogin,
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == credenciales.email.strip().lower())
        .first()
    )

    # Mensaje genérico a propósito: nunca revelamos si el correo existe,
    # para no regalarle a un atacante qué cuentas son válidas.
    if usuario is None or not verificar_password(credenciales.password, usuario.password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    # Datos para la auditoría automática (ver auditoria_automatica.py).
    request.state.audit_usuario_id = usuario.id
    request.state.audit_detalle = f"Ingreso al sistema · rol {usuario.rol}"

    return {"token": crear_token(usuario), "usuario": usuario_publico(usuario)}


@router.get("/yo")
def yo(usuario: Usuario = Depends(usuario_actual)):
    """Devuelve el usuario de la sesión actual. El frontend lo usa para
    restaurar la sesión al recargar la página."""
    return usuario_publico(usuario)
