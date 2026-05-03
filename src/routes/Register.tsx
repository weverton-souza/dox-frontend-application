import { useActionState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useError } from '@/contexts/ErrorContext'
import Input from '@/components/ui/Input'
import SubmitButton from '@/components/ui/SubmitButton'

type RegisterFormState = { error: string | null }
const initialState: RegisterFormState = { error: null }

export default function Register() {
  const { register } = useAuth()
  const { showError } = useError()
  const navigate = useNavigate()

  const [, formAction] = useActionState(
    async (_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> => {
      const name = (formData.get('name') as string | null) ?? ''
      const email = (formData.get('email') as string | null) ?? ''
      const password = (formData.get('password') as string | null) ?? ''
      try {
        await register({ name, email, password })
        navigate('/', { replace: true })
        return { error: null }
      } catch (err) {
        showError(err)
        return { error: err instanceof Error ? err.message : 'Erro ao criar conta' }
      }
    },
    initialState,
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-800">Dox</h1>
          <p className="text-sm text-gray-500 mt-1">Crie sua conta</p>
        </div>

        <form action={formAction} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <Input
            label="Nome"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome completo"
            required
            autoFocus
          />

          <Input
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            required
          />

          <Input
            label="Senha"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
          />

          <SubmitButton className="w-full" pendingLabel="Criando conta...">
            Criar conta
          </SubmitButton>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
