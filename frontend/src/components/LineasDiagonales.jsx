// Motivo visual de la marca: líneas diagonales punteadas.
// Nació en el login y se reutiliza en header, tickets, estados vacíos y
// separadores para que todo se sienta parte del mismo sistema.
// El contenedor padre debe tener position: relative y overflow-hidden.

const LINEAS = [
  { x1: "-10%", y1: "20%", x2: "70%", y2: "-10%", color: "#C9A278" },
  { x1: "-10%", y1: "55%", x2: "80%", y2: "15%", color: "#F5F1E4" },
  { x1: "-10%", y1: "90%", x2: "90%", y2: "40%", color: "#C9A278" },
  { x1: "5%", y1: "125%", x2: "105%", y2: "65%", color: "#F5F1E4" },
]

export default function LineasDiagonales({ opacidad = 0.3, className = "" }) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: opacidad }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {LINEAS.map((linea, i) => (
        <line
          key={i}
          x1={linea.x1}
          y1={linea.y1}
          x2={linea.x2}
          y2={linea.y2}
          stroke={linea.color}
          strokeWidth="2"
          strokeDasharray="6 8"
        />
      ))}
    </svg>
  )
}
