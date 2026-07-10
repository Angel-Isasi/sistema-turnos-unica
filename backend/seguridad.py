# seguridad.py
# Autenticación y autorización del sistema:
#   - hash de contraseñas con bcrypt (nunca guardamos texto plano)
#   - creación y validación de JWT (el token lleva el rol adentro)
#   - dependencias reutilizables para proteger endpoints por rol
#
# Punto crítico del proyecto: la validación de rol vive AQUÍ, en el backend.
# Ocultar un enlace en el frontend es solo estética; cualquiera puede copiar
# el token desde DevTools y golpear la API con curl. Estas dependencias son
# la protección real.

import os
from datetime import timedelta

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario
from tiempo import ahora_utc

load_dotenv()

# En producción (Railway) esta variable DEBE estar definida con un valor
# largo y aleatorio. El valor por defecto existe solo para desarrollo local.
JWT_SECRET = os.getenv("JWT_SECRET", "solo-para-desarrollo-local-cambiame-en-railway")
JWT_ALGORITMO = "HS256"
TOKEN_HORAS = 8  # suficiente para una jornada; no dejamos tokens eternos

ROL_ALUMNO = "alumno"
ROL_ADMINISTRATIVO = "administrativo"

# auto_error=False para responder nosotros con un mensaje claro en español.
esquema_bearer = HTTPBearer(auto_error=False)


def hashear_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verificar_password(password: str, hash_guardado: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hash_guardado.encode())
    except ValueError:
        # Lo guardado no es un hash bcrypt válido (p. ej. filas de prueba
        # antiguas con texto plano): tratamos como contraseña incorrecta.
        return False


def crear_token(usuario: Usuario) -> str:
    ahora = ahora_utc()
    return jwt.encode(
        {
            "sub": str(usuario.id),
            "nombre": usuario.nombre,
            "rol": usuario.rol,
            "iat": ahora,
            "exp": ahora + timedelta(hours=TOKEN_HORAS),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITMO,
    )


def decodificar_token(token: str) -> dict | None:
    """Devuelve el contenido del token o None si es inválido/expirado."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITMO])
    except jwt.InvalidTokenError:
        return None


def usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """Dependencia: exige un token válido y devuelve el usuario de la BD."""
    if credenciales is None:
        raise HTTPException(status_code=401, detail="Falta el token de sesión")

    datos = decodificar_token(credenciales.credentials)
    if datos is None:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")

    usuario = db.get(Usuario, int(datos["sub"]))
    if usuario is None:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    return usuario


def solo_administrativo(usuario: Usuario = Depends(usuario_actual)) -> Usuario:
    """Dependencia: sesión válida Y rol administrativo. Para /atencion,
    /reportes, /auditoria y /usuarios."""
    if usuario.rol != ROL_ADMINISTRATIVO:
        raise HTTPException(
            status_code=403, detail="No tienes permiso para esta operación"
        )
    return usuario
