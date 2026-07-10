# limitador.py
# Límite de peticiones por IP (rate limiting) con slowapi.
#
# Se define en su propio módulo para que main.py y las rutas importen la
# MISMA instancia sin importarse entre ellos (evita imports circulares).

from slowapi import Limiter
from slowapi.util import get_remote_address

limitador = Limiter(key_func=get_remote_address)
