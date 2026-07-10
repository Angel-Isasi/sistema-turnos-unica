import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# En Railway armamos la URL a partir de piezas sueltas (MYSQLHOST,
# MYSQLUSER, etc. — las variables que el propio servicio de MySQL expone)
# en vez de pegar una sola URL compuesta a mano: una sola referencia por
# variable es mucho más difícil de escribir mal que un string largo con
# 4 sustituciones concatenadas, y URL.create() escapa usuario/contraseña
# automáticamente si tuvieran caracteres especiales.
# En desarrollo local usamos DATABASE_URL completa desde el .env (apunta
# al proxy público de Railway).
_host = os.getenv("MYSQLHOST")
if _host:
    url = URL.create(
        "mysql+pymysql",
        username=os.getenv("MYSQLUSER"),
        password=os.getenv("MYSQLPASSWORD"),
        host=_host,
        port=int(os.getenv("MYSQLPORT", "3306")),
        database=os.getenv("MYSQLDATABASE"),
    )
else:
    url = os.getenv("DATABASE_URL")

# pool_pre_ping: verifica la conexión antes de usarla. Railway corta las
# conexiones inactivas y sin esto aparecen errores "MySQL server has gone
# away" después de un rato sin tráfico.
# pool_recycle: además renueva cualquier conexión con más de 5 min de vida.
# connect_timeout: si el host no responde, falla en 10s en vez de colgarse
# (sin esto, un problema de red deja el arranque esperando indefinidamente
# hasta que Railway lo mata por healthcheck, minutos después).
engine = create_engine(
    url,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependencia de FastAPI: abre una sesión por petición y la cierra
    al terminar, incluso si hubo un error. Se usa con Depends(get_db)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
