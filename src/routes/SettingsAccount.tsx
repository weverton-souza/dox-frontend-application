import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAvatarColor, getInitials } from '@/lib/avatar-utils'
import AccountForm from '@/components/settings/AccountForm'

const VERTICAL_LABELS: Record<string, string> = {
  psicologia: 'Psicologia',
  neuropsicologia: 'Neuropsicologia',
  medicina: 'Medicina',
  engenharia: 'Engenharia',
  direito: 'Direito',
  educacao: 'Educação',
  psicopedagogia: 'Psicopedagogia',
  geral: 'Geral',
}

function formatVertical(vertical: string | undefined): string {
  if (!vertical) return 'Profissional'
  return VERTICAL_LABELS[vertical.toLowerCase()] ?? vertical
}

export default function SettingsAccount() {
  const { user } = useAuth()
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const initials = getInitials(user?.name || '?')
  const avatarColor = getAvatarColor(user?.name || user?.email || 'guest')

  return (
    <div>
      <header className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">Conta</h2>
        <p className="mt-1 text-sm text-gray-600">
          Identidade pessoal e profissional usada na plataforma e nos relatórios.
        </p>
      </header>

      {/* Hero card */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="flex items-center gap-5">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarColor} text-2xl font-bold text-white shadow-md shadow-gray-300/40`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {user?.name || 'Profissional'}
            </h3>
            {user?.email && (
              <p className="truncate text-sm text-gray-600">{user.email}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Conta ativa
              </span>
              <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                {formatVertical(user?.vertical)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Saved feedback */}
      {savedAt && (
        <div
          key={savedAt}
          className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Configurações salvas com sucesso.
        </div>
      )}

      {/* Form card */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Identidade profissional
          </h3>
          <p className="mt-0.5 text-sm text-gray-600">
            Estes dados aparecem no cabeçalho dos seus relatórios.
          </p>
        </div>
        <div className="p-6">
          <AccountForm onSaved={() => setSavedAt(Date.now())} />
        </div>
      </section>
    </div>
  )
}
