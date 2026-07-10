// Módulo de ventanilla (solo personal administrativo). Conectado al backend:
//   - GET /atencion/estado            turno actual + cola + historial de hoy
//   - POST /atencion/llamar-siguiente pasa el turno más antiguo a ventanilla
//   - POST /atencion/atender          cierra el turno como atendido
//   - POST /atencion/no-presentado    lo cancela (con confirmación previa)
// Extras de operación real: cronómetro en vivo, atajo de teclado N y
// selector de ventanilla.

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import EstadoBadge from "@/components/EstadoBadge"
import TicketTurno from "@/components/TicketTurno"
import EstadoVacio from "@/components/EstadoVacio"
import EstadoErrorCarga from "@/components/EstadoErrorCarga"
import ConfirmarDialogo from "@/components/ConfirmarDialogo"
import { api } from "@/lib/api"
import { horaCorta } from "@/lib/formato"

const REFRESCO_MS = 4000
const VENTANILLAS = [1, 2, 3, 4]

// "2:14" desde un instante ISO, actualizado cada segundo.
function Cronometro({ desdeIso }) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const segundos = Math.max(0, Math.floor((ahora - new Date(desdeIso).getTime()) / 1000))
  const m = Math.floor(segundos / 60)
  const s = String(segundos % 60).padStart(2, "0")
  return <span className="tabular-nums">{m}:{s}</span>
}

