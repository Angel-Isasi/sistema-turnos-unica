// Datos de prueba mientras el backend no está conectado.
// La estructura imita las tablas: usuarios, servicios, turnos, atenciones, auditoria.

export const SERVICIOS = [
  {
    id: 1,
    prefijo: "C",
    nombre: "Constancia de estudios",
    descripcion: "Emisión de constancias de matrícula, egreso y quinto superior",
    ventanilla: "Ventanilla 1",
    enEspera: 5,
    minPorAtencion: 4,
  },
  {
    id: 2,
    prefijo: "A",
    nombre: "Consulta académica",
    descripcion: "Récord de notas, convalidaciones y rectificación de matrícula",
    ventanilla: "Ventanilla 2",
    enEspera: 3,
    minPorAtencion: 7,
  },
  {
    id: 3,
    prefijo: "M",
    nombre: "Mesa de partes",
    descripcion: "Recepción de solicitudes, expedientes y documentos en general",
    ventanilla: "Ventanilla 3",
    enEspera: 8,
    minPorAtencion: 3,
  },
  {
    id: 4,
    prefijo: "P",
    nombre: "Pagos y aranceles",
    descripcion: "Consulta de deudas, fraccionamiento y constancia de no adeudo",
    ventanilla: "Caja 1",
    enEspera: 2,
    minPorAtencion: 5,
  },
  {
    id: 5,
    prefijo: "T",
    nombre: "Trámite de título",
    descripcion: "Bachillerato, título profesional y duplicado de diploma",
    ventanilla: "Ventanilla 4",
    enEspera: 1,
    minPorAtencion: 12,
  },
]

// Cola del día, ordenada por hora de emisión
export const COLA_INICIAL = [
  { id: 101, numero: "M-031", servicio: "Mesa de partes", solicitante: "R. Quispe Anchante", estado: "llamado", emitido: "09:47" },
  { id: 102, numero: "C-018", servicio: "Constancia de estudios", solicitante: "L. Huamán Soto", estado: "encola", emitido: "09:52" },
  { id: 103, numero: "M-032", servicio: "Mesa de partes", solicitante: "S. Palomino Uchuya", estado: "encola", emitido: "09:55" },
  { id: 104, numero: "A-011", servicio: "Consulta académica", solicitante: "D. Cabezudo Peña", estado: "encola", emitido: "09:58" },
  { id: 105, numero: "P-009", servicio: "Pagos y aranceles", solicitante: "K. Loyola Ramos", estado: "encola", emitido: "10:03" },
  { id: 106, numero: "C-019", servicio: "Constancia de estudios", solicitante: "J. Aparcana Flores", estado: "encola", emitido: "10:06" },
  { id: 107, numero: "M-033", servicio: "Mesa de partes", solicitante: "V. Ferreyra Donayre", estado: "encola", emitido: "10:11" },
  { id: 108, numero: "T-004", servicio: "Trámite de título", solicitante: "E. Munayco Ledesma", estado: "encola", emitido: "10:14" },
]

// Turnos que ya pasaron por ventanilla hoy
export const HISTORIAL_HOY = [
  { id: 91, numero: "M-030", servicio: "Mesa de partes", solicitante: "G. Espino Tueros", estado: "atendido", emitido: "09:31", cerrado: "09:44" },
  { id: 90, numero: "A-010", servicio: "Consulta académica", solicitante: "F. Yataco Ormeño", estado: "atendido", emitido: "09:20", cerrado: "09:38" },
  { id: 89, numero: "C-017", servicio: "Constancia de estudios", solicitante: "P. Hernández Cusi", estado: "cancelado", emitido: "09:12", cerrado: "09:29" },
  { id: 88, numero: "M-029", servicio: "Mesa de partes", solicitante: "N. Gutiérrez Ronceros", estado: "atendido", emitido: "09:05", cerrado: "09:21" },
]

// ---- Reportes ----

export const RESUMEN_HOY = {
  emitidos: 86,
  atendidos: 71,
  cancelados: 6,
  esperaPromedioMin: 11,
  atencionPromedioMin: 6,
}

// Últimos 5 días hábiles (vie 3 jul – jue 9 jul, sin fin de semana)
export const TURNOS_POR_DIA = [
  { dia: "vie 3", emitidos: 77, atendidos: 70 },
  { dia: "lun 6", emitidos: 112, atendidos: 95 },
  { dia: "mar 7", emitidos: 94, atendidos: 81 },
  { dia: "mié 8", emitidos: 98, atendidos: 88 },
  { dia: "jue 9", emitidos: 86, atendidos: 71 },
]

export const TURNOS_POR_SERVICIO = [
  { servicio: "Mesa de partes", atendidos: 148, esperaMin: 14, atencionMin: 3 },
  { servicio: "Constancia de estudios", atendidos: 102, esperaMin: 9, atencionMin: 4 },
  { servicio: "Pagos y aranceles", atendidos: 71, esperaMin: 8, atencionMin: 5 },
  { servicio: "Consulta académica", atendidos: 54, esperaMin: 12, atencionMin: 7 },
  { servicio: "Trámite de título", atendidos: 30, esperaMin: 17, atencionMin: 12 },
]

