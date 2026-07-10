# Asesoría del proyecto — Sistema de Turnos UNICA

Notas de trabajo, no documentación oficial del sistema. Fecha de esta ronda: 2026-07-09.

---

## 1. Roles: ¿separar alumno vs. administrativo?

**Sí, hazlo.** Es el patrón correcto y además ya tienes el terreno preparado: tu tabla
`usuarios` (`backend/models.py:14`) ya tiene una columna `rol`. No hay que rediseñar
nada, solo usar ese campo que ya existe.

### Qué pantalla ve cada rol

| Pantalla | Alumno | Administrativo |
|---|---|---|
| Turnos (sacar turno) | Sí | Opcional — no lo necesita, pero no molesta |
| Atención (ventanilla) | **No** | Sí |
| Reportes | **No** | Sí |
| Auditoría | **No** | Sí |

Razonamiento: "Turnos" es autoservicio (como un totem de banco), el resto es
back-office. Es exactamente como funcionan los sistemas de colas reales — el
alumno nunca ve el panel del operador.

Si quieres un extra que impresione más al profesor sin mucho esfuerzo: un
tercer rol `coordinador` que sea el único que ve Auditoría (el administrativo
normal solo ve Atención). Es opcional — con 2 roles ya está completo y limpio.
No lo agregues si no tienes tiempo de sobra.

### Cómo implementarlo (a alto nivel, para cuando quieras que lo construya)

1. **Backend**: el login (`POST /login` o similar, aún no existe) debe devolver
   un JWT que incluya el `rol` del usuario. Cada endpoint sensible
   (`/atencion/*`, `/reportes/*`, `/auditoria/*`) valida ese rol en el backend,
   no solo en el frontend.
2. **Frontend**: guardas el usuario + rol (context de React, o simplemente
   `localStorage` para este alcance de proyecto). El `AppLayout` oculta los
   enlaces de navegación que no le corresponden al rol. Además, cada ruta
   protegida redirige a "Turnos" si el rol no califica (esto ya se llama
   "route guard").

**Punto crítico de seguridad, no lo pases por alto**: ocultar el link en el
menú es solo estética. Si el backend no valida el rol en cada endpoint, un
alumno con conocimientos básicos (y en tu salón hay 20 de sistemas) puede
abrir el DevTools, copiar el token, y golpear `/atencion/llamar-siguiente`
directo con `curl` o Postman sin pasar por tu interfaz. La protección real
vive en el backend. Esto lo retomo en la sección de seguridad más abajo.

---

## 2. Turnos — mostrar el rol junto al nombre + feedback de diseño

**Mostrar el rol**: sencillo, un texto pequeño debajo del nombre en el header
(`AppLayout.jsx`), tipo "R. Peña — Personal administrativo" o para un alumno
"L. Huamán — Alumno". Cuando conectemos el login real esto sale solo del JWT.

**Sobre el diseño — la pregunta de fondo**: "¿cómo lo llevo de un 18 a un 20
evitando que se vea genérico/IA?"

Ya evitaste las trampas más comunes de "se ve hecho por IA": nada de
gradientes morado-a-azul, nada de glassmorphism, nada de tarjetas con iconos
en círculos de colores pastel, nada de `shadow-lg rounded-2xl` en todo. Tu
paleta café/bronce, la tipografía Fraunces serif para marca, los hairlines en
vez de sombras — eso ya te separa del 90% de lo que sale de un prompt
genérico. Lo que falta no es corregir errores, es *agregar carácter*. Ahí es
donde entra el trabajo de un diseñador con experiencia — no corrige, **acumula
detalles pequeños y deliberados**. Concretamente:

1. **Explota tu propio motivo visual, no lo dejes solo en el login.**
   Las líneas diagonales punteadas ya son tu "firma" — actualmente solo
   viven en el panel oscuro del login y en las tarjetas de turno actual.
   Un diseñador profesional reutiliza el mismo motivo en más lugares para que
   se sienta como un *sistema*, no como una plantilla: en el fondo del header,
   como separador entre secciones de Reportes, en el estado vacío de una
   cola sin turnos. La repetición intencional de un patrón propio es lo que
   hace que algo se sienta "diseñado" y no "generado".

