import { useState } from "react"
import { Input } from "@/components/ui/input"
import { AUDITORIA, ACCIONES_AUDITORIA } from "@/data/mock"

// Cómo se muestra cada acción registrada: etiqueta legible + color de estado
const ACCIONES = {
  TURNO_CREADO: { etiqueta: "Turno creado", punto: "bg-estado-encola" },
  TURNO_LLAMADO: { etiqueta: "Turno llamado", punto: "bg-estado-llamado" },
  TURNO_ATENDIDO: { etiqueta: "Turno atendido", punto: "bg-estado-atendido" },
  TURNO_CANCELADO: { etiqueta: "Turno cancelado", punto: "bg-estado-cancelado" },
  SESION_INICIADA: { etiqueta: "Sesión iniciada", punto: "bg-brand" },
  SERVICIO_EDITADO: { etiqueta: "Servicio editado", punto: "bg-sage" },
}

export default function Auditoria() {
  const [accion, setAccion] = useState("todas")
  const [busqueda, setBusqueda] = useState("")

  const texto = busqueda.trim().toLowerCase()
  const filas = AUDITORIA.filter((r) => {
    if (accion !== "todas" && r.accion !== accion) return false
    if (texto === "") return true
    return (
      r.usuario.toLowerCase().includes(texto) ||
      r.turno.toLowerCase().includes(texto) ||
      r.detalle.toLowerCase().includes(texto)
    )
  })

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-brand">Trazabilidad del sistema</p>
        <h1 className="font-serif-display font-bold text-4xl text-text-dark mt-1">Auditoría</h1>
        <p className="text-text-dark/60 mt-2">
          Registro de todas las acciones: quién generó cada turno, quién lo atendió y
          cada cambio de estado, con fecha y hora.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
          className="h-9 rounded-md border border-brand/20 bg-white px-3 text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="todas">Todas las acciones</option>
          {ACCIONES_AUDITORIA.map((a) => (
            <option key={a} value={a}>
              {ACCIONES[a]?.etiqueta ?? a}
            </option>
          ))}
        </select>

        <Input
          type="search"
          placeholder="Buscar por usuario, turno o detalle"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-white border-brand/20 max-w-xs"
        />
      </div>

      {/* Registro */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-brand/15 text-left">
              <th className="py-2.5 pr-4 font-medium text-text-dark/55 whitespace-nowrap">Fecha y hora</th>
              <th className="py-2.5 px-4 font-medium text-text-dark/55">Usuario</th>
              <th className="py-2.5 px-4 font-medium text-text-dark/55">Acción</th>
              <th className="py-2.5 px-4 font-medium text-text-dark/55">Turno</th>
              <th className="py-2.5 pl-4 font-medium text-text-dark/55">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => {
              const a = ACCIONES[r.accion] ?? { etiqueta: r.accion, punto: "bg-brand" }
              return (
                <tr key={r.id} className="border-b border-brand/15 align-top">
                  <td className="py-3 pr-4 whitespace-nowrap tabular-nums text-text-dark/70">
                    {r.fecha} <span className="text-text-dark/45">{r.hora}</span>
                  </td>
                  <td className="py-3 px-4 text-text-dark">{r.usuario}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-text-dark/80">
                      <span className={`h-1.5 w-1.5 rounded-full ${a.punto}`} />
                      {a.etiqueta}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-serif-display font-bold text-text-dark tabular-nums">
                    {r.turno}
                  </td>
                  <td className="py-3 pl-4 text-text-dark/70">{r.detalle}</td>
                </tr>
              )
            })}
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-text-dark/50">
                  Sin resultados para ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-dark/45 mt-4 tabular-nums">
        Mostrando {filas.length} de {AUDITORIA.length} registros · los eventos se conservan 12 meses
      </p>
    </div>
  )
}
