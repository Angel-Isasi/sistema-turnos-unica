// Diálogo de confirmación para acciones destructivas (ej. "No se presentó"
// cancela el turno de alguien: mejor preguntar antes que actuar al toque).

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export default function ConfirmarDialogo({
  abierto,
  titulo,
  descripcion,
  etiquetaConfirmar = "Confirmar",
  onConfirmar,
  onCancelar,
}) {
  const botonCancelar = useRef(null)

  useEffect(() => {
    if (!abierto) return
    botonCancelar.current?.focus()
    function alPresionarTecla(e) {
      if (e.key === "Escape") onCancelar()
    }
    window.addEventListener("keydown", alPresionarTecla)
    return () => window.removeEventListener("keydown", alPresionarTecla)
  }, [abierto, onCancelar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={titulo}
    >
      {/* Fondo oscurecido; clic afuera cancela */}
      <div className="absolute inset-0 bg-bg-base/60" onClick={onCancelar} />

      <div className="relative w-full max-w-sm rounded-lg border border-brand/20 bg-cream p-6 shadow-lg shadow-bg-base/20">
        <h2 className="font-serif-display font-bold text-xl text-text-dark tracking-tight">
          {titulo}
        </h2>
        <p className="text-sm text-text-dark/60 mt-2">{descripcion}</p>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            ref={botonCancelar}
            onClick={onCancelar}
            variant="outline"
            className="border-brand/25 bg-transparent text-text-dark hover:bg-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            className="bg-estado-cancelado text-white hover:bg-estado-cancelado/90"
          >
            {etiquetaConfirmar}
          </Button>
        </div>
      </div>
    </div>
  )
}
