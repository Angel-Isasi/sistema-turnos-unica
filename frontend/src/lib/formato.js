// Formateo de fechas y horas para mostrar en pantalla.
// El backend siempre envía ISO 8601 con zona UTC; el navegador convierte
// automáticamente a la hora local del usuario (Perú).

export function horaCorta(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function fechaCorta(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("es-PE")
}

// "Jueves 10 de julio" — para los encabezados de página.
export function fechaLarga(fecha = new Date()) {
  const texto = fecha.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// "2026-07-06" -> "lun 6" — para las etiquetas del gráfico de reportes.
export function diaCorto(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return fecha
    .toLocaleDateString("es-PE", { weekday: "short", day: "numeric" })
    .replace(".", "")
}
