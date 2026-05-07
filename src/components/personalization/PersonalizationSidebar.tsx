import { NavLink } from 'react-router-dom'

interface PersonalizationSection {
  to: string
  label: string
}

const SECTIONS: PersonalizationSection[] = [
  { to: '/personalization/appearance', label: 'Aparência' },
  { to: '/personalization/library', label: 'Biblioteca' },
]

export default function PersonalizationSidebar() {
  return (
    <aside className="w-60 flex-shrink-0">
      <h1 className="px-3 pb-6 text-2xl font-semibold text-gray-900">
        Personalização
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
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
