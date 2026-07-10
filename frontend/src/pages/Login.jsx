import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function Login() {
  const navigate = useNavigate()

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
            <h1 className="font-serif-display italic text-6xl text-cream mb-4">
              Turnos
            </h1>
            <h1 className="font-serif-display font-bold text-6xl text-cream mb-6">
              UNICA
            </h1>
            <p className="text-text-secondary text-lg ">
              Tu lugar en la fila, sin perder el tiempo.
            </p>
          </div>
        </div>

        {/* Panel derecho: 67% del ancho */}
        <div className="w-full md:w-[67%] flex items-center justify-center px-8">
          <div className="w-full max-w-sm space-y-4">
            <h2 className="text-text-dark text-2xl font-bold mb-6">
              Iniciar sesión
            </h2>

            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-text-dark/70">
                Usuario
              </Label>
              <Input
                id="usuario"
                type="text"
                placeholder="Código de estudiante"
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
                placeholder="••••••••"
                className="bg-white border-brand/20"
              />
            </div>

            <Button
              onClick={() => navigate("/turnos")}
              className="bg-brand hover:bg-brand/90 w-full mt-4"
            >
              Ingresar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}