2. **El número de turno merece ser un objeto, no solo texto.**
   Ahora es un texto grande en Fraunces itálica — se ve bien, pero un ticket
   de verdad tiene *forma de ticket*: bordes con muesca de perforación (se
   logra con `mask` o un `border-image` dentado), una esquina cortada, una
   línea punteada horizontal simulando el desprendible. Es un detalle de
   una tarde de trabajo que hace que la pantalla de "Turnos" se sienta como
   un objeto físico y no una tarjeta de Bootstrap con otro color.

3. **Textura sutil de papel en el panel crema.**
   Un ruido/grano muy sutil (2-3% de opacidad, generado con SVG
   `feTurbulence`, cero peso de imagen externa) sobre el fondo crema conecta
   con el tema de "trámites universitarios / papeleo" y es exactamente el
   tipo de detalle que un ojo entrenado nota y una IA genérica nunca agrega
   (porque no tiene "por qué" temático, solo lo copiaría de una plantilla).

4. **Micro-interacciones con intención, no decoración.**
   Transiciones de 150-200ms en hover/focus, un `scale-[0.98]` sutil al
   presionar un botón, el punto de estado (ámbar/azul/verde) con una
   animación de pulso *solo* cuando el turno está "Llamado" (para que se
   sienta urgente/vivo). Esto ya lo insinuaste en Atención con el punto de
   color — llevarlo a una animación de pulso real (`animate-pulse` de
   Tailwind, ya lo tienes disponible) es gratis y se nota.

5. **Tipografía con más disciplina editorial.**
   Fraunces admite variación óptica — usa `font-variation-settings` o pesos
   distintos para crear jerarquía dentro del mismo bloque (un dato así lo
   hace un editor de revista, no una plantilla SaaS). También: letter-spacing
   negativo muy leve en los títulos grandes (`tracking-tight`) se ve más
   cuidado que el tracking por defecto.

6. **Estados vacíos, de carga y de error diseñados, no ausentes.**
   Ahora mismo todo asume "hay datos". Un sitio profesional diseña también
   qué se ve cuando la cola está vacía, cuando el turno tarda en cargar, o
   cuando falla el fetch. Diseñar esos tres estados con la misma atención
   que el estado feliz es, honestamente, la diferencia más grande entre un
   proyecto de curso y un producto real — y es barato de hacer porque ya
   tienes el lenguaje visual definido.

7. **Pasa la vista móvil.** Todas las capturas que me mostraste son
   desktop. Un profesor de sistemas SÍ va a achicar la ventana o abrir en su
   celular. Ahora mismo no hemos probado responsive en ninguna pantalla.
   Esto es trabajo medible y con impacto directo en la nota — te lo marco
   como pendiente concreto abajo.

**Sobre Tailwind**: no "mejora el diseño" por sí solo, es una herramienta de
implementación — lo que ya elegiste (colores de marca, tipografía, escala de
espaciado) es lo que carga el peso del diseño. Tailwind te ayuda a que seas
*consistente* aplicando esas decisiones (evita que un padding sea `17px` en
un lugar y `18px` en otro). El secreto de que "se vea profesional" no está en
la herramienta, está en la restricción: usar siempre los mismos 5-6 valores
de espaciado, los mismos 2 radios de borde, la misma curva de transición en
todos lados. La inconsistencia sutil es lo que el ojo detecta como "no
profesional" aunque no sepa explicar por qué.

---

## 3. Atención — feedback y confirmación de acceso

**Acceso**: confirmado, solo administrativo (ver tabla arriba).

**Diseño — ideas concretas para pasar de "18" a "20":**

