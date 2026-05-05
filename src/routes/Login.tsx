import { useActionState, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useError } from '@/contexts/ErrorContext'
import Input from '@/components/ui/Input'
import SubmitButton from '@/components/ui/SubmitButton'
import { CheckIcon, EyeIcon, EyeOffIcon } from '@/components/icons'
import logoDox from '@/assets/logo-dox.svg'
import loginBg from '@/assets/login_background.svg'

type LoginFormState = { error: string | null }
const initialState: LoginFormState = { error: null }

export default function Login() {
  const { login } = useAuth()
  const { showError } = useError()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const confirmed = searchParams.get('confirmed')

  const [, formAction] = useActionState(
    async (_prev: LoginFormState, formData: FormData): Promise<LoginFormState> => {
      const email = (formData.get('email') as string | null) ?? ''
      const password = (formData.get('password') as string | null) ?? ''
      try {
        await login({ email, password }, rememberMe)
        navigate('/', { replace: true })
        return { error: null }
      } catch (err) {
        showError(err)
        return { error: err instanceof Error ? err.message : 'Erro ao entrar' }
      }
    },
    initialState,
  )

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

          {confirmed === 'true' && (
            <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-3.5 py-2.5 flex items-start gap-2">
              <span className="text-green-600 mt-0.5 shrink-0"><CheckIcon size={14} /></span>
              <p className="text-xs text-green-800 leading-relaxed">
                Email confirmado. Faça login para começar.
              </p>
            </div>
          )}
          {confirmed === 'already' && (
            <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2.5 flex items-start gap-2">
              <span className="text-blue-600 mt-0.5 shrink-0"><CheckIcon size={14} /></span>
              <p className="text-xs text-blue-800 leading-relaxed">
                Este email já estava confirmado. Pode entrar normalmente.
              </p>
            </div>
          )}

          <form action={formAction} className="space-y-3.5">
            <Input
              label="E-mail"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
              autoFocus
              className="border-gray-300/80 bg-white/40 py-2.5 sm:py-1.5 text-base sm:text-sm"
            />

            <div>
              <div className="relative">
                <Input
                  label="Senha"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                  className="border-gray-300/80 bg-white/50 py-2.5 sm:py-1.5 pr-9 text-base sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 bottom-2.5 sm:bottom-1.5 text-gray-400 hover:text-gray-600 transition-colors"
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

            <SubmitButton className="w-full" pendingLabel="Entrando...">
              Login
            </SubmitButton>
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
