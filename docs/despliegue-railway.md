# Despliegue y operación — Sistema de Turnos UNICA

Guía práctica: cómo funciona Railway, cómo desplegar el backend, cómo
conectar el frontend de Vercel, y el checklist del día de la demo.

---

## 1. Cómo funciona Railway (el modelo mental)

Railway es una plataforma que convierte tu repositorio en un servicio
corriendo en la nube. El ciclo completo es:

```
git push → Railway detecta el cambio → BUILD → DEPLOY → URL pública HTTPS
```

1. **Build**: Railway clona tu repo, ve que hay un `requirements.txt` y
   deduce "esto es Python". Crea una imagen con Python, instala tus
   dependencias y la deja lista. No escribes Dockerfiles ni configuras
   servidores: la detección es automática.
2. **Deploy**: arranca tu app con el *start command*. En este proyecto ya
   quedó fijado en `backend/railway.json`:
   `uvicorn main:app --host 0.0.0.0 --port $PORT`.
   `$PORT` lo pone Railway (no es el 8000 local); uvicorn debe escuchar ahí.
3. **Variables de entorno**: en la pestaña **Variables** del servicio
   defines `DATABASE_URL`, `JWT_SECRET`, etc. Railway las inyecta al
   proceso — tu código las lee igual que lee el `.env` local. Por eso el
   `.env` nunca se sube a git: en producción no existe, existen las
   variables del panel.
4. **Dominio**: en **Settings → Networking → Generate Domain** te da una
   URL `https://loquesea.up.railway.app` con HTTPS automático.
5. **Cada push a `main` redespliega solo.** Si un deploy sale mal, en la
   pestaña Deployments puedes volver al anterior (rollback).

### La base de datos es otro servicio del mismo proyecto

Tu MySQL ya vive en Railway como un servicio aparte. Tiene **dos puertas**:

| Puerta | Host | Cuándo se usa |
|---|---|---|
| Proxy público | `hayabusa.proxy.rlwy.net:53693` | Desde TU PC (desarrollo, seed) |
| Red privada | `mysql.railway.internal:3306` | Desde el backend desplegado en Railway |

Dentro de Railway los servicios se hablan por la red privada: más rápido,
no sale a internet y no consume el ancho de banda del plan. Tu `.env`
local usa el proxy público (correcto); el backend desplegado debe usar la
privada (paso 2.4).

---

## 2. Desplegar el backend en Railway (una sola vez)

1. Entra a tu proyecto de Railway (donde ya está MySQL) →
   **+ New → GitHub Repo** → elige este repositorio.
2. En **Settings → Root Directory** escribe `backend` (el repo tiene
   frontend y backend juntos; Railway solo debe construir el backend).
3. El start command ya lo toma de `backend/railway.json` — no hay que
   escribir nada.
4. En **Variables** agrega (los `${{MySQL...}}` son *referencias*: Railway
   los rellena solo con los datos de tu servicio MySQL):

   ```
   DATABASE_URL = mysql+pymysql://${{MySQL.MYSQLUSER}}:${{MySQL.MYSQLPASSWORD}}@${{MySQL.RAILWAY_PRIVATE_DOMAIN}}:3306/${{MySQL.MYSQLDATABASE}}
   JWT_SECRET   = (un valor largo y aleatorio, ver abajo)
   CORS_ORIGINS = https://TU-APP.vercel.app
   ENTORNO      = produccion
   ```

   - Genera el secreto en tu PC:
     `venv/Scripts/python -c "import secrets; print(secrets.token_hex(48))"`
   - `CORS_ORIGINS`: el dominio EXACTO de Vercel, con `https://` y SIN
     barra final. Si luego usas otro dominio, se agrega separado por coma.
   - `ENTORNO=produccion` apaga `/docs` y `/openapi.json` (verificado:
     responden 404).
5. **Settings → Networking → Generate Domain** → copia la URL
   (ej. `https://sistema-turnos-unica.up.railway.app`).
6. Prueba en el navegador: `https://TU-BACKEND.up.railway.app/` debe
   responder `{"mensaje": "El backend del sistema de turnos está funcionando"}`.

