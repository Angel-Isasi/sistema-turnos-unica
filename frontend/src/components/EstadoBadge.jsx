// Punto de color + etiqueta para el estado de un turno.
// Los colores vienen del @theme en index.css (estado-encola, llamado, atendido, cancelado).
// El estado "llamado" pulsa: es el único que está pasando AHORA.

const ESTADOS = {
  encola: { etiqueta: "En espera", punto: "bg-estado-encola" },
  llamado: { etiqueta: "Llamado", punto: "bg-estado-llamado animate-pulse" },
  atendido: { etiqueta: "Atendido", punto: "bg-estado-atendido" },
  cancelado: { etiqueta: "Cancelado", punto: "bg-estado-cancelado" },
}

export default function EstadoBadge({ estado, className = "" }) {
  const e = ESTADOS[estado]
  if (!e) return null

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-text-dark/70 ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      {e.etiqueta}
    </span>
  )
}