export default function Atencion() {
  const [estado, setEstado] = useState(null) // null = cargando
  const [errorCarga, setErrorCarga] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [ventanilla, setVentanilla] = useState(
    () => Number(localStorage.getItem("ventanilla")) || 3
  )

  const cargar = useCallback(async () => {
    try {
      setEstado(await api("/atencion/estado"))
      setErrorCarga(null)
    } catch (err) {
      setErrorCarga(err.message)
    }
  }, [])

  useEffect(() => {
    cargar()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") cargar()
    }, REFRESCO_MS)
    return () => clearInterval(id)
  }, [cargar])

  useEffect(() => {
    localStorage.setItem("ventanilla", String(ventanilla))
  }, [ventanilla])

  const actual = estado?.actual ?? null
  const cola = estado?.cola ?? []
  const historial = estado?.historial ?? []
  const atendidosHoy = historial.filter((t) => t.estado === "atendido").length

  async function ejecutar(ruta, cuerpo) {
    if (ocupado) return
    setOcupado(true)
    setAviso(null)
    try {
      await api(ruta, { metodo: "POST", cuerpo })
      await cargar()
    } catch (err) {
      setAviso(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const llamarSiguiente = () => ejecutar("/atencion/llamar-siguiente", { ventanilla })
  const marcarAtendido = () => ejecutar("/atencion/atender")
  function confirmarNoPresentado() {
    setConfirmando(false)
    ejecutar("/atencion/no-presentado")
  }

  // Atajo de teclado: N = llamar siguiente (el personal lo hace decenas de
  // veces al día). Se ignora si se está escribiendo en un campo.
  useEffect(() => {
    function alTeclear(e) {
      if (e.key.toLowerCase() !== "n") return
      const etiqueta = e.target.tagName
      if (etiqueta === "INPUT" || etiqueta === "SELECT" || etiqueta === "TEXTAREA") return
      if (actual || cola.length === 0 || ocupado || confirmando) return
      llamarSiguiente()
    }
    window.addEventListener("keydown", alTeclear)
    return () => window.removeEventListener("keydown", alTeclear)
  })

  if (errorCarga && estado === null) {
    return (
      <div>
        <EncabezadoAtencion ventanilla={ventanilla} setVentanilla={setVentanilla} bloqueado={false} />
        <EstadoErrorCarga mensaje={errorCarga} onReintentar={cargar} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <EncabezadoAtencion
          ventanilla={ventanilla}
          setVentanilla={setVentanilla}
          bloqueado={Boolean(actual)}
        />
        <p className="text-sm text-text-dark/55 tabular-nums">
          {cola.length} en espera · {atendidosHoy} atendidos hoy
        </p>
      </div>

      {estado === null ? (
        <div className="grid lg:grid-cols-3 gap-10 animate-pulse" aria-label="Cargando…">
          <div className="lg:col-span-2 bg-brand/5 rounded-lg h-64" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-brand/10 rounded" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Turno en ventanilla */}
          <div className="lg:col-span-2">
            {actual ? (
              <TicketTurno
                cabecera={
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-estado-llamado animate-pulse" />
                      <span className="text-text-secondary text-sm">Llamando ahora</span>
                    </span>
                    <span className="text-text-secondary/80 text-sm">
                      · llevas <Cronometro desdeIso={actual.llamadoEn} /> con este turno
                    </span>
                  </div>
                }
                numero={actual.numero}
                datos={[
                  { etiqueta: "Servicio", valor: actual.servicio },
                  { etiqueta: "Solicitante", valor: actual.solicitante },
                  { etiqueta: "Emitido", valor: horaCorta(actual.emitido) },
                ]}
              >
                {aviso && (
                  <p role="alert" className="text-sm text-estado-cancelado mt-6">
                    {aviso}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-8">
                  <Button
                    onClick={marcarAtendido}
                    disabled={ocupado}
                    className="bg-estado-atendido hover:bg-estado-atendido/90 px-6"
                  >
                    Marcar como atendido
                  </Button>
                  <Button
                    onClick={() => setConfirmando(true)}
                    disabled={ocupado}
                    variant="outline"
                    className="bg-transparent border-estado-cancelado/60 text-estado-cancelado hover:bg-estado-cancelado/10 hover:text-estado-cancelado"
                  >
                    No se presentó
                  </Button>
                </div>
              </TicketTurno>
            ) : (
              <EstadoVacio
                titulo="Ventanilla libre"
                detalle={
                  cola.length > 0
                    ? `El siguiente turno es ${cola[0].numero} — ${cola[0].servicio}.`
                    : "No quedan turnos en espera."
                }
              >
                {aviso && (
                  <p role="alert" className="text-sm text-estado-cancelado mt-4">
                    {aviso}
                  </p>
                )}
                <div className="mt-7">
                  <Button
                    onClick={llamarSiguiente}
                    disabled={cola.length === 0 || ocupado}
                    className="bg-brand hover:bg-brand/90 px-8"
                  >
                    {ocupado ? "Llamando…" : "Llamar siguiente"}
                  </Button>
                </div>
                <p className="text-xs text-text-dark/45 mt-4">
                  Atajo de teclado:{" "}
                  <kbd className="px-1.5 py-0.5 rounded border border-brand/25 bg-white text-[11px] font-medium text-text-dark/70">
                    N
                  </kbd>
                </p>
              </EstadoVacio>
            )}

            {/* Historial */}
            <h2 className="text-text-dark font-semibold mt-10 mb-3">Historial de hoy</h2>
            {historial.length === 0 ? (
              <p className="text-sm text-text-dark/50 border-t border-brand/15 pt-4">
                Aún no se cierra ningún turno hoy.
              </p>
            ) : (
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
                      {horaCorta(t.emitido)} → {horaCorta(t.cerrado)}
                    </span>
                    <EstadoBadge estado={t.estado} className="w-24 justify-end" />
                  </li>
                ))}
              </ul>
            )}
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
                    <span className="text-xs text-text-dark/50 tabular-nums">{horaCorta(t.emitido)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EstadoVacio
                titulo="Sin turnos en espera"
                detalle="Cuando un alumno saque un turno, aparecerá aquí."
              />
            )}

            {actual === null && cola.length > 0 && (
              <Button
                onClick={llamarSiguiente}
                disabled={ocupado}
                className="bg-brand hover:bg-brand/90 w-full mt-5"
              >
                Llamar siguiente
              </Button>
            )}
          </aside>
        </div>
      )}

      <ConfirmarDialogo
        abierto={confirmando}
        titulo="¿Marcar como no presentado?"
        descripcion={`El turno ${actual?.numero ?? ""} se cancelará y ${actual?.solicitante ?? "la persona"} tendrá que sacar uno nuevo si aún necesita el servicio.`}
        etiquetaConfirmar="Sí, no se presentó"
        onConfirmar={confirmarNoPresentado}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  )
}

function EncabezadoAtencion({ ventanilla, setVentanilla, bloqueado }) {
  return (
    <div>
      <p className="text-sm text-brand">Módulo de atención</p>
      <div className="flex items-center gap-3 mt-1">
        <h1 className="font-serif-display font-bold text-3xl sm:text-4xl text-text-dark tracking-tight">
          Ventanilla {ventanilla}
        </h1>
        <select
          value={ventanilla}
          onChange={(e) => setVentanilla(Number(e.target.value))}
          disabled={bloqueado}
          aria-label="Cambiar de ventanilla"
          title={bloqueado ? "Cierra el turno actual antes de cambiar de ventanilla" : undefined}
          className="h-8 rounded-md border border-brand/20 bg-white px-2 text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
        >
          {VENTANILLAS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
