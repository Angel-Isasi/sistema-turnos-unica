import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# pool_pre_ping: verifica la conexión antes de usarla. Railway corta las
# conexiones inactivas y sin esto aparecen errores "MySQL server has gone
# away" después de un rato sin tráfico.
# pool_recycle: además renueva cualquier conexión con más de 5 min de vida.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
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
