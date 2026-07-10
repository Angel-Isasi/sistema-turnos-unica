import { useState } from "react"
import { Button } from "@/components/ui/button"
import EstadoBadge from "@/components/EstadoBadge"
import { COLA_INICIAL, HISTORIAL_HOY } from "@/data/mock"

function horaAhora() {
  return new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export default function Atencion() {
  // El turno en estado "llamado" arranca en ventanilla; el resto espera
  const [actual, setActual] = useState(COLA_INICIAL.find((t) => t.estado === "llamado") ?? null)
  const [cola, setCola] = useState(COLA_INICIAL.filter((t) => t.estado === "encola"))
  const [historial, setHistorial] = useState(HISTORIAL_HOY)

  function llamarSiguiente() {
    if (actual || cola.length === 0) return
    const [siguiente, ...resto] = cola
    setActual({ ...siguiente, estado: "llamado" })
    setCola(resto)
  }

  function cerrarTurno(estadoFinal) {
    if (!actual) return
    setHistorial([{ ...actual, estado: estadoFinal, cerrado: horaAhora() }, ...historial])
    setActual(null)
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-brand">Módulo de atención</p>
          <h1 className="font-serif-display font-bold text-4xl text-text-dark mt-1">
            Ventanilla 3
          </h1>
        </div>
        <p className="text-sm text-text-dark/55 tabular-nums">
          {cola.length} en espera · {historial.filter((t) => t.estado === "atendido").length} atendidos hoy
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Turno en ventanilla */}
        <div className="lg:col-span-2">
          {actual ? (
            <div className="bg-bg-base rounded-lg p-10 relative overflow-hidden">
              <svg className="absolute inset-0 opacity-30 w-full h-full" preserveAspectRatio="none">
                <line x1="-10%" y1="25%" x2="75%" y2="-10%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
                <line x1="-10%" y1="65%" x2="85%" y2="20%" stroke="#F5F1E4" strokeWidth="2" strokeDasharray="6 8" />
                <line x1="-10%" y1="105%" x2="95%" y2="50%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
              </svg>

              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-estado-llamado" />
                  <p className="text-text-secondary text-sm">Llamando ahora</p>
                </div>

                <p className="font-serif-display italic text-7xl text-cream mt-3">
                  {actual.numero}
                </p>

                <div className="grid sm:grid-cols-3 gap-6 border-t border-dashed border-sage/40 pt-6 mt-8">
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Servicio</p>
                    <p className="text-cream mt-1">{actual.servicio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Solicitante</p>
                    <p className="text-cream mt-1">{actual.solicitante}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Emitido</p>
                    <p className="text-cream mt-1 tabular-nums">{actual.emitido}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-10">
                  <Button
                    onClick={() => cerrarTurno("atendido")}
                    className="bg-estado-atendido hover:bg-estado-atendido/90 px-6"
                  >
                    Marcar como atendido
                  </Button>
                  <Button
                    onClick={() => cerrarTurno("cancelado")}
                    variant="outline"
                    className="bg-transparent border-estado-cancelado/60 text-estado-cancelado hover:bg-estado-cancelado/10 hover:text-estado-cancelado"
                  >
                    No se presentó
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-brand/30 rounded-lg p-10 text-center">
              <p className="font-serif-display italic text-3xl text-text-dark/70">
                Ventanilla libre
              </p>
              <p className="text-text-dark/55 mt-2 mb-8">
                {cola.length > 0
                  ? `El siguiente turno es ${cola[0].numero} — ${cola[0].servicio}.`
                  : "No quedan turnos en espera."}
              </p>
              <Button
                onClick={llamarSiguiente}
                disabled={cola.length === 0}
                className="bg-brand hover:bg-brand/90 px-8"
              >
                Llamar siguiente
              </Button>
            </div>
          )}

          {/* Historial */}
          <h2 className="text-text-dark font-semibold mt-10 mb-3">Historial de hoy</h2>
          <ul className="border-t border-brand/15">
            {historial.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-3 border-b border-brand/15">
                <span className="font-serif-display font-bold text-text-dark w-14 tabular-nums">
                  {t.numero}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-text-dark truncate">{t.solicitante}</span>
                  <span className="block text-xs text-text-dark/50 truncate">{t.servicio}</span>
                </span>
                <span className="text-xs text-text-dark/50 tabular-nums hidden sm:block">
                  {t.emitido} → {t.cerrado}
                </span>
                <EstadoBadge estado={t.estado} className="w-24 justify-end" />
              </li>
            ))}
          </ul>
        </div>

        {/* Cola de espera */}
        <aside>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-text-dark font-semibold">En espera</h2>
            <span className="text-xs text-text-dark/50 tabular-nums">{cola.length} turnos</span>
          </div>

          {cola.length > 0 ? (
            <ul className="border-t border-brand/15">
              {cola.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-3 border-b border-brand/15">
                  <span className="text-xs text-text-dark/40 w-4 tabular-nums">{i + 1}</span>
                  <span className="font-serif-display font-bold text-text-dark w-14 tabular-nums">
                    {t.numero}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-text-dark truncate">{t.solicitante}</span>
                    <span className="block text-xs text-text-dark/50 truncate">{t.servicio}</span>
                  </span>
                  <span className="text-xs text-text-dark/50 tabular-nums">{t.emitido}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-dark/50 border-t border-brand/15 pt-4">
              La cola está vacía.
            </p>
          )}

          {actual === null && cola.length > 0 && (
            <Button onClick={llamarSiguiente} className="bg-brand hover:bg-brand/90 w-full mt-5">
              Llamar siguiente
            </Button>
          )}
        </aside>
      </div>
    </div>
  )
}
