// El número de turno como objeto físico: un ticket con esquina cortada,
// línea de desprendible punteada y muescas de perforación a los lados
// (círculos del color del fondo que "muerden" el borde del ticket).

import LineasDiagonales from "@/components/LineasDiagonales"

export default function TicketTurno({ cabecera, numero, datos = [], children }) {
  return (
    <div
      className="relative bg-bg-base rounded-lg overflow-hidden"
      style={{
        // Esquina superior derecha cortada, como un ticket troquelado.
        clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)",
      }}
    >
      <LineasDiagonales opacidad={0.3} />

      {/* Parte superior: el número grande */}
      <div className="relative z-10 px-6 sm:px-10 pt-8 sm:pt-10 pb-6">
        {cabecera}
        <p className="font-serif-display italic text-6xl sm:text-7xl text-cream mt-2 tracking-tight">
          {numero}
        </p>
      </div>

      {/* Línea de desprendible con muescas de perforación */}
      <div className="relative z-10 flex items-center" aria-hidden="true">
        <span className="h-5 w-5 -ml-2.5 shrink-0 rounded-full bg-cream" />
        <span className="flex-1 mx-2 border-t-2 border-dashed border-sage/40" />
        <span className="h-5 w-5 -mr-2.5 shrink-0 rounded-full bg-cream" />
      </div>

      {/* Parte inferior: los datos del turno */}
      <div className="relative z-10 px-6 sm:px-10 pt-6 pb-8 sm:pb-10">
        {datos.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-6">
            {datos.map((dato) => (
              <div key={dato.etiqueta}>
                <p className="text-xs text-text-secondary uppercase tracking-wide">
                  {dato.etiqueta}
                </p>
                <p className="text-cream mt-1">{dato.valor}</p>
              </div>
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