- **Cronómetro en vivo** del turno que está en ventanilla ("llevas 2:14
  atendiendo a M-031") — un `setInterval` de un segundo, texto pequeño junto
  a "Llamando ahora". Comunica que el sistema está *vivo*, no es una captura
  estática.
- **Confirmación antes de "No se presentó"** — es una acción destructiva
  (cancela el turno de alguien). Un pequeño modal o un "deshacer" tipo toast
  de 5 segundos después de la acción se siente mucho más pulido que un botón
  que actúa al toque. Esto también es una buena práctica de UX real, no
  solo estética.
- **Atajo de teclado** para "Llamar siguiente" (ej. tecla `N` o `Espacio`) con
  un hint visual pequeño (`N` en un recuadrito junto al botón). El personal
  de ventanilla hace esta acción decenas de veces por turno — un atajo de
  teclado es un detalle que un diseñador de producto real SÍ pensaría, y se
  ve inmediatamente "senior" en una demo.
- **Selector de ventanilla real** en vez de "Ventanilla 3" fijo en el
  título — aunque sea mock, un `<select>` que cambie el número de ventanilla
  se siente como un sistema multi-operador de verdad.

---

## 4. Reportes — acceso y diseño

**Acceso**: confirmado, solo administrativo. Tiene sentido — son métricas de
gestión, no algo que un alumno necesite ver.

**Diseño**: esta pantalla es la que mejor está resuelta de las cuatro (barras
con tooltip, ranking, tabla — bien jerarquizado). Si quieres un extra aquí en
vez de rediseñar: agrega un **selector de rango de fechas** (aunque sea mock,
"Hoy / Esta semana / Este mes") arriba de los gráficos. Es la clase de
control que todo dashboard real tiene y el tuyo no — y es barato de agregar
visualmente aunque los datos detrás sigan siendo estáticos por ahora.

---

## 5. Auditoría — acceso y qué agregarle

**Acceso**: confirmado, administrativo (o el rol `coordinador` si decides
agregar ese tercer nivel, ver sección 1).

**Qué le falta, honestamente poco**: la tabla + filtros ya cubre lo esencial.
Si quieres un plus: **exportar a CSV** el resultado filtrado (un botón que
genera el CSV en el propio navegador con los datos ya cargados, sin backend
extra) — es una función que cualquier sistema de auditoría real tiene y es
una tarde de trabajo.

---

## 6. Registro de usuarios — ¿lo implemento o no?

Mi recomendación: **no hagas registro público (self-signup).**

Razones concretas para tu contexto específico (demo en vivo, salón de 20
estudiantes de sistemas, uno de ustedes seguro intenta "romperlo"):

- Un formulario de registro público es superficie de ataque extra en el peor
  momento posible: en vivo, frente a la clase, con gente que sabe lo que
  hace. Cada campo es una oportunidad de que alguien meta un usuario con
  caracteres raros, XSS en el campo nombre, o simplemente spamee la tabla
  `usuarios` con registros basura mientras presentas.
- Además no es realista: en un sistema de turnos universitario real, el
  alumno **no se autoregistra** — su cuenta ya existe (viene de la matrícula,
  como tu propio placeholder "Código de estudiante" ya insinúa). Omitir el
  registro no es "hacer menos", es modelar el problema correctamente.

**Lo que sí te recomiendo:**

1. **Login únicamente**, con usuarios pre-creados en la base de datos (un
   script `seed.py` que inserta 2-3 usuarios: un alumno y un administrativo,
   con contraseñas simples pero *hasheadas* con `bcrypt`/`passlib` — nunca
   texto plano, ni para un demo).
2. **Ten las credenciales anotadas y ya probadas ANTES de presentar** — no
   las crees en el momento. Practica el login completo la noche anterior.
3. Si quieres mostrarle al profesor que sabes hacer CRUD de usuarios (para
   ganar nota extra sin abrir el registro al público), construye un
   **panel de administración** donde el rol `administrativo` puede crear
   nuevos usuarios manualmente. Es más impresionante que un registro público
   porque demuestra que entendiste el control de acceso, y no es una
   superficie abierta a cualquiera en la demo — solo tú (logueado) puedes
   crear cuentas.
4. **Protección barata contra fuerza bruta en el login**: limita a ~5
   intentos por minuto por IP (una librería como `slowapi` en FastAPI hace
   esto en pocas líneas). Es el tipo de detalle que, si el profesor pregunta
   "¿y si alguien intenta adivinar la contraseña?", tienes respuesta lista
   — y en un salón de sistemas, alguien va a preguntar exactamente eso.
5. Mensajes de error genéricos: "usuario o contraseña incorrectos" (nunca
   "ese usuario no existe" — eso le regala a un atacante qué cuentas son
   válidas).

---

## 7. Hosting de base de datos: ¿Railway o AWS?

**Quédate en Railway para la base de datos.** Ya la tienes funcionando ahí y
tus compañeros ya la usan — migrar a AWS ahora no te da ninguna ventaja para
este proyecto y sí te consume tiempo que necesitas para diseño/features.

Sobre AWS específicamente: tiene una capa gratuita real (RDS con
`db.t3.micro`, 750 horas/mes gratis por 12 meses para cuentas nuevas), pero
el costo no es el problema — es la **complejidad de configuración** (VPC,
security groups, subredes) comparado con Railway, que ya te funciona con
cero fricción. AWS vale la pena aprenderlo en algún momento de la carrera,
pero no lo metas como variable nueva a dos semanas de una presentación.

Sobre el plan de Railway: verifica en tu dashboard el estado actual de tu
plan/créditos antes de la presentación — Railway ha cambiado sus condiciones
de free tier varias veces en los últimos años, así que no puedo garantizarte
las condiciones exactas hoy. Lo que sí importa: confirma que la base de
datos siga *activa y accesible* el día de la demo (a veces los planes
gratuitos "duermen" recursos por inactividad).

Para el **backend** (FastAPI), lo más simple es desplegarlo también en
Railway junto a la base de datos — mismo panel, sin nada nuevo que aprender.
Alternativa real: **Render** tiene un tier gratuito para web services
Python, con una advertencia importante: el servicio "se duerme" tras ~15
minutos sin tráfico y la primera petición después de dormir tarda
30-50 segundos en responder. Si usas Render, **haz un ping al backend 5
minutos antes de empezar tu presentación** para que esté despierto — si no,
tu demo en vivo se congela justo cuando el profesor está mirando.

---

## 8. Deploy del frontend: ¿Vercel o Netlify?

**Vercel.** No porque Netlify sea peor (son comparables), sino porque Vercel
tiene mejor integración out-of-the-box con proyectos Vite/React, deploys
automáticos por rama, HTTPS y dominio gratis, y rollback con un clic si algo
sale mal en producción justo antes de presentar. Es la opción por defecto
razonable — no es una decisión que valga la pena investigar más a fondo para
este proyecto.

**Checklist de seguridad general para el día de la demo** (con 20 estudiantes
de sistemas mirando, esto es lo que evita sustos):

- **CORS restringido**: el backend solo debe aceptar peticiones desde tu
  dominio de Vercel, no `allow_origins=["*"]`.
- **Nunca expongas secretos en el frontend.** Cualquier variable `VITE_*`
  termina compilada dentro del JS y es visible para cualquiera con DevTools.
  Las credenciales de base de datos, claves de API, etc. viven solo en el
  backend.
- **Oculta o protege `/docs`** (el Swagger UI que FastAPI genera solo). Por
  defecto queda público en `/docs` y `/openapi.json` — cualquiera de tus
  compañeros puede abrirlo y ver *todos* tus endpoints listos para probar.
  Para producción: `FastAPI(docs_url=None, redoc_url=None)`, o al menos
  protégelo si te sirve para tu propia demo.
- **Valida roles en el backend siempre**, como mencioné en la sección 1 — es
  el punto de seguridad más importante de todo este proyecto.
- **Rate limit en crear turnos**: sin querer ser malicioso, si alguien
  descubre que puede spamear `POST /turnos` durante tu demo, tu cola de "8
  turnos" se convierte en 400 turnos en pantalla. Un límite simple (1 turno
  por usuario logueado cada cierto tiempo) evita esto sin ser paranoico.
