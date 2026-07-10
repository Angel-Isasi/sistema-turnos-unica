// Route guard: protege grupos de rutas según la sesión y el rol.
// OJO: esto es solo experiencia de usuario — la protección real de datos
// está en el backend, que valida el rol del token en cada endpoint.

import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function RutaProtegida({ soloAdministrativo = false }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/" replace />
  }
  if (soloAdministrativo && usuario.rol !== "administrativo") {
    return <Navigate to="/turnos" replace />
  }
  return <Outlet />
}
