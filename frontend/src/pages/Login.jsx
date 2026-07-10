import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

// A dónde entra cada rol después de loguearse.
const destinoPorRol = (rol) => (rol === "administrativo" ? "/atencion" : "/turnos")

export default function Login() {
  const navigate = useNavigate()
  const { usuario, iniciarSesion } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  // Si ya hay sesión (o se restauró de localStorage), no mostramos el login.
  useEffect(() => {
    if (usuario) navigate(destinoPorRol(usuario.rol), { replace: true })
  }, [usuario, navigate])

  async function manejarEnvio(e) {
    e.preventDefault()
    if (cargando) return
    setError(null)
    setCargando(true)
    try {
      const datos = await api("/auth/login", {
        metodo: "POST",
        cuerpo: { email, password },
      })
      iniciarSesion(datos.token, datos.usuario)
      navigate(destinoPorRol(datos.usuario.rol), { replace: true })
    } catch (err) {
      // El backend responde genérico a propósito ("usuario o contraseña
      // incorrectos"); aquí solo lo mostramos.
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Capa de fondo: el degradado, desenfocado solo donde corresponde */}
      <div
        className="absolute -inset-x-32 -inset-y-96"
        style={{
          background: 'linear-gradient(to right, #2A1F1A 0%, #2A1F1A 33%, #F5F1E4 43%, #F5F1E4 100%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Capa de contenido: nítida, encima del fondo */}
      <div className="relative z-10 min-h-screen flex">
        {/* Panel izquierdo: 40% del ancho */}
        <div className="hidden md:flex w-[40%] flex-col items-center justify-center px-16 relative overflow-hidden">
          <svg
            className="absolute opacity-40"
            style={{ top: '-20%', left: 0, width: '100%', height: '140%' }}
            preserveAspectRatio="none"
          >
            <line x1="-10%" y1="0%" x2="80%" y2="-15%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="-10%" y1="15%" x2="80%" y2="0%" stroke="#F5F1E4" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="-10%" y1="30%" x2="80%" y2="15%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="-10%" y1="45%" x2="80%" y2="30%" stroke="#F5F1E4" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="-10%" y1="60%" x2="80%" y2="45%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="-10%" y1="75%" x2="80%" y2="60%" stroke="#F5F1E4" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="-10%" y1="90%" x2="80%" y2="75%" stroke="#C9A278" strokeWidth="2" strokeDasharray="6 8" />
            <line x1="-10%" y1="105%" x2="80%" y2="90%" stroke="#F5F1E4" strokeWidth="2" strokeDasharray="6 8" />
          </svg>

          <div className="relative z-10 w-full ">
            <h1 className="font-serif-display italic text-6xl text-cream mb-4 tracking-tight">
              Turnos
            </h1>
            <h1 className="font-serif-display font-bold text-6xl text-cream mb-6 tracking-tight">
              UNICA
            </h1>
            <p className="text-text-secondary text-lg ">
              Tu lugar en la fila, sin perder el tiempo.
            </p>
          </div>
        </div>

        {/* Panel derecho: 67% del ancho */}
        <div className="w-full md:w-[67%] flex items-center justify-center px-6 sm:px-8 py-10">
          <form onSubmit={manejarEnvio} className="w-full max-w-sm space-y-4">
            {/* Marca visible solo en móvil (el panel izquierdo se oculta) */}
            <div className="md:hidden mb-8 flex items-baseline gap-1.5">
              <span className="font-serif-display italic text-3xl text-text-dark">Turnos</span>
              <span className="font-serif-display font-bold text-3xl text-brand">UNICA</span>
            </div>

            <h2 className="text-text-dark text-2xl font-bold mb-6">
              Iniciar sesión
            </h2>

            {error && (
              <div
                role="alert"
                className="border border-estado-cancelado/40 bg-estado-cancelado/5 text-estado-cancelado text-sm rounded-md px-3 py-2.5"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-text-dark/70">
                Correo institucional
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="username"
                placeholder="usuario@unica.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-brand/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-text-dark/70">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-brand/20"
              />
            </div>

            <Button
              type="submit"
              disabled={cargando}
              className="bg-brand hover:bg-brand/90 w-full mt-4"
            >
              {cargando ? "Ingresando…" : "Ingresar"}
            </Button>

            <p className="text-xs text-text-dark/45 pt-2">
              Las cuentas las entrega la oficina de servicios académicos.
              No hay registro público.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
