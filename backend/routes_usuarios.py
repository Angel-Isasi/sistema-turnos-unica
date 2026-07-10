# routes_usuarios.py
# Gestión de cuentas — SOLO para el rol administrativo.
#
# En lugar de un registro público (que sería superficie de ataque en plena
# demo), las cuentas nuevas se crean desde aquí, ya autenticado como
# administrativo. Esto demuestra el CRUD de usuarios sin abrir la puerta
# a cualquiera.

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario
from seguridad import (
    ROL_ADMINISTRATIVO,
    ROL_ALUMNO,
    hashear_password,
    solo_administrativo,
)
from tiempo import iso_utc

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


class UsuarioCrear(BaseModel):
    nombre: str = Field(min_length=3, max_length=100)
    # Validación simple de correo sin dependencias extra.
    email: str = Field(max_length=100, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    # bcrypt admite máximo 72 bytes; 8 como mínimo razonable.
    password: str = Field(min_length=8, max_length=72)
    rol: str


@router.get("")
def listar_usuarios(
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(solo_administrativo),
):
    usuarios = db.query(Usuario).order_by(Usuario.id.desc()).all()
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "email": u.email,
            "rol": u.rol,
            "creado_en": iso_utc(u.creado_en),
        }
        for u in usuarios
    ]


@router.post("", status_code=201)
def crear_usuario(
    request: Request,
    datos: UsuarioCrear,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(solo_administrativo),
):
    if datos.rol not in (ROL_ALUMNO, ROL_ADMINISTRATIVO):
        raise HTTPException(
            status_code=422,
            detail=f"Rol inválido: usa '{ROL_ALUMNO}' o '{ROL_ADMINISTRATIVO}'",
        )

    email = datos.email.strip().lower()
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")

    nuevo = Usuario(
        nombre=datos.nombre.strip(),
        email=email,
        password=hashear_password(datos.password),
        rol=datos.rol,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    request.state.audit_detalle = f"{nuevo.email} · rol {nuevo.rol}"

    return {"id": nuevo.id, "nombre": nuevo.nombre, "email": nuevo.email, "rol": nuevo.rol}
