import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import RutaProtegida from "@/components/RutaProtegida"
import Login from "@/pages/Login"
import AppLayout from "@/components/AppLayout"
import Turnos from "@/pages/Turnos"
import Atencion from "@/pages/Atencion"
import Reportes from "@/pages/Reportes"
import Auditoria from "@/pages/Auditoria"
import Usuarios from "@/pages/Usuarios"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Rutas con sesión iniciada (cualquier rol) */}
          <Route element={<RutaProtegida />}>
            <Route element={<AppLayout />}>
              <Route path="/turnos" element={<Turnos />} />

              {/* Back-office: solo el rol administrativo */}
              <Route element={<RutaProtegida soloAdministrativo />}>
                <Route path="/atencion" element={<Atencion />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/auditoria" element={<Auditoria />} />
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