- **HTTPS siempre** — automático tanto en Vercel como en Railway/Render, no
  requiere que hagas nada extra, solo confírmalo antes de presentar.

Con esta lista cubres el 90% de lo que un estudiante curioso (no un atacante
real) intentaría en un salón de clases.

---

## 9. ¿Qué tan difícil es conectar la base de datos real?

Menos de lo que temes, porque ya hiciste la parte que normalmente toma más
tiempo: los modelos SQLAlchemy de las 5 tablas ya existen y la conexión a
MySQL ya funciona (`backend/database.py`, `backend/models.py`). Lo que falta
es "solo" exponerlos como API REST. Te propongo el orden de trabajo por
impacto/dificultad, de menor a mayor:

1. **Login + JWT** — un endpoint que valida email/password contra
   `usuarios`, devuelve un token con el `rol` adentro. Esto desbloquea todo
   lo demás (roles en frontend, protección de rutas).
2. **Turnos: crear + listar cola** — `POST /turnos` (toma un turno) y
   `GET /turnos?estado=encola` (la cola en vivo). Reemplaza `mock.js` en la
   pantalla Turnos.
3. **Atención: llamar/atender/cancelar** — estos tres endpoints cambian el
   `estado` de un turno y crean/cierran una fila en `atenciones`. Reemplaza
   `mock.js` en Atención.