// ---- Auditoría ----
// Espejo de la tabla `auditoria`: acción, usuario que la ejecutó, turno afectado y detalle.

export const AUDITORIA = [
  { id: 412, fecha: "2026-07-09", hora: "10:14:52", usuario: "kiosco-01", accion: "TURNO_CREADO", turno: "T-004", detalle: "Trámite de título · E. Munayco Ledesma" },
  { id: 411, fecha: "2026-07-09", hora: "10:11:08", usuario: "kiosco-02", accion: "TURNO_CREADO", turno: "M-033", detalle: "Mesa de partes · V. Ferreyra Donayre" },
  { id: 410, fecha: "2026-07-09", hora: "10:07:33", usuario: "rpena", accion: "TURNO_LLAMADO", turno: "M-031", detalle: "Llamado a Ventanilla 3" },
  { id: 409, fecha: "2026-07-09", hora: "10:06:41", usuario: "kiosco-01", accion: "TURNO_CREADO", turno: "C-019", detalle: "Constancia de estudios · J. Aparcana Flores" },
  { id: 408, fecha: "2026-07-09", hora: "10:03:17", usuario: "kiosco-01", accion: "TURNO_CREADO", turno: "P-009", detalle: "Pagos y aranceles · K. Loyola Ramos" },
  { id: 407, fecha: "2026-07-09", hora: "09:58:26", usuario: "kiosco-02", accion: "TURNO_CREADO", turno: "A-011", detalle: "Consulta académica · D. Cabezudo Peña" },
  { id: 406, fecha: "2026-07-09", hora: "09:55:02", usuario: "kiosco-01", accion: "TURNO_CREADO", turno: "M-032", detalle: "Mesa de partes · S. Palomino Uchuya" },
  { id: 405, fecha: "2026-07-09", hora: "09:52:44", usuario: "kiosco-01", accion: "TURNO_CREADO", turno: "C-018", detalle: "Constancia de estudios · L. Huamán Soto" },
  { id: 404, fecha: "2026-07-09", hora: "09:47:10", usuario: "kiosco-02", accion: "TURNO_CREADO", turno: "M-031", detalle: "Mesa de partes · R. Quispe Anchante" },
  { id: 403, fecha: "2026-07-09", hora: "09:44:58", usuario: "rpena", accion: "TURNO_ATENDIDO", turno: "M-030", detalle: "Atención cerrada en 13 min · Ventanilla 3" },
  { id: 402, fecha: "2026-07-09", hora: "09:38:21", usuario: "mgarcia", accion: "TURNO_ATENDIDO", turno: "A-010", detalle: "Atención cerrada en 18 min · Ventanilla 2" },
  { id: 401, fecha: "2026-07-09", hora: "09:31:47", usuario: "rpena", accion: "TURNO_LLAMADO", turno: "M-030", detalle: "Llamado a Ventanilla 3" },
  { id: 400, fecha: "2026-07-09", hora: "09:29:55", usuario: "jtasayco", accion: "TURNO_CANCELADO", turno: "C-017", detalle: "No se presentó tras 3 llamados" },
  { id: 399, fecha: "2026-07-09", hora: "09:21:12", usuario: "rpena", accion: "TURNO_ATENDIDO", turno: "M-029", detalle: "Atención cerrada en 16 min · Ventanilla 3" },
  { id: 398, fecha: "2026-07-09", hora: "09:03:36", usuario: "mgarcia", accion: "SESION_INICIADA", turno: "—", detalle: "Ingreso al módulo de atención" },
  { id: 397, fecha: "2026-07-09", hora: "09:01:14", usuario: "rpena", accion: "SESION_INICIADA", turno: "—", detalle: "Ingreso al módulo de atención" },
  { id: 396, fecha: "2026-07-08", hora: "16:42:09", usuario: "jtasayco", accion: "TURNO_ATENDIDO", turno: "T-003", detalle: "Atención cerrada en 22 min · Ventanilla 4" },
  { id: 395, fecha: "2026-07-08", hora: "16:18:30", usuario: "kiosco-01", accion: "TURNO_CREADO", turno: "T-003", detalle: "Trámite de título · H. Ochante Barrios" },
  { id: 394, fecha: "2026-07-08", hora: "15:55:47", usuario: "admin", accion: "SERVICIO_EDITADO", turno: "—", detalle: "Mesa de partes: horario de cierre 16:45" },
  { id: 393, fecha: "2026-07-08", hora: "15:31:05", usuario: "mgarcia", accion: "TURNO_CANCELADO", turno: "A-009", detalle: "Cancelado a pedido del solicitante" },
]

export const ACCIONES_AUDITORIA = [
  "TURNO_CREADO",
  "TURNO_LLAMADO",
  "TURNO_ATENDIDO",
  "TURNO_CANCELADO",
  "SESION_INICIADA",
  "SERVICIO_EDITADO",
]
