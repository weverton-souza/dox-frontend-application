interface Tab {
  id: string
  label: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export default function PageHeader({ title, subtitle, actions, tabs, activeTab, onTabChange }: PageHeaderProps) {
  return (
    <header className="sticky top-12 bg-white/95 backdrop-blur-sm shadow-xs z-10">
      <div className="max-w-page mx-auto px-page h-11 lg:h-12 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <h1 className="text-sm lg:text-base font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && !tabs && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">
              {subtitle}
            </span>
          )}
          {tabs && (
            <nav className="flex items-center gap-1 ml-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
