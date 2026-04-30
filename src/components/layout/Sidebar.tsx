import React, { useRef, useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  DocumentIcon,
  UsersIcon,
  ClipboardListIcon,
  CalendarIcon,
  BookIcon,
} from '@/components/icons'
import type { IconProps } from '@/components/icons'
import type { ModuleId } from '@/types'
import { useAccessibleModules } from '@/lib/hooks/use-modules'
import logoDoxMark from '@/assets/logo-dox-mark.svg'
import logoDoxText from '@/assets/logo-dox-text.svg'

interface NavItemConfig {
  to: string
  label: string
  icon: (props: IconProps) => React.ReactNode
  matchPaths?: string[]
  module?: ModuleId
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    to: '/',
    label: 'Relatórios',
    icon: DocumentIcon,
    matchPaths: ['/reports/'],
    module: 'reports',
  },
  {
    to: '/customers',
    label: 'Clientes',
    icon: UsersIcon,
    matchPaths: ['/customers/'],
    module: 'customers',
  },
  {
    to: '/forms',
    label: 'Formulários',
    icon: ClipboardListIcon,
    matchPaths: ['/forms/'],
    module: 'forms',
  },
  {
    to: '/calendar',
    label: 'Agenda',
    icon: CalendarIcon,
    module: 'calendar',
  },
]

function LockBadge() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-auto shrink-0 text-gray-300"
      aria-label="Plano não inclui"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobile: boolean
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export default function Sidebar({
  isCollapsed,
  onToggle,
  isMobile,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [slider, setSlider] = useState<{ top: number; height: number } | null>(null)
  const { modules: accessibleModules, loading: modulesLoading, error: modulesError } = useAccessibleModules()

  const hasModuleAccess = (moduleId?: ModuleId): boolean => {
    if (!moduleId) return true
    if (modulesLoading || modulesError || accessibleModules.length === 0) return true
    const entry = accessibleModules.find((m) => m.module.id === moduleId)
    if (!entry) return false
    return entry.accessLevel !== 'BLOCKED'
  }

  const isActive = (item: NavItemConfig) => {
    if (location.pathname === item.to) return true
    if (item.matchPaths) {
      return item.matchPaths.some((p) => location.pathname.startsWith(p))
    }
    return false
  }

  const updateSlider = useCallback(() => {
    const nav = navRef.current
    if (!nav) return

    const activeItem = NAV_ITEMS.find((item) => isActive(item))
    if (!activeItem) {
      setSlider(null)
      return
    }

    const el = itemRefs.current.get(activeItem.to)
    if (!el) return

    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    setSlider({
      top: elRect.top - navRect.top,
      height: elRect.height,
    })
  }, [location.pathname])

  useEffect(() => {
    updateSlider()
  }, [updateSlider])

  function handleNavClick() {
    if (isMobile) onCloseMobile()
  }

  const collapsed = !isMobile && isCollapsed

  // Colapsar: fade-out em 300ms (mesmo tempo da barra).
  // Expandir: delay 100ms + fade-in 300ms.
  const textFade = collapsed
    ? 'opacity-0 transition-opacity duration-300'
    : 'opacity-100 transition-opacity duration-300 delay-100'

  const sidebarContent = (
    <>
      {/* Brand */}
      <button
        type="button"
        onClick={isMobile ? onCloseMobile : onToggle}
        className="h-12 w-full flex items-center border-b border-gray-200 px-4 shrink-0 overflow-hidden cursor-pointer"
      >
        <img src={logoDoxMark} alt="" className="h-6 w-auto shrink-0" />
        <img src={logoDoxText} alt="Dox" className={`h-6 w-auto ml-0.5 shrink-0 ${textFade}`} />
        <span className={`ml-auto text-brand-700/30 text-xl font-medium tracking-tight whitespace-nowrap ${textFade}`}>
          {isMobile ? '✕' : '«'}
        </span>
      </button>

      {/* Navigation */}
      <nav ref={navRef} className="relative flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {/* Sliding active indicator */}
        {slider && (
          <div
            className="absolute left-2 right-2 bg-gray-200 rounded-lg pointer-events-none z-0"
            style={{
              top: slider.top,
              height: slider.height,
              transition: 'top 250ms cubic-bezier(0.25, 0.1, 0.25, 1), height 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          />
        )}

        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          const allowed = hasModuleAccess(item.module)
          const tooltip = allowed ? item.label : `${item.label} — plano não inclui`

          return (
            <div
              key={item.to}
              ref={(el) => { if (el) itemRefs.current.set(item.to, el); else itemRefs.current.delete(item.to) }}
              className="relative group"
            >
              {allowed ? (
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={handleNavClick}
                  className={`relative z-10 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    active
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className={`text-sm whitespace-nowrap ${textFade}`}>
                    {item.label}
                  </span>
                </NavLink>
              ) : (
                <NavLink
                  to="/settings/billing"
                  onClick={handleNavClick}
                  className="relative z-10 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-gray-300 hover:bg-gray-50"
                >
                  <Icon size={20} className="shrink-0" />
                  <span className={`text-sm whitespace-nowrap ${textFade}`}>
                    {item.label}
                  </span>
                  {!collapsed && <LockBadge />}
                </NavLink>
              )}

              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {tooltip}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 py-3 px-2 space-y-1 shrink-0">
        <div className="relative group">
          <NavLink
            to="/guides"
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
              location.pathname === '/guides'
                ? 'bg-gray-200 text-gray-900 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <BookIcon size={20} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap ${textFade}`}>
              Guias
            </span>
          </NavLink>
          {collapsed && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Guias
            </div>
          )}
        </div>

        <p className={`text-xs text-gray-400 whitespace-nowrap text-left pl-3 py-1 ${textFade}`}>
          Pense diferente. Crie melhor
        </p>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed left-0 top-0 h-dvh w-72 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="navigation"
          aria-label="Menu principal"
        >
          {sidebarContent}
        </aside>
      </>
    )
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 overflow-hidden transition-[width] duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      role="navigation"
      aria-label="Menu principal"
    >
      {sidebarContent}
    </aside>
  )
}