> El seed NO hace falta correrlo de nuevo: las cuentas y servicios ya se
> insertaron en la base de Railway desde tu PC. Si algún día necesitas
> resembrar: `venv/Scripts/python seed.py` (usa el proxy público del .env).

---

## 3. Conectar el frontend de Vercel

1. En Vercel → tu proyecto → **Settings → Environment Variables**:

   ```
   VITE_API_URL = https://TU-BACKEND.up.railway.app
   ```

   (sin barra final). Las variables `VITE_*` se compilan DENTRO del JS en
   el build — por eso aquí solo va la URL pública, jamás un secreto.
2. **Redeploy** (Deployments → ⋯ → Redeploy) para que el build tome la
   variable. Cambiar una variable sin redeploy no hace nada en Vite.
3. `frontend/vercel.json` ya está en el repo: hace que rutas como
   `/turnos` o `/atencion` carguen la app en vez de dar 404 al refrescar.
   (Se aplica si el Root Directory del proyecto Vercel es `frontend`,
   que es lo usual; si tu proyecto usa la raíz del repo, mueve ese archivo
   a la raíz.)
4. Abre tu dominio de Vercel y prueba el login completo con las dos
   cuentas.

Si el navegador muestra un error de CORS en la consola: el valor de
`CORS_ORIGINS` en Railway no coincide exactamente con tu dominio de
Vercel (revisa https, subdominio y que no haya `/` final).

---

## 4. Credenciales sembradas (guárdalas y pruébalas antes)

| Rol | Correo | Contraseña |
|---|---|---|
| Personal administrativo | `rpena@unica.edu.pe` | `Ventanilla#2026` |
| Alumno | `lhuaman@unica.edu.pe` | `Alumno#2026` |

Están hasheadas con bcrypt en la tabla `usuarios` (nunca en texto plano).
Puedes crear más cuentas desde la pantalla **Usuarios** logueado como
administrativo. (Quedó también una cuenta de prueba `qa@unica.edu.pe`
creada durante los tests automáticos; puedes ignorarla.)

---

## 5. Checklist del día de la demo

La noche anterior:

- [ ] Login probado con AMBAS cuentas en el dominio de Vercel (no localhost).
- [ ] Flujo completo ensayado: alumno saca turno → administrativo lo llama
      (tecla `N`) → atendido → aparece en Reportes y Auditoría.
- [ ] Railway: el proyecto tiene créditos/plan activo y la BD responde
      (dashboard → MySQL → pestaña Data, o simplemente usar la app).
- [ ] `https://TU-BACKEND.up.railway.app/docs` responde **404** (si responde
      la documentación, falta `ENTORNO=produccion`).

5 minutos antes de presentar:

- [ ] Abrir `https://TU-BACKEND.up.railway.app/` (despierta el servicio y
      confirma que la BD conecta).
- [ ] Iniciar sesión en dos pestañas/dispositivos: una como alumno
      (Turnos) y otra como administrativo (Atención) — así la demo
      muestra la cola moviéndose en vivo.
- [ ] Tener las credenciales anotadas en papel, no crearlas en vivo.

Protecciones ya activas por si un compañero "curioso" apunta a tu API:

- Roles validados **en el backend** (un alumno con curl/Postman recibe
  403 en `/atencion`, `/reportes`, `/auditoria`, `/usuarios`).
- Login: 5 intentos por minuto por IP (429 después) y mensaje genérico
  que no revela si el correo existe.
- Un solo turno activo por usuario (no pueden inflar la cola) + límite de
  10 creaciones/minuto por IP.
- CORS restringido a tu dominio; `/docs` apagado; secretos solo en el
  backend; todo va por HTTPS.
- Y TODO queda en Auditoría, incluidos los intentos fallidos — durante la
  sustentación, esa pantalla es tu evidencia.

---

## 6. Correr el proyecto en local (desarrollo)

```
# Terminal 1 — backend (http://localhost:8000, /docs abierto)
cd backend
venv/Scripts/python -m uvicorn main:app --reload --port 8000

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

El backend local usa el `.env` (proxy público de Railway), así que local y
producción comparten la misma base de datos: lo que hagas en local se ve
en la demo y viceversa.
