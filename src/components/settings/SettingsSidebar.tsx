import { NavLink } from 'react-router-dom'

interface SettingsSection {
  to: string
  label: string
}

interface SettingsGroup {
  title: string
  sections: SettingsSection[]
}

const GROUPS: SettingsGroup[] = [
  {
    title: 'Conta',
    sections: [
      { to: '/settings/account', label: 'Perfil' },
      { to: '/settings/privacy', label: 'Privacidade' },
      { to: '/settings/security', label: 'Segurança' },
      { to: '/settings/notifications', label: 'Notificações' },
    ],
  },
  {
    title: 'Plano',
    sections: [
      { to: '/settings/billing', label: 'Cobrança' },
      { to: '/settings/usage', label: 'Uso' },
    ],
  },
]

export default function SettingsSidebar() {
  return (
    <aside className="w-60 flex-shrink-0">
      <h1 className="px-3 pb-6 text-2xl font-semibold text-gray-900">
        Configurações
      </h1>
      <nav className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.sections.map((section) => (
                <NavLink
                  key={section.to}
                  to={section.to}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {section.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
