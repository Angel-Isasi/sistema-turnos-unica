// Reportes de gestión (solo personal administrativo). Los datos vienen de
// GET /reportes/resumen?rango=hoy|semana|mes — agregaciones SQL reales
// (COUNT, AVG, GROUP BY) sobre turnos y atenciones.

import { useEffect, useState } from "react"
import EstadoVacio from "@/components/EstadoVacio"
import EstadoErrorCarga from "@/components/EstadoErrorCarga"
import LineasDiagonales from "@/components/LineasDiagonales"
import { api } from "@/lib/api"
import { diaCorto } from "@/lib/formato"

const RANGOS = [
  { valor: "hoy", texto: "Hoy" },
  { valor: "semana", texto: "Esta semana" },
  { valor: "mes", texto: "Este mes" },
]

const SUBTITULO = {
  hoy: "Movimiento de hoy en la oficina",
  semana: "Movimiento de los últimos 7 días",
  mes: "Movimiento de los últimos 30 días",
}

// ---- Gráfico de barras agrupadas (SVG a mano) ----
// Serie "emitidos" en arena (#C9A278) y "atendidos" en bronce (#8B5E3C).

const ANCHO = 600
const ALTO = 240
const PAD_IZQ = 36
const PAD_ABAJO = 28
const PAD_ARRIBA = 12

// Barra con la punta redondeada (4px) y la base recta
function barra(x, yTop, ancho, r = 4) {
  const base = ALTO - PAD_ABAJO
  const alto = base - yTop
  if (alto <= 0) return ""
  const rr = Math.min(r, alto, ancho / 2)
  return [
    `M ${x} ${base}`,
    `L ${x} ${yTop + rr}`,
    `Q ${x} ${yTop} ${x + rr} ${yTop}`,
    `L ${x + ancho - rr} ${yTop}`,
    `Q ${x + ancho} ${yTop} ${x + ancho} ${yTop + rr}`,
    `L ${x + ancho} ${base}`,
    "Z",
  ].join(" ")
}

