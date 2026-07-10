// Autoservicio de turnos (el "totem"). Conectado al backend real:
//   - GET /servicios          catálogo con cola y espera estimada
//   - POST /turnos            saca un turno para el usuario de la sesión
//   - GET /turnos/mio         restaura el ticket si se recarga la página
//   - GET /turnos?estado=...  la cola en vivo (se refresca sola cada 5 s)

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import EstadoBadge from "@/components/EstadoBadge"
import TicketTurno from "@/components/TicketTurno"
import EstadoVacio from "@/components/EstadoVacio"
import EstadoErrorCarga from "@/components/EstadoErrorCarga"
import { api } from "@/lib/api"
import { fechaLarga } from "@/lib/formato"

const REFRESCO_MS = 5000

function FilasCargando({ filas = 4 }) {
  return (
    <div className="border-t border-brand/15 animate-pulse" aria-label="Cargando…">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="px-5 py-5 border-b border-brand/15 flex items-center gap-5">
          <span className="h-5 w-8 bg-brand/10 rounded" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-1/3 bg-brand/10 rounded" />
            <span className="block h-3 w-2/3 bg-brand/10 rounded" />
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Turnos() {
  const [servicios, setServicios] = useState(null) // null = cargando
  const [cola, setCola] = useState(null)
  const [turno, setTurno] = useState(undefined) // undefined = cargando, null = sin turno
  const [errorCarga, setErrorCarga] = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)
  const [creando, setCreando] = useState(false)
  const [avisoCrear, setAvisoCrear] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [listaServicios, colaViva, mio] = await Promise.all([
        api("/servicios"),
        api("/turnos?estado=encola,llamado"),
        api("/turnos/mio"),
      ])
      setServicios(listaServicios)
      setCola(colaViva)
      setTurno(mio)
      setErrorCarga(null)
    } catch (err) {
      setErrorCarga(err.message)
    }
  }, [])

  // Carga inicial + refresco automático (pausado si la pestaña está oculta).
  useEffect(() => {
    cargar()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") cargar()
    }, REFRESCO_MS)
    return () => clearInterval(id)
  }, [cargar])

  async function sacarTurno() {
    if (!seleccionado || creando) return
    setCreando(true)
    setAvisoCrear(null)
    try {
      const nuevo = await api("/turnos", {
        metodo: "POST",
        cuerpo: { servicio_id: seleccionado.id },
      })
      setTurno(nuevo)
      setSeleccionado(null)
      cargar()
    } catch (err) {
      setAvisoCrear(err.message)
    } finally {
      setCreando(false)
    }
  }

  const esLlamado = turno?.estado === "llamado"
  const cargandoTicket = turno === undefined && errorCarga === null

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-brand">{fechaLarga()}</p>
        <h1 className="font-serif-display font-bold text-3xl sm:text-4xl text-text-dark mt-1 tracking-tight">
          Sacar turno
        </h1>
        <p className="text-text-dark/60 mt-2">
          Elige el servicio que necesitas y te asignamos un número.
        </p>
      </div>

      {errorCarga && servicios === null ? (
        // Nunca llegó a cargar nada: error a pantalla completa con reintento.
        <EstadoErrorCarga mensaje={errorCarga} onReintentar={cargar} />
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {cargandoTicket ? (
              <div className="bg-brand/5 rounded-lg h-64 animate-pulse" aria-label="Cargando…" />
            ) : turno ? (
              // Ya hay un turno activo: se muestra el ticket, no el catálogo.
              <TicketTurno
                cabecera={
                  <div className="flex items-center gap-2">
                    {esLlamado && (
                      <span className="h-2 w-2 rounded-full bg-estado-llamado animate-pulse" />
                    )}
                    <p className={`text-sm ${esLlamado ? "text-cream" : "text-text-secondary"}`}>
                      {esLlamado
                        ? `¡Es tu turno! Acércate a ${turno.ventanilla}`
                        : "Tu turno"}
                    </p>
                  </div>
                }
                numero={turno.numero}
                datos={[
                  { etiqueta: "Servicio", valor: turno.servicio },
                  {
                    etiqueta: "Posición en cola",
                    valor: esLlamado
                      ? "En ventanilla ahora"
                      : `${turno.posicion}.º — aprox. ${turno.esperaMin} min`,
                  },
                  { etiqueta: "Te atiende", valor: turno.ventanilla },
                ]}
              >
                <p className="text-text-secondary text-sm mt-8">
                  Mantente atento a la pantalla y al altavoz. Si no respondes a tres
                  llamados, el turno se cancela.
                </p>
                <p className="text-text-secondary/70 text-xs mt-3">
                  Solo puedes tener un turno activo a la vez. Cuando te atiendan,
                  podrás sacar otro desde esta misma pantalla.
                </p>
              </TicketTurno>
            ) : (
              // Catálogo de servicios
              <>
                {servicios === null ? (
                  <FilasCargando filas={5} />
                ) : servicios.length === 0 ? (
                  <EstadoVacio
                    titulo="No hay servicios disponibles"
                    detalle="La oficina aún no habilitó servicios para hoy. Vuelve a intentarlo más tarde."
                  />
                ) : (
                  <div className="border-t border-brand/15">
                    {servicios.map((s) => {
                      const activo = seleccionado?.id === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSeleccionado(s)}
                          className={`w-full text-left px-5 py-4 border-b border-brand/15 flex items-center gap-5 transition-colors duration-150 ${
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
                              ~{Math.max(s.enEspera * s.minPorAtencion, s.minPorAtencion)} min
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {avisoCrear && (
                  <p role="alert" className="text-sm text-estado-cancelado mt-4">
                    {avisoCrear}
                  </p>
                )}

                {servicios !== null && servicios.length > 0 && (
                  <Button
                    onClick={sacarTurno}
                    disabled={!seleccionado || creando}
                    className="bg-brand hover:bg-brand/90 mt-6 px-8"
                  >
                    {creando
                      ? "Generando turno…"
                      : seleccionado
                        ? `Sacar turno — ${seleccionado.nombre}`
                        : "Elige un servicio"}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Cola en vivo */}
          <aside>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-text-dark font-semibold">En cola ahora</h2>
              {cola !== null && (
                <span className="text-xs text-text-dark/50 tabular-nums">
                  {cola.length} turnos
                </span>
              )}
            </div>

            {cola === null ? (
              <div className="border-t border-brand/15 animate-pulse space-y-3 pt-4" aria-label="Cargando…">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-brand/10 rounded" />
                ))}
              </div>
            ) : cola.length === 0 ? (
              <EstadoVacio
                titulo="La cola está vacía"
                detalle="Aquí aparecerán los turnos conforme se vayan emitiendo."
              />
            ) : (
              <ul className="border-t border-brand/15">
                {cola.map((t) => (
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
            )}

            <p className="text-xs text-text-dark/45 mt-3">
              La cola se actualiza sola cada pocos segundos.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
