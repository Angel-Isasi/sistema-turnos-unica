import { NavLink, Outlet, Link } from "react-router-dom"

const ENLACES = [
  { a: "/turnos", texto: "Turnos" },
  { a: "/atencion", texto: "Atención" },
  { a: "/reportes", texto: "Reportes" },
  { a: "/auditoria", texto: "Auditoría" },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="bg-bg-base border-b border-dashed border-sage/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/turnos" className="flex items-baseline gap-1.5">
            <span className="font-serif-display italic text-2xl text-cream">Turnos</span>
            <span className="font-serif-display font-bold text-2xl text-sage">UNICA</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-7">
            {ENLACES.map((e) => (
              <NavLink
                key={e.a}
                to={e.a}
                className={({ isActive }) =>
                  isActive
                    ? "text-sm text-cream border-b-2 border-sage pb-0.5"
                    : "text-sm text-text-secondary hover:text-cream transition-colors pb-0.5 border-b-2 border-transparent"
                }
              >
                {e.texto}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right leading-tight">
              <p className="text-sm text-cream">R. Peña</p>
              <p className="text-xs text-text-secondary">Mesa de ayuda</p>
            </div>
            <Link
              to="/"
              className="text-xs text-text-secondary hover:text-cream border border-sage/40 rounded px-3 py-1.5 transition-colors"
            >
              Salir
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-brand/15">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-text-dark/50">
            Universidad Nacional San Luis Gonzaga de Ica · Oficina de servicios académicos
          </p>
          <p className="text-xs text-text-dark/50">v0.1 — datos de prueba</p>
        </div>
      </footer>
    </div>
  )
}
