// Estado de error de carga con botón de reintento. Se muestra cuando un
// fetch falla (backend caído, sin conexión) en lugar de dejar la pantalla
// vacía sin explicación.

import { Button } from "@/components/ui/button"

export default function EstadoErrorCarga({ mensaje, onReintentar, className = "" }) {
  return (
    <div
      role="alert"
      className={`border border-estado-cancelado/30 bg-estado-cancelado/5 rounded-lg p-6 text-center ${className}`}
    >
      <p className="text-sm text-estado-cancelado">{mensaje}</p>
      {onReintentar && (
        <Button
          onClick={onReintentar}
          variant="outline"
          className="mt-4 border-brand/25 bg-transparent text-text-dark hover:bg-white"
        >
          Reintentar
        </Button>
      )}
    </div>
  )
}