4. **Auditoría automática** — la parte más elegante: en vez de escribir
   manualmente un registro de auditoría en cada endpoint, usa una
   dependencia de FastAPI o un decorador simple que, cada vez que se llama
   un endpoint de turnos/atención, inserta una fila en `auditoria`
   automáticamente. Esto es exactamente el tipo de detalle de arquitectura
   que impresiona en una sustentación ("no lo hago a mano en cada endpoint,
   tengo un solo punto que audita todo").
5. **Reportes** — el más opcional de conectar de verdad: las métricas se
   pueden calcular con consultas de agregación (`GROUP BY`, `COUNT`,
   `AVG`) sobre `turnos`/`atenciones`. Si te queda poco tiempo, esta es la
   pantalla que puedes dejar en mock sin que se note tanto, porque
   "reportes con datos de ejemplo" es normal incluso en productos reales en
   fase de demo.

No hace falta que lo hagamos todo de una — cuando quieras, retomamos esto
paso a paso empezando por login.

---

## 10. Funciones extra para subir nota — priorizadas por costo/beneficio

De mejor a peor relación esfuerzo-impacto para tu contexto (demo en vivo,
tiempo limitado):

1. **Voz en el navegador anunciando el turno llamado** (`SpeechSynthesis`
   API, nativa del navegador, cero costo, cero backend). Cuando el
   operador pulsa "Llamar siguiente", el navegador dice en voz alta "Turno
   M-031, pase a ventanilla 3". Es gratis, no depende de ningún servicio
   externo que pueda fallar el día de la demo, y en una presentación en vivo
   el efecto "wow" es altísimo porque es *audible* — nadie más en la clase
   va a tener esto. Mi recomendación #1.

2. **Pantalla pública de espera** (una ruta sin login, ej. `/pantalla`,
   pensada para un monitor/TV en la sala de espera real) que muestra en
   grande el último turno llamado por cada ventanilla, actualizándose sola.
   Es una pantalla más para construir (reutilizando componentes que ya
   tienes) y en la demo puedes abrirla en tu celular al lado de la laptop —
   se ve como un producto terminado, no como un proyecto de curso.

3. **Notificación por correo** cuando se acerca el turno de alguien. Más
   simple que WhatsApp: con `smtplib` + una cuenta de Gmail con
   "contraseña de aplicación", o un servicio gratuito como Resend/SendGrid
   (capas gratuitas generosas para volumen de demo). Confiable y no depende
   de que un tercero apruebe nada.

4. **Notificación por WhatsApp — posible pero con más fricción.** Se puede
   con el *sandbox* de Twilio para WhatsApp, que es gratuito para pruebas,
   pero cada persona que quiera recibir el mensaje primero tiene que
   enviarle un código de "join" al número sandbox desde su propio WhatsApp
   — funciona bien para una demo controlada (tú mismo te unes de antemano
   con tu celular) pero no es tan simple como el correo. Si tienes tiempo de
   sobra después de las otras tres, es un buen extra vistoso; si no, el
   correo cubre la misma idea con mucho menos riesgo de que falle en vivo.

5. **Exportar CSV en Auditoría y/o Reportes** — mencionado arriba, barato y
   suma a "funcionalidad completa".

6. **Código QR del turno** (librería `qrcode` en frontend o backend) que el
   alumno puede mostrar en su celular en vez de memorizar el número — vistoso
   pero de menor impacto funcional que las opciones 1-3.

Yo priorizaría 1 y 2 primero: ambas son 100% frontend, cero dependencias
externas que puedan fallar en vivo, y son las que más "se sienten" en una
demo presencial frente a un salón.

---

## Resumen — por dónde empezar cuando quieras que lo construya

Sugerencia de orden (puedes reordenar, es solo mi consejo):

1. Roles + protección de rutas en frontend (rápido, y ya tienes `rol` en la
   base de datos — solo falta usarlo).
2. Login real conectado al backend (JWT), reemplazando el login falso actual.
3. Ajustes de diseño de la sección 2 (motivo de ticket, textura, micro-
   interacciones) — se pueden ir intercalando sin bloquear lo demás.
4. Conectar Turnos y Atención al backend real (sección 9, pasos 2-4).
5. Elegir 1-2 features extra de la sección 10.
6. Deploy (Vercel + Railway/Render) y checklist de seguridad de la sección 8.

Cuando quieras arrancar con cualquiera de estos, dímelo y seguimos.
