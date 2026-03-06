import { NavLink, useLocation } from 'react-router-dom'
import {
  DocumentIcon,
  UsersIcon,
  ClipboardListIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons'
import { IconProps } from '@/components/icons'

interface NavItemConfig {
  to: string
  label: string
  icon: (props: IconProps) => JSX.Element
  matchPaths?: string[]
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    to: '/',
    label: 'Laudos',
    icon: DocumentIcon,
    matchPaths: ['/laudo/'],
  },
  {
    to: '/pacientes',
    label: 'Pacientes',
    icon: UsersIcon,
    matchPaths: ['/pacientes/'],
  },
  {
    to: '/formularios',
    label: 'Formulários',
    icon: ClipboardListIcon,
    matchPaths: ['/formulario/'],
  },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  onOpenProfessionalModal: () => void
}

export default function Sidebar({ isCollapsed, onToggle, onOpenProfessionalModal }: SidebarProps) {
  const location = useLocation()

  const isActive = (item: NavItemConfig) => {
    if (location.pathname === item.to) return true
    if (item.matchPaths) {
      return item.matchPaths.some((p) => location.pathname.startsWith(p))
    }
    return false
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      role="navigation"
      aria-label="Menu principal"
    >
      {/* Brand */}
      <div className="h-16 flex items-center border-b border-gray-200 px-4 shrink-0 overflow-hidden">
        {isCollapsed ? (
          <span className="text-brand-700 font-bold text-lg mx-auto">NH</span>
        ) : (
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-brand-700 whitespace-nowrap">NeuroHub</h1>
            <p className="text-xs text-gray-400 whitespace-nowrap">Laudos neuropsicológicos</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          const Icon = item.icon

          return (
            <div key={item.to} className="relative group">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={`flex items-center gap-3 rounded-lg transition-colors ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-brand-100 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  // NavLink uses `end` for exact match, but we handle active state manually
                  // via isActive — let the click always navigate
                  void e
                }}
              >
                <Icon size={20} />
                {!isCollapsed && (
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 py-3 px-2 space-y-1 shrink-0">
        {/* Professional settings */}
        <div className="relative group">
          <button
            type="button"
            onClick={onOpenProfessionalModal}
            className={`w-full flex items-center gap-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <SettingsIcon size={20} />
            {!isCollapsed && (
              <span className="text-sm whitespace-nowrap">Profissional</span>
            )}
          </button>
          {isCollapsed && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Profissional
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`w-full flex items-center gap-3 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          {isCollapsed ? <ChevronRightIcon size={20} /> : <ChevronLeftIcon size={20} />}
          {!isCollapsed && (
            <span className="text-sm whitespace-nowrap">Recolher</span>
          )}
        </button>
      </div>
    </aside>
  )
}
