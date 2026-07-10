// Sesión del usuario: quién está logueado y con qué rol.
// El token JWT y los datos básicos viven en localStorage para sobrevivir a
// una recarga; el contexto los expone a toda la app.

import { createContext, useContext, useEffect, useState } from "react"
import { api, alExpirarSesion } from "@/lib/api"

const AuthContext = createContext(null)

function usuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem("usuario"))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioGuardado)

  function iniciarSesion(token, datosUsuario) {
    localStorage.setItem("token", token)
    localStorage.setItem("usuario", JSON.stringify(datosUsuario))
    setUsuario(datosUsuario)
  }

  function cerrarSesion() {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    setUsuario(null)
  }

  useEffect(() => {
    // Cualquier 401 del backend (token vencido/manipulado) cierra la sesión;
    // los guards de ruta se encargan de mandar al login.
    alExpirarSesion(cerrarSesion)

    // Al cargar la app se revalida el token contra el backend: si ya no
    // sirve, el 401 dispara el cierre de sesión de arriba.
    if (localStorage.getItem("token")) {
      api("/auth/yo")
        .then((datos) => {
          setUsuario(datos)
          localStorage.setItem("usuario", JSON.stringify(datos))
        })
        .catch(() => {})
    }
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
