// Cliente HTTP del frontend. Todas las llamadas al backend pasan por aquí:
// agrega el token de sesión, convierte errores HTTP en mensajes legibles y
// avisa al contexto de sesión cuando el token expiró (401).
//
// La URL del backend viene de VITE_API_URL (en Vercel se configura como
// variable de entorno del proyecto). En desarrollo apunta a uvicorn local.

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  constructor(mensaje, codigo) {
    super(mensaje)
    this.codigo = codigo
  }
}

// El AuthContext registra aquí qué hacer cuando una llamada devuelve 401
// (cerrar la sesión). Se hace por callback para no importar React aquí.
let manejarSesionExpirada = null
export function alExpirarSesion(fn) {
  manejarSesionExpirada = fn
}

export async function api(ruta, { metodo = "GET", cuerpo } = {}) {
  const token = localStorage.getItem("token")

  let respuesta
  try {
    respuesta = await fetch(API_URL + ruta, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisa tu conexión.", 0)
  }

  let datos = null
  try {
    datos = await respuesta.json()
  } catch {
    // respuesta sin cuerpo JSON: se queda en null
  }

  if (!respuesta.ok) {
    // Token vencido o inválido en una ruta protegida: se cierra la sesión.
    if (respuesta.status === 401 && token && manejarSesionExpirada) {
      manejarSesionExpirada()
    }
    let mensaje
    if (respuesta.status === 429) {
      mensaje = "Demasiados intentos. Espera un minuto y vuelve a probar."
    } else if (typeof datos?.detail === "string") {
      mensaje = datos.detail
    } else if (Array.isArray(datos?.detail) && datos.detail[0]?.msg) {
      mensaje = datos.detail[0].msg // error de validación de FastAPI
    } else {
      mensaje = "Ocurrió un error inesperado. Intenta de nuevo."
    }
    throw new ApiError(mensaje, respuesta.status)
  }

  return datos
}
