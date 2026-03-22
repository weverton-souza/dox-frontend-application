import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useError } from '@/contexts/ErrorContext'
import Button from '@/components/ui/Button'
import { EyeIcon, EyeOffIcon } from '@/components/icons'
import logoDox from '@/assets/logo-dox.svg'
import loginBg from '@/assets/login_background.svg'

export default function Login() {
  const { login } = useAuth()
  const { showError } = useError()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ email, password }, rememberMe)
      navigate('/', { replace: true })
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-100" style={{ height: '100dvh' }}>
      <img
        src={loginBg}
        alt=""
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
      />

      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)',
        }}
      />

      <div className="relative z-20 h-dvh flex items-center justify-center gap-12 lg:gap-20 px-4 sm:px-8">
        <div className="w-full max-w-[380px] bg-white backdrop-blur-2xl border border-gray-200/30 rounded-3xl px-6 sm:px-8 py-6 sm:py-8"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>
          <img src={logoDox} alt="Dox" className="h-10 mx-auto mb-6" />

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-gray-300/80 bg-white/40 px-3 py-2.5 sm:py-1.5 text-base sm:text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300/80 bg-white/50 px-3 py-2.5 sm:py-1.5 pr-9 text-base sm:text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-gray-600">Manter conectado</span>
            </label>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Entrando...' : 'Login'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Não tem conta?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Criar conta
            </Link>
          </p>
        </div>

        <div className="hidden md:block text-center z-10 shrink-0">
          <span className="block text-2xl lg:text-3xl xl:text-4xl font-medium text-gray-900 leading-tight">
            Pense diferente.
          </span>
          <span className="block text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
            Crie Melhor!
          </span>
        </div>
      </div>
    </div>
  )
}
