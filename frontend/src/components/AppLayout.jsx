import { NavLink, Outlet, Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import LineasDiagonales from "@/components/LineasDiagonales"

// La navegación depende del rol: el alumno solo ve el autoservicio de
// turnos; el back-office es del personal administrativo. (Ocultar enlaces
// es UX — la protección real está en los guards y en el backend.)
const ENLACES = [
  { a: "/turnos", texto: "Turnos" },
  { a: "/atencion", texto: "Atención", soloAdmin: true },
  { a: "/reportes", texto: "Reportes", soloAdmin: true },
  { a: "/auditoria", texto: "Auditoría", soloAdmin: true },
  { a: "/usuarios", texto: "Usuarios", soloAdmin: true },
]

const ETIQUETA_ROL = {
  administrativo: "Personal administrativo",
  alumno: "Alumno",
}

const claseEnlace = ({ isActive }) =>
  isActive
    ? "text-sm text-cream border-b-2 border-sage pb-0.5"
    : "text-sm text-text-secondary hover:text-cream transition-colors duration-150 pb-0.5 border-b-2 border-transparent"

export default function AppLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const enlaces = ENLACES.filter(
    (e) => !e.soloAdmin || usuario?.rol === "administrativo"
  )

  function salir() {
    cerrarSesion()
    navigate("/", { replace: true })
  }

  return (
    <div className="min-h-screen fondo-papel flex flex-col">
      <header className="bg-bg-base border-b border-dashed border-sage/40 relative overflow-hidden">
        {/* El motivo de la marca también vive en el header, muy tenue */}
        <LineasDiagonales opacidad={0.1} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/turnos" className="flex items-baseline gap-1.5 shrink-0">
            <span className="font-serif-display italic text-2xl text-cream">Turnos</span>
            <span className="font-serif-display font-bold text-2xl text-sage">UNICA</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-7">
            {enlaces.map((e) => (
              <NavLink key={e.a} to={e.a} className={claseEnlace}>
                {e.texto}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right leading-tight">
              <p className="text-sm text-cream">{usuario?.nombre}</p>
              <p className="text-xs text-text-secondary">
                {ETIQUETA_ROL[usuario?.rol] ?? usuario?.rol}
              </p>
            </div>
            <button
              onClick={salir}
              className="text-xs text-text-secondary hover:text-cream border border-sage/40 rounded px-3 py-1.5 transition-colors duration-150 active:scale-[0.98]"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Navegación móvil: misma lista, en fila deslizable */}
        <nav className="sm:hidden relative border-t border-sage/20 px-4 flex items-center gap-5 overflow-x-auto">
          {enlaces.map((e) => (
            <NavLink
              key={e.a}
              to={e.a}
              className={({ isActive }) =>
                isActive
                  ? "text-sm text-cream border-b-2 border-sage py-2.5 whitespace-nowrap"
                  : "text-sm text-text-secondary py-2.5 whitespace-nowrap border-b-2 border-transparent"
              }
            >
              {e.texto}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-brand/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-dark/50">
            Universidad Nacional San Luis Gonzaga de Ica · Oficina de servicios académicos
          </p>
          <p className="text-xs text-text-dark/50">v1.0 — datos en vivo</p>
        </div>
      </footer>
    </div>
  )
}
