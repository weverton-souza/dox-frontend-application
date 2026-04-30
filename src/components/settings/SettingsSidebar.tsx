import { NavLink } from 'react-router-dom'

interface SettingsSection {
  to: string
  label: string
  badge?: string
}

const SECTIONS: SettingsSection[] = [
  { to: '/settings/general', label: 'Geral' },
  { to: '/settings/account', label: 'Conta' },
  { to: '/settings/privacy', label: 'Privacidade' },
  { to: '/settings/billing', label: 'Cobrança' },
  { to: '/settings/usage', label: 'Uso' },
  { to: '/settings/notifications', label: 'Notificações' },
  { to: '/settings/security', label: 'Segurança' },
]

export default function SettingsSidebar() {
  return (
    <aside className="w-60 flex-shrink-0">
      <h1 className="px-3 pb-6 text-2xl font-semibold text-gray-900">
        Configurações
      </h1>
      <nav className="flex flex-col gap-0.5">
        {SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{section.label}</span>
            {section.badge && (
              <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                {section.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
