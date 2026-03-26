// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const init      = useAuthStore(s => s.init)
  const redirect  = location.state?.from ?? '/'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Completa todos los campos')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email:    form.email.trim(),
      password: form.password,
    })
    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : error.message
      )
      setLoading(false)
      return
    }
    await init()
    toast.success('¡Bienvenido de vuelta!')
    navigate(redirect, { replace: true })
  }

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo — imagen decorativa */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80"
          alt="VYBE"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 to-gray-900/60" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <span className="font-display text-4xl font-extrabold text-brand-400 mb-4">VYBE</span>
          <h2 className="font-display text-3xl font-bold leading-snug mb-3">
            Tu estilo,<br />sin límites.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
            Moda auténtica para cada momento de tu vida. Descubre piezas únicas que hablan por ti.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">

          {/* Logo móvil */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="font-display text-3xl font-extrabold text-brand-400">VYBE</Link>
          </div>

          <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-gray-400 text-sm mb-8">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-brand-500 font-medium hover:text-brand-600 transition-colors">
              Regístrate gratis
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <button
                  type="button"
                  className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
                  onClick={async () => {
                    if (!form.email) { toast.error('Ingresa tu email primero'); return }
                    const { error } = await supabase.auth.resetPasswordForEmail(form.email)
                    if (error) toast.error(error.message)
                    else toast.success('Revisa tu email para restablecer la contraseña')
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Al ingresar aceptas nuestros{' '}
            <a href="#" className="underline hover:text-gray-600">Términos de uso</a>
            {' '}y{' '}
            <a href="#" className="underline hover:text-gray-600">Política de privacidad</a>
          </p>
        </div>
      </div>
    </div>
  )
}
