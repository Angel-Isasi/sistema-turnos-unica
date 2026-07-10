import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import AppLayout from "@/components/AppLayout"
import Turnos from "@/pages/Turnos"
import Atencion from "@/pages/Atencion"
import Reportes from "@/pages/Reportes"
import Auditoria from "@/pages/Auditoria"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/atencion" element={<Atencion />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/auditoria" element={<Auditoria />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
