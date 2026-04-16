// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email:     '',
    password:  '',
    confirm:   '',
  })
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [registered,  setRegistered]  = useState(false)

  // Validaciones en tiempo real
  const checks = {
    length:   form.password.length >= 8,
    upper:    /[A-Z]/.test(form.password),
    number:   /[0-9]/.test(form.password),
    match:    form.password === form.confirm && form.confirm.length > 0,
  }
  const passwordOk = Object.values(checks).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password || !form.confirm) {
      toast.error('Completa todos los campos')
      return
    }
    if (!passwordOk) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email:    form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.full_name.trim() },
      },
    })
    if (error) {
      toast.error(
          error.message.includes('already registered')
              ? 'Este email ya está registrado'
              : error.message
      )
      setLoading(false)
      return
    }

    // Guardar nombre en profiles
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
          .from('profiles')
          .upsert({ id: user.id, full_name: form.full_name.trim() })
    }

    setRegistered(true)
    setLoading(false)
  }

  // Pantalla de confirmación
  if (registered) {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md animate-slide-up">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-brand-400" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-3">
              ¡Casi listo!
            </h1>
            <p className="text-gray-500 mb-2">
              Enviamos un email de confirmación a <strong className="text-gray-700">{form.email}</strong>.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace para activar tu cuenta.
            </p>
            <Link to="/login" className="btn-primary inline-block">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen flex">

        {/* Panel izquierdo */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
          <img
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=80"
              alt="Multi Flash"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 to-gray-900/60" />
          <div className="relative z-10 flex flex-col justify-end p-12 text-white">
            <div className="font-display text-4xl font-extrabold mb-4"><span className="text-white">MULTI</span><span className="text-accent-400"> FLASH</span></div>
            <h2 className="font-display text-3xl font-bold leading-snug mb-3">
              Únete a la comunidad.
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              Regístrate y obtén acceso a ofertas exclusivas, seguimiento de pedidos y mucho más.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm text-gray-300">
              {['20% OFF en tu primera compra', 'Envíos exclusivos para miembros', 'Acceso anticipado a nuevas colecciones'].map(b => (
                  <div key={b} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-brand-400 flex-shrink-0" />
                    {b}
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-fade-in">

            <div className="lg:hidden mb-8 text-center">
              <Link to="/"><span className="font-display text-3xl font-extrabold"><span className="text-brand-400">MULTI</span><span className="text-accent-400"> FLASH</span></span></Link>
            </div>

            <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-2">Crear cuenta</h1>
            <p className="text-gray-400 text-sm mb-8">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-brand-400 font-medium hover:text-brand-400 transition-colors">
                Inicia sesión
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                    type="text"
                    className="input"
                    placeholder="Juan Pérez"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    className="input"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                      type={showPass ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      autoComplete="new-password"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Indicadores de contraseña */}
                {form.password.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {[
                        { ok: checks.length, label: 'Mínimo 8 caracteres' },
                        { ok: checks.upper,  label: 'Una mayúscula' },
                        { ok: checks.number, label: 'Un número' },
                        { ok: checks.match,  label: 'Contraseñas coinciden' },
                      ].map(c => (
                          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-green-500' : 'bg-gray-300'}`} />
                            {c.label}
                          </div>
                      ))}
                    </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input
                    type={showPass ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    autoComplete="new-password"
                />
              </div>

              <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Al registrarte aceptas nuestros{' '}
              <a href="#" className="underline hover:text-gray-600">Términos de uso</a>
              {' '}y{' '}
              <a href="#" className="underline hover:text-gray-600">Política de privacidad</a>
            </p>
          </div>
        </div>
      </div>
  )
}