function GraficoDias({ datos }) {
  const [activo, setActivo] = useState(null)

  // Escala vertical adaptada a los datos reales (múltiplo de 4 para que
  // las 4 divisiones de la cuadrícula sean números enteros).
  const maxValor = Math.max(1, ...datos.map((d) => Math.max(d.emitidos, d.atendidos)))
  const Y_MAX = Math.max(4, Math.ceil(maxValor / 4) * 4)
  const TICKS = [0, Y_MAX / 4, Y_MAX / 2, (Y_MAX * 3) / 4, Y_MAX]

  const plotAlto = ALTO - PAD_ABAJO - PAD_ARRIBA
  const grupoAncho = (ANCHO - PAD_IZQ) / datos.length
  const barraAncho = 20
  const escalaY = (v) => ALTO - PAD_ABAJO - (v / Y_MAX) * plotAlto

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img"
        aria-label="Turnos emitidos y atendidos por día">
        {/* Cuadrícula recesiva */}
        {TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD_IZQ} x2={ANCHO} y1={escalaY(t)} y2={escalaY(t)}
              stroke="#2A1F1A" strokeOpacity={t === 0 ? 0.25 : 0.08} strokeWidth="1"
            />
            <text x={PAD_IZQ - 8} y={escalaY(t) + 3} textAnchor="end" fontSize="10" fill="#2A2A24" fillOpacity="0.5">
              {t}
            </text>
          </g>
        ))}

        {datos.map((d, i) => {
          const cx = PAD_IZQ + grupoAncho * (i + 0.5)
          const xEmitidos = cx - barraAncho - 1
          const xAtendidos = cx + 1
          const esUltimo = i === datos.length - 1
          const apagado = activo !== null && activo !== i

          return (
            <g
              key={d.fecha}
              opacity={apagado ? 0.45 : 1}
              onMouseEnter={() => setActivo(i)}
              onMouseLeave={() => setActivo(null)}
            >
              {/* Zona de hover más grande que las barras */}
              <rect x={cx - grupoAncho / 2} y={PAD_ARRIBA} width={grupoAncho} height={plotAlto} fill="transparent" />

              <path d={barra(xEmitidos, escalaY(d.emitidos), barraAncho)} fill="#C9A278" />
              <path d={barra(xAtendidos, escalaY(d.atendidos), barraAncho)} fill="#8B5E3C" />

              {/* Etiqueta directa solo en el día más reciente */}
              {esUltimo && (
                <>
                  <text x={xEmitidos + barraAncho / 2} y={escalaY(d.emitidos) - 5} textAnchor="middle" fontSize="10" fill="#2A2A24" fillOpacity="0.7">
                    {d.emitidos}
                  </text>
                  <text x={xAtendidos + barraAncho / 2} y={escalaY(d.atendidos) - 5} textAnchor="middle" fontSize="10" fill="#2A2A24" fillOpacity="0.7">
                    {d.atendidos}
                  </text>
                </>
              )}

              <text x={cx} y={ALTO - 8} textAnchor="middle" fontSize="11" fill="#2A2A24" fillOpacity="0.6">
                {diaCorto(d.fecha)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {activo !== null && (
        <div
          className="absolute -translate-x-1/2 bg-bg-base text-cream text-xs rounded px-3 py-2 pointer-events-none shadow-sm"
          style={{
            left: `${((PAD_IZQ + grupoAncho * (activo + 0.5)) / ANCHO) * 100}%`,
            top: 0,
          }}
        >
          <p className="text-text-secondary capitalize">{diaCorto(datos[activo].fecha)}</p>
          <p className="tabular-nums">{datos[activo].emitidos} emitidos · {datos[activo].atendidos} atendidos</p>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-5 mt-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-text-dark/70">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-sage" /> Emitidos
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-text-dark/70">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-brand" /> Atendidos
        </span>
      </div>
    </div>
  )
}

// ---- Barras horizontales por servicio (una sola serie, valor en la punta) ----

function BarrasServicio({ datos }) {
  const max = Math.max(1, ...datos.map((d) => d.atendidos))
  return (
    <ul className="space-y-4">
      {datos.map((d) => (
        <li key={d.servicio}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm text-text-dark">{d.servicio}</span>
            <span className="text-sm text-text-dark/70 tabular-nums">{d.atendidos}</span>
          </div>
          <div className="h-3 bg-brand/10 rounded-r">
            <div
              className="h-full bg-brand rounded-r transition-all duration-300"
              style={{ width: `${(d.atendidos / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function notaEmitidos(reporte) {
  if (reporte.rango !== "hoy") return "en el rango elegido"
  const diferencia = reporte.emitidos - reporte.emitidosAyer
  if (diferencia > 0) return `${diferencia} más que ayer`
  if (diferencia < 0) return `${-diferencia} menos que ayer`
  return "igual que ayer"
}

export default function Reportes() {
  const [rango, setRango] = useState("hoy")
  const [reporte, setReporte] = useState(null)
  const [errorCarga, setErrorCarga] = useState(null)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vigente = true
    setReporte(null)
    setErrorCarga(null)
    api(`/reportes/resumen?rango=${rango}`)
      .then((datos) => vigente && setReporte(datos))
      .catch((err) => vigente && setErrorCarga(err.message))
    return () => {
      vigente = false
    }
  }, [rango, reintento])

  const tarjetas = reporte
    ? [
        { etiqueta: "Turnos emitidos", valor: reporte.emitidos, nota: notaEmitidos(reporte) },
        { etiqueta: "Atendidos", valor: reporte.atendidos, nota: `${reporte.cancelados} cancelados` },
        { etiqueta: "Espera promedio", valor: `${reporte.esperaPromedioMin} min`, nota: "desde emisión al llamado" },
        { etiqueta: "Atención promedio", valor: `${reporte.atencionPromedioMin} min`, nota: "en ventanilla" },
      ]
    : []

  const lider = reporte?.porServicio?.[0]

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-brand">{SUBTITULO[rango]}</p>
          <h1 className="font-serif-display font-bold text-3xl sm:text-4xl text-text-dark mt-1 tracking-tight">
            Reportes
          </h1>
          <p className="text-text-dark/60 mt-2">
            Movimiento de colas y tiempos de atención de la oficina.
          </p>
        </div>

        {/* Selector de rango de fechas */}
        <div className="inline-flex rounded-md border border-brand/20 bg-white p-0.5" role="group" aria-label="Rango de fechas">
          {RANGOS.map((r) => (
            <button
              key={r.valor}
              type="button"
              onClick={() => setRango(r.valor)}
              className={`px-3.5 py-1.5 text-sm rounded transition-colors duration-150 active:scale-[0.98] ${
                rango === r.valor
                  ? "bg-brand text-cream"
                  : "text-text-dark/60 hover:text-text-dark"
              }`}
            >
              {r.texto}
            </button>
          ))}
        </div>
      </div>

      {errorCarga ? (
        <EstadoErrorCarga mensaje={errorCarga} onReintentar={() => setReintento((n) => n + 1)} />
      ) : reporte === null ? (
        <div className="animate-pulse" aria-label="Cargando…">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-brand/5 rounded" />
            ))}
          </div>
          <div className="h-64 bg-brand/5 rounded" />
        </div>
      ) : (
        <>
          {/* Indicadores del rango */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-brand/15 divide-x divide-brand/15 mb-10">
            {tarjetas.map((t) => (
              <div key={t.etiqueta} className="px-5 py-6 first:pl-0">
                <p className="text-xs text-text-dark/55 uppercase tracking-wide">{t.etiqueta}</p>
                <p className="text-3xl font-semibold text-text-dark mt-2 tabular-nums">{t.valor}</p>
                <p className="text-xs text-text-dark/45 mt-1">{t.nota}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-12 mb-4">
            <section className="lg:col-span-3">
              <h2 className="text-text-dark font-semibold">Turnos por día</h2>
              <p className="text-sm text-text-dark/55 mb-5">Últimos cinco días</p>
              <GraficoDias datos={reporte.porDia} />
            </section>

            <section className="lg:col-span-2">
              <h2 className="text-text-dark font-semibold">Atendidos por servicio</h2>
              <p className="text-sm text-text-dark/55 mb-5">
                {lider ? `${lider.servicio} lidera` : "Sin atenciones cerradas todavía"}
              </p>
              {reporte.porServicio.length > 0 ? (
                <BarrasServicio datos={reporte.porServicio} />
              ) : (
                <EstadoVacio
                  titulo="Sin datos en este rango"
                  detalle="Cuando se atiendan turnos, el ranking aparecerá aquí."
                />
              )}
            </section>
          </div>

          {/* Separador con el motivo de la marca */}
          <div className="relative overflow-hidden h-6 mb-8" aria-hidden="true">
            <LineasDiagonales opacidad={0.15} />
          </div>

          {/* Vista de tabla: mismos datos, en detalle */}
          <section>
            <h2 className="text-text-dark font-semibold mb-3">Tiempos por servicio</h2>
            {reporte.porServicio.length === 0 ? (
              <p className="text-sm text-text-dark/50 border-t border-brand/15 pt-4">
                Aún no hay atenciones cerradas en este rango, así que no hay
                tiempos que mostrar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-brand/15 text-left">
                      <th className="py-2.5 pr-4 font-medium text-text-dark/55">Servicio</th>
                      <th className="py-2.5 px-4 font-medium text-text-dark/55 text-right">Atendidos</th>
                      <th className="py-2.5 px-4 font-medium text-text-dark/55 text-right">Espera promedio</th>
                      <th className="py-2.5 pl-4 font-medium text-text-dark/55 text-right">Atención promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.porServicio.map((d) => (
                      <tr key={d.servicio} className="border-b border-brand/15">
                        <td className="py-2.5 pr-4 text-text-dark">{d.servicio}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-text-dark/80">{d.atendidos}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-text-dark/80">{d.esperaMin} min</td>
                        <td className="py-2.5 pl-4 text-right tabular-nums text-text-dark/80">{d.atencionMin} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-text-dark/45 mt-3">
              El tiempo de espera se mide desde la emisión del turno hasta el primer llamado.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
