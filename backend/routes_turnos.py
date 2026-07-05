# routes_turnos.py
# Este archivo agrupa los endpoints (rutas) de Servicios y Turnos.
# Persona B: aquí NO tocamos main.py, models.py ni database.py.
# Solo usamos lo que esos archivos ya ofrecen.

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Importamos las herramientas de conexión a la base de datos.
# SessionLocal es la "fábrica" de sesiones definida en database.py.
from database import SessionLocal

# Importamos los modelos ORM (las tablas) tal como están en models.py.
from models import Servicio, Turno, Usuario


# ---------------------------------------------------------------------------
# Router: es como un "mini app" donde registramos nuestras rutas.
# Luego Angel lo conecta en main.py con app.include_router(...).
# ---------------------------------------------------------------------------
router = APIRouter(tags=["Turnos"])


# ---------------------------------------------------------------------------
# Dependencia de base de datos.
# Abre una sesión antes de atender la petición y la cierra al terminar,
# aunque ocurra un error. Cada endpoint la recibe con Depends(get_db).
# (La definimos aquí porque database.py no trae una función get_db.)
# ---------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Modelos Pydantic: describen el "cuerpo" (JSON) que llega en los POST.
# Sirven para validar automáticamente lo que envía el cliente.
# ---------------------------------------------------------------------------
class ServicioCrear(BaseModel):
    nombre: str  # Nombre del servicio, obligatorio.
    # 'activo' es opcional: si no lo mandan, queda en True por defecto.
    activo: bool = True


class TurnoCrear(BaseModel):
    numero: str        # Número o código del turno (en la tabla es texto).
    usuario_id: int    # ID del usuario que pide el turno.
    servicio_id: int   # ID del servicio al que corresponde.


# ===========================================================================
# ENDPOINTS DE SERVICIOS
# ===========================================================================

@router.post("/servicios")
def crear_servicio(datos: ServicioCrear, db: Session = Depends(get_db)):
    """Crea un nuevo servicio y lo guarda en la base de datos."""
    # Creamos el objeto de la tabla 'servicios' con los datos recibidos.
    nuevo_servicio = Servicio(nombre=datos.nombre, activo=datos.activo)

    # Lo agregamos a la sesión y confirmamos (commit) para guardarlo.
    db.add(nuevo_servicio)
    db.commit()
    # refresh recarga el objeto para tener el 'id' que generó la BD.
    db.refresh(nuevo_servicio)

    # Devolvemos el servicio creado como respuesta JSON.
    return {
        "id": nuevo_servicio.id,
        "nombre": nuevo_servicio.nombre,
        "activo": nuevo_servicio.activo,
    }


@router.get("/servicios")
def listar_servicios(db: Session = Depends(get_db)):
    """Devuelve la lista de todos los servicios."""
    # query(...).all() trae todas las filas de la tabla 'servicios'.
    servicios = db.query(Servicio).all()

    # Convertimos cada objeto a un diccionario simple para la respuesta.
    return [
        {"id": s.id, "nombre": s.nombre, "activo": s.activo}
        for s in servicios
    ]


# ===========================================================================
# ENDPOINTS DE TURNOS
# ===========================================================================

@router.post("/turnos")
def crear_turno(datos: TurnoCrear, db: Session = Depends(get_db)):
    """Crea un turno nuevo en estado 'creado'.

    Antes de crearlo, verifica que el usuario y el servicio existan.
    """
    # 1) Verificamos que el usuario exista. Si no, devolvemos 404.
    usuario = db.query(Usuario).filter(Usuario.id == datos.usuario_id).first()
    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail=f"No existe un usuario con id {datos.usuario_id}",
        )

    # 2) Verificamos que el servicio exista. Si no, devolvemos 404.
    servicio = db.query(Servicio).filter(Servicio.id == datos.servicio_id).first()
    if servicio is None:
        raise HTTPException(
            status_code=404,
            detail=f"No existe un servicio con id {datos.servicio_id}",
        )

    # 3) Creamos el turno. Ponemos estado="creado" de forma explícita
    #    para dejar claro el punto de partida del flujo.
    nuevo_turno = Turno(
        numero=datos.numero,
        estado="creado",
        usuario_id=datos.usuario_id,
        servicio_id=datos.servicio_id,
    )

    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)

    # Devolvemos el turno recién creado.
    return {
        "id": nuevo_turno.id,
        "numero": nuevo_turno.numero,
        "estado": nuevo_turno.estado,
        "prioridad": nuevo_turno.prioridad,
        "usuario_id": nuevo_turno.usuario_id,
        "servicio_id": nuevo_turno.servicio_id,
    }


@router.get("/turnos")
def listar_turnos(db: Session = Depends(get_db)):
    """Devuelve la lista de todos los turnos."""
    turnos = db.query(Turno).all()

    return [
        {
            "id": t.id,
            "numero": t.numero,
            "estado": t.estado,
            "prioridad": t.prioridad,
            "usuario_id": t.usuario_id,
            "servicio_id": t.servicio_id,
        }
        for t in turnos
    ]
