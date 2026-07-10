// Auditoría (solo personal administrativo). Las filas las escribe el
// middleware de auditoría automática del backend; aquí solo se consultan
// (GET /auditoria), se filtran y se pueden exportar a CSV en el navegador.

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import EstadoVacio from "@/components/EstadoVacio"
import EstadoErrorCarga from "@/components/EstadoErrorCarga"
import { api } from "@/lib/api"
import { fechaCorta, horaCorta } from "@/lib/formato"

// Cómo se muestra cada acción registrada: etiqueta legible + color de estado
const ACCIONES = {
  TURNO_CREADO: { etiqueta: "Turno creado", punto: "bg-estado-encola" },
  TURNO_LLAMADO: { etiqueta: "Turno llamado", punto: "bg-estado-llamado" },
  TURNO_ATENDIDO: { etiqueta: "Turno atendido", punto: "bg-estado-atendido" },
  TURNO_CANCELADO: { etiqueta: "Turno cancelado", punto: "bg-estado-cancelado" },
  SESION_INICIADA: { etiqueta: "Sesión iniciada", punto: "bg-brand" },
  USUARIO_CREADO: { etiqueta: "Usuario creado", punto: "bg-sage" },
  SERVICIO_CREADO: { etiqueta: "Servicio creado", punto: "bg-sage" },
}

function exportarCSV(filas) {
  const encabezado = ["Fecha", "Hora", "Usuario", "Acción", "Turno", "Detalle", "Resultado"]
  const datos = filas.map((r) => [
    fechaCorta(r.fecha), horaCorta(r.fecha), r.usuario,
    ACCIONES[r.accion]?.etiqueta ?? r.accion, r.turno, r.detalle, r.resultado,
  ])
  const escapar = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`
  const csv = [encabezado, ...datos]
    .map((fila) => fila.map(escapar).join(","))
    .join("\r\n")

  // El BOM (﻿) hace que Excel abra el UTF-8 con tildes correctas.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(url)
}

export default function Auditoria() {
  const [filas, setFilas] = useState(null) // null = cargando
  const [errorCarga, setErrorCarga] = useState(null)
  const [accion, setAccion] = useState("todas")
  const [busqueda, setBusqueda] = useState("")
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vigente = true
    setFilas(null)
    setErrorCarga(null)
    const filtro = accion === "todas" ? "" : `?accion=${accion}`
    api(`/auditoria${filtro}`)
      .then((datos) => vigente && setFilas(datos))
      .catch((err) => vigente && setErrorCarga(err.message))
    return () => {
      vigente = false
    }
  }, [accion, reintento])

  const texto = busqueda.trim().toLowerCase()
  const visibles = (filas ?? []).filter((r) => {
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
        <h1 className="font-serif-display font-bold text-3xl sm:text-4xl text-text-dark mt-1 tracking-tight">
          Auditoría
        </h1>
        <p className="text-text-dark/60 mt-2">
          Registro automático de todas las acciones: quién generó cada turno,
          quién lo atendió y cada intento de ingreso, con fecha, hora e IP de origen.
        </p>
      </div>

      {/* Filtros + exportación */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
          className="h-9 rounded-md border border-brand/20 bg-white px-3 text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="todas">Todas las acciones</option>
          {Object.entries(ACCIONES).map(([valor, a]) => (
            <option key={valor} value={valor}>
              {a.etiqueta}
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

        <Button
          onClick={() => exportarCSV(visibles)}
          disabled={visibles.length === 0}
          variant="outline"
          className="ml-auto border-brand/25 bg-transparent text-text-dark hover:bg-white"
        >
          Exportar CSV ({visibles.length})
        </Button>
      </div>

      {errorCarga ? (
        <EstadoErrorCarga mensaje={errorCarga} onReintentar={() => setReintento((n) => n + 1)} />
      ) : filas === null ? (
        <div className="border-t border-brand/15 animate-pulse space-y-3 pt-4" aria-label="Cargando…">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 bg-brand/10 rounded" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <EstadoVacio
          titulo="Sin actividad registrada"
          detalle="Cada login, turno emitido, llamado o cierre quedará registrado aquí automáticamente."
        />
      ) : (
        <>
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
                {visibles.map((r) => {
                  const a = ACCIONES[r.accion] ?? { etiqueta: r.accion, punto: "bg-brand" }
                  return (
                    <tr key={r.id} className="border-b border-brand/15 align-top">
                      <td className="py-3 pr-4 whitespace-nowrap tabular-nums text-text-dark/70">
                        {fechaCorta(r.fecha)}{" "}
                        <span className="text-text-dark/45">{horaCorta(r.fecha)}</span>
                      </td>
                      <td className="py-3 px-4 text-text-dark">{r.usuario}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-text-dark/80">
                          <span className={`h-1.5 w-1.5 rounded-full ${a.punto}`} />
                          {a.etiqueta}
                        </span>
                        {r.resultado === "error" && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-estado-cancelado border border-estado-cancelado/40 rounded px-1 py-0.5">
                            error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-serif-display font-bold text-text-dark tabular-nums">
                        {r.turno}
                      </td>
                      <td className="py-3 pl-4 text-text-dark/70">{r.detalle}</td>
                    </tr>
                  )
                })}
                {visibles.length === 0 && (
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
            Mostrando {visibles.length} de {filas.length} registros recientes
          </p>
        </>
      )}
    </div>
  )
}
