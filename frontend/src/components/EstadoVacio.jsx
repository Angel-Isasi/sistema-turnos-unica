// Estado vacío diseñado (no ausente): usa el motivo de la marca para que
// una pantalla sin datos también se sienta parte del sistema.

import LineasDiagonales from "@/components/LineasDiagonales"

export default function EstadoVacio({ titulo, detalle, children, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden border border-dashed border-brand/30 rounded-lg p-8 sm:p-10 text-center ${className}`}
    >
      <LineasDiagonales opacidad={0.08} />
      <div className="relative">
        <p className="font-serif-display italic text-2xl text-text-dark/70 tracking-tight">
          {titulo}
        </p>
        {detalle && <p className="text-sm text-text-dark/55 mt-2">{detalle}</p>}
        {children}
      </div>
    </div>
  )
}
