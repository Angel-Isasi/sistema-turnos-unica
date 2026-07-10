// Panel de usuarios (solo personal administrativo).
// Reemplaza al registro público: las cuentas nuevas se crean desde aquí,
// ya autenticado — el backend igual valida el rol en cada petición.

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import EstadoVacio from "@/components/EstadoVacio"
import EstadoErrorCarga from "@/components/EstadoErrorCarga"
import { api } from "@/lib/api"
import { fechaCorta } from "@/lib/formato"

const ETIQUETA_ROL = {
  administrativo: { texto: "Administrativo", clase: "bg-brand/10 text-brand" },
  alumno: { texto: "Alumno", clase: "bg-sage/25 text-text-dark/70" },
}

const FORMULARIO_VACIO = { nombre: "", email: "", password: "", rol: "alumno" }

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(null) // null = cargando
  const [errorCarga, setErrorCarga] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [enviando, setEnviando] = useState(false)
  const [errorForm, setErrorForm] = useState(null)
  const [exito, setExito] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setUsuarios(await api("/usuarios"))
      setErrorCarga(null)
    } catch (err) {
      setErrorCarga(err.message)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function cambiar(campo, valor) {
    setFormulario((f) => ({ ...f, [campo]: valor }))
  }

  async function crearUsuario(e) {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setErrorForm(null)
    setExito(null)
    try {
      const creado = await api("/usuarios", { metodo: "POST", cuerpo: formulario })
      setExito(`Cuenta creada para ${creado.nombre} (${creado.email}).`)
      setFormulario(FORMULARIO_VACIO)
      cargar()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-brand">Administración de cuentas</p>
        <h1 className="font-serif-display font-bold text-3xl sm:text-4xl text-text-dark mt-1 tracking-tight">
          Usuarios
        </h1>
        <p className="text-text-dark/60 mt-2">
          No hay registro público: las cuentas se crean aquí, con la sesión de
          un administrativo, y el backend valida el rol en cada operación.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Formulario de alta */}
        <form onSubmit={crearUsuario} className="bg-white border border-brand/15 rounded-lg p-6 space-y-4 self-start">
          <h2 className="text-text-dark font-semibold">Nueva cuenta</h2>

          {errorForm && (
            <p role="alert" className="border border-estado-cancelado/40 bg-estado-cancelado/5 text-estado-cancelado text-sm rounded-md px-3 py-2.5">
              {errorForm}
            </p>
          )}
          {exito && (
            <p className="border border-estado-atendido/40 bg-estado-atendido/5 text-estado-atendido text-sm rounded-md px-3 py-2.5">
              {exito}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-text-dark/70">Nombre completo</Label>
            <Input
              id="nombre"
              required
              minLength={3}
              maxLength={100}
              placeholder="Nombre y apellidos"
              value={formulario.nombre}
              onChange={(e) => cambiar("nombre", e.target.value)}
              className="bg-cream/50 border-brand/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo" className="text-text-dark/70">Correo institucional</Label>
            <Input
              id="correo"
              type="email"
              required
              maxLength={100}
              placeholder="usuario@unica.edu.pe"
              value={formulario.email}
              onChange={(e) => cambiar("email", e.target.value)}
              className="bg-cream/50 border-brand/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clave" className="text-text-dark/70">Contraseña</Label>
            <Input
              id="clave"
              type="password"
              required
              minLength={8}
              maxLength={72}
              placeholder="Mínimo 8 caracteres"
              value={formulario.password}
              onChange={(e) => cambiar("password", e.target.value)}
              className="bg-cream/50 border-brand/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol" className="text-text-dark/70">Rol</Label>
            <select
              id="rol"
              value={formulario.rol}
              onChange={(e) => cambiar("rol", e.target.value)}
              className="h-9 w-full rounded-md border border-brand/20 bg-cream/50 px-3 text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="alumno">Alumno</option>
              <option value="administrativo">Administrativo</option>
            </select>
          </div>

          <Button type="submit" disabled={enviando} className="bg-brand hover:bg-brand/90 w-full">
            {enviando ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>

        {/* Lista de cuentas */}
        <div className="lg:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-text-dark font-semibold">Cuentas existentes</h2>
            {usuarios !== null && (
              <span className="text-xs text-text-dark/50 tabular-nums">{usuarios.length} cuentas</span>
            )}
          </div>

          {errorCarga && usuarios === null ? (
            <EstadoErrorCarga mensaje={errorCarga} onReintentar={cargar} />
          ) : usuarios === null ? (
            <div className="border-t border-brand/15 animate-pulse space-y-3 pt-4" aria-label="Cargando…">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 bg-brand/10 rounded" />
              ))}
            </div>
          ) : usuarios.length === 0 ? (
            <EstadoVacio
              titulo="No hay cuentas registradas"
              detalle="Crea la primera con el formulario de la izquierda."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-brand/15 text-left">
                    <th className="py-2.5 pr-4 font-medium text-text-dark/55">Nombre</th>
                    <th className="py-2.5 px-4 font-medium text-text-dark/55">Correo</th>
                    <th className="py-2.5 px-4 font-medium text-text-dark/55">Rol</th>
                    <th className="py-2.5 pl-4 font-medium text-text-dark/55 text-right">Creada</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const rol = ETIQUETA_ROL[u.rol] ?? { texto: u.rol, clase: "bg-brand/10 text-text-dark/70" }
                    return (
                      <tr key={u.id} className="border-b border-brand/15">
                        <td className="py-3 pr-4 text-text-dark">{u.nombre}</td>
                        <td className="py-3 px-4 text-text-dark/70">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block text-xs rounded px-2 py-0.5 ${rol.clase}`}>
                            {rol.texto}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right tabular-nums text-text-dark/60">
                          {fechaCorta(u.creado_en)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
