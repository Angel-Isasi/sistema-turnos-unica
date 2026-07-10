# main.py
# Punto de entrada del backend. Une todas las piezas:
#   base de datos -> migraciones -> seguridad -> rutas -> middlewares
#
# Variables de entorno que lee (ver .env.example):
#   DATABASE_URL  conexión MySQL (Railway)
#   JWT_SECRET    clave para firmar tokens (obligatoria en producción)
#   CORS_ORIGINS  orígenes permitidos, separados por coma
#   ENTORNO       "desarrollo" (default) o "produccion"

import os

import models
import routes_atencion
import routes_auditoria
import routes_auth
import routes_reportes
import routes_turnos
import routes_usuarios
from auditoria_automatica import middleware_auditoria
from database import engine
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from limitador import limitador
from migraciones import asegurar_columnas
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

load_dotenv()

# Crea las tablas que falten y agrega columnas nuevas a las ya existentes.
models.Base.metadata.create_all(bind=engine)
asegurar_columnas()

EN_PRODUCCION = os.getenv("ENTORNO", "desarrollo") == "produccion"

# CORS restringido: SOLO los orígenes de esta lista pueden llamar a la API
# desde un navegador. Nunca usar ["*"] en producción.
CORS_ORIGINS = [
    origen.strip()
    for origen in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origen.strip()
]

app = FastAPI(
    title="Sistema de Turnos UNICA",
    # En producción /docs y /openapi.json se apagan: así nadie del salón
    # tiene el catálogo de endpoints servido en bandeja para probar.
    docs_url=None if EN_PRODUCCION else "/docs",
    redoc_url=None,
    openapi_url=None if EN_PRODUCCION else "/openapi.json",
)

# Rate limiting (slowapi). Las rutas marcadas con @limitador.limit(...)
# responden 429 cuando una IP se pasa del límite.
app.state.limiter = limitador
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middlewares. El de CORS se agrega al final para quedar en la capa más
# externa y responder los preflight (OPTIONS) antes que todo lo demás.
app.middleware("http")(middleware_auditoria)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_auth.router)
app.include_router(routes_usuarios.router)
app.include_router(routes_turnos.router)
app.include_router(routes_atencion.router)
app.include_router(routes_reportes.router)
app.include_router(routes_auditoria.router)


@app.get("/")
def inicio():
    """Endpoint de salud: sirve para verificar que el servicio está vivo."""
    return {"mensaje": "El backend del sistema de turnos está funcionando"}
