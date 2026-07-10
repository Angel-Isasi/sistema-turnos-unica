# auditoria_automatica.py
# Auditoría automática: UN SOLO punto que registra todas las acciones.
#
# En vez de insertar a mano una fila de auditoría dentro de cada endpoint
# (fácil de olvidar y repetitivo), este middleware observa cada petición:
# si coincide con el mapa de acciones, guarda quién la hizo, desde qué IP,
# y si terminó bien o mal — incluso los intentos de login fallidos y las
# peticiones bloqueadas por rate limit quedan registradas con "error".
#
# Los endpoints solo aportan contexto opcional vía request.state:
#   request.state.audit_turno   -> número de turno afectado ("M-031")
#   request.state.audit_detalle -> texto legible ("Llamado a Ventanilla 3")
#   request.state.audit_usuario_id -> usuario (solo login, que aún no tiene token)

from fastapi import Request

from database import SessionLocal
from models import Auditoria
from seguridad import decodificar_token

# (método, ruta) -> nombre de la acción en la tabla auditoria
ACCIONES_AUDITADAS = {
    ("POST", "/auth/login"): "SESION_INICIADA",
    ("POST", "/turnos"): "TURNO_CREADO",
    ("POST", "/atencion/llamar-siguiente"): "TURNO_LLAMADO",
    ("POST", "/atencion/atender"): "TURNO_ATENDIDO",
    ("POST", "/atencion/no-presentado"): "TURNO_CANCELADO",
    ("POST", "/usuarios"): "USUARIO_CREADO",
    ("POST", "/servicios"): "SERVICIO_CREADO",
}


async def middleware_auditoria(request: Request, call_next):
    accion = ACCIONES_AUDITADAS.get((request.method, request.url.path))
    if accion is None:
        # Petición que no nos interesa auditar: pasa de largo sin costo.
        return await call_next(request)

    respuesta = await call_next(request)

    # ¿Quién fue? El login lo deja en request.state; el resto de endpoints
    # llevan el usuario dentro de su propio token.
    usuario_id = getattr(request.state, "audit_usuario_id", None)
    if usuario_id is None:
        autorizacion = request.headers.get("authorization", "")
        if autorizacion.lower().startswith("bearer "):
            datos = decodificar_token(autorizacion[7:])
            if datos is not None:
                usuario_id = int(datos["sub"])

    detalle = getattr(request.state, "audit_detalle", None)
    if detalle is None and respuesta.status_code >= 400:
        detalle = f"Rechazado con código {respuesta.status_code}"

    db = SessionLocal()
    try:
        db.add(
            Auditoria(
                usuario_id=usuario_id,
                accion=accion,
                ip_host=request.client.host if request.client else None,
                resultado="ok" if respuesta.status_code < 400 else "error",
                turno_numero=getattr(request.state, "audit_turno", None),
                detalle=detalle,
            )
        )
        db.commit()
    finally:
        db.close()

    return respuesta
