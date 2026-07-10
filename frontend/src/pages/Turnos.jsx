import { useState } from "react"
import { Button } from "@/components/ui/button"
import EstadoBadge from "@/components/EstadoBadge"
import { SERVICIOS, COLA_INICIAL } from "@/data/mock"

// Correlativo siguiente por servicio, calculado a partir de la cola de hoy
function siguienteNumero(servicio) {
  const delServicio = COLA_INICIAL.filter((t) => t.numero.startsWith(servicio.prefijo + "-"))
  const mayor = delServicio.reduce((max, t) => {
    const n = parseInt(t.numero.split("-")[1], 10)
    return n > max ? n : max
  }, 0)
  return `${servicio.prefijo}-${String(mayor + 1).padStart(3, "0")}`
}

export default function Turnos() {
  const [seleccionado, setSeleccionado] = useState(null)
  const [turno, setTurno] = useState(null)

  const fecha = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const hoy = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  function sacarTurno() {
    if (!seleccionado) return
    setTurno({
      numero: siguienteNumero(seleccionado),
      servicio: seleccionado.nombre,
      ventanilla: seleccionado.ventanilla,
      posicion: seleccionado.enEspera + 1,
      esperaMin: (seleccionado.enEspera + 1) * seleccionado.minPorAtencion,
    })
  }

  function reiniciar() {
    setTurno(null)
    setSeleccionado(null)
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-brand">{hoy}</p>
        <h1 className="font-serif-display font-bold text-4xl text-text-dark mt-1">
          Sacar turno
        </h1>
        <p className="text-text-dark/60 mt-2">
          Elige el servicio que necesitas y te asignamos un número.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Selección de servicio o confirmación */}
        <div className="lg:col-span-2">
          {turno === null ? (
            <>
              <div className="border-t border-brand/15">
                {SERVICIOS.map((s) => {
                  const activo = seleccionado?.id === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeleccionado(s)}
                      className={`w-full text-left px-5 py-4 border-b border-brand/15 flex items-center gap-5 transition-colors ${
                        activo ? "bg-white" : "hover:bg-white/50"
                      }`}
                    >
                      <span
                        className={`font-serif-display font-bold text-xl w-8 shrink-0 ${
                          activo ? "text-brand" : "text-text-dark/30"
                        }`}
                      >
                        {s.prefijo}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-text-dark font-medium">{s.nombre}</span>
                        <span className="block text-sm text-text-dark/55 mt-0.5">
                          {s.descripcion}
                        </span>
                      </span>
                      <span className="text-right shrink-0 hidden sm:block">
                        <span className="block text-sm text-text-dark/70 tabular-nums">
                          {s.enEspera} en espera
                        </span>
                        <span className="block text-xs text-text-dark/45 mt-0.5">
                          ~{s.enEspera * s.minPorAtencion} min
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <Button
                onClick={sacarTurno}
                disabled={!seleccionado}
                className="bg-brand hover:bg-brand/90 mt-6 px-8"
              >
                {seleccionado ? `Sacar turno — ${seleccionado.nombre}` : "Elige un servicio"}
              </Button>
            </>
          ) : (
            <div className="bg-bg-base rounded-lg p-10 relative overflow-hidden">
              {/* Mismo motivo de líneas del login */}
              <svg
                className="absolute inset-0 opacity-30 w-full h-full"
                preserveAspectRatio="none"
              >
                <line x1="-10%" y1="20%" x2="70%" y2="-10%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
                <line x1="-10%" y1="55%" x2="80%" y2="15%" stroke="#F5F1E4" strokeWidth="2" strokeDasharray="6 8" />
                <line x1="-10%" y1="90%" x2="90%" y2="40%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
              </svg>

              <div className="relative z-10">
                <p className="text-text-secondary text-sm">Tu turno</p>
                <p className="font-serif-display italic text-7xl text-cream mt-2 mb-6">
                  {turno.numero}
                </p>

                <div className="grid sm:grid-cols-3 gap-6 border-t border-dashed border-sage/40 pt-6">
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Servicio</p>
                    <p className="text-cream mt-1">{turno.servicio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Posición en cola</p>
                    <p className="text-cream mt-1 tabular-nums">
                      {turno.posicion}.º — aprox. {turno.esperaMin} min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Te atiende</p>
                    <p className="text-cream mt-1">{turno.ventanilla}</p>
                  </div>
                </div>

                <p className="text-text-secondary text-sm mt-8">
                  Mantente atento a la pantalla y al altavoz. Si no respondes a tres
                  llamados, el turno se cancela.
                </p>

                <Button
                  onClick={reiniciar}
                  variant="outline"
                  className="mt-6 bg-transparent border-sage/50 text-cream hover:bg-cream/10 hover:text-cream"
                >
                  Sacar otro turno
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Cola en vivo */}
        <aside>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-text-dark font-semibold">En cola ahora</h2>
            <span className="text-xs text-text-dark/50 tabular-nums">
              {COLA_INICIAL.length} turnos
            </span>
          </div>

          <ul className="border-t border-brand/15">
            {COLA_INICIAL.map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-3 px-3 py-3 border-b border-brand/15 ${
                  t.estado === "llamado" ? "bg-white border-l-2 border-l-estado-llamado" : ""
                }`}
              >
                <span className="font-serif-display font-bold text-text-dark w-14 tabular-nums">
                  {t.numero}
                </span>
                <span className="flex-1 text-sm text-text-dark/60 truncate">{t.servicio}</span>
                <EstadoBadge estado={t.estado} />
              </li>
            ))}
          </ul>

          <p className="text-xs text-text-dark/45 mt-3">
            La cola se actualiza cada vez que una ventanilla llama al siguiente turno.
          </p>
        </aside>
      </div>
    </div>
  )
}
