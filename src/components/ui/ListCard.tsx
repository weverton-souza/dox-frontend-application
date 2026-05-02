import type { ReactNode, MouseEvent } from 'react'

interface ListCardProps {
  onClick?: () => void
  avatar?: ReactNode
  title: string
  subtitle?: ReactNode
  pills?: ReactNode
  badges?: ReactNode
  actions?: ReactNode
}

export default function ListCard({
  onClick,
  avatar,
  title,
  subtitle,
  pills,
  badges,
  actions,
}: ListCardProps) {
  const handleActionClick = (e: MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className={`group bg-white rounded-2xl border border-gray-200/80 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-4 sm:p-5 flex items-center gap-4">
        {avatar && <div className="shrink-0">{avatar}</div>}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
            {title}
          </h3>
          {subtitle && (
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              {subtitle}
            </div>
          )}
          {pills && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {pills}
            </div>
          )}
        </div>

        {badges && (
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {badges}
          </div>
        )}

        {actions && (
          <div
            className="hidden sm:flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleActionClick}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export function ListCardPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
      {children}
    </span>
  )
}

export function ListCardBadge({
  children,
  variant = 'default',
  icon,
}: {
  children: ReactNode
  variant?: 'default' | 'brand' | 'success' | 'warning'
  icon?: ReactNode
}) {
  const styles = {
    default: 'bg-gray-50 text-gray-500',
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
  }

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${styles[variant]}`}>
      {icon}
      {children}
    </span>
  )
}

export function ListCardAction({
  onClick,
  title,
  icon,
  variant = 'default',
}: {
  onClick: () => void
  title: string
  icon: ReactNode
  variant?: 'default' | 'brand' | 'danger'
}) {
  const styles = {
    default: 'hover:bg-gray-100 text-gray-400 hover:text-gray-600',
    brand: 'hover:bg-brand-50 text-gray-400 hover:text-brand-600',
    danger: 'hover:bg-red-50 text-gray-400 hover:text-red-500',
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`p-2 rounded-lg transition-colors ${styles[variant]}`}
      title={title}
    >
      {icon}
    </button>
  )
}

