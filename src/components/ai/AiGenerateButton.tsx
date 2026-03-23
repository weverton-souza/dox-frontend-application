import AiSparkleIcon from './AiSparkleIcon'

interface AiGenerateButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md'
  label?: string
  tooltip?: string
  className?: string
}

export default function AiGenerateButton({
  onClick,
  disabled = false,
  loading = false,
  size = 'md',
  label,
  tooltip,
  className = '',
}: AiGenerateButtonProps) {
  const isDisabled = disabled || loading

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1.5 text-xs gap-1.5'
    : 'px-4 py-2 text-sm gap-2'

  const iconSize = size === 'sm' ? 14 : 16

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={tooltip}
      className={`
        inline-flex items-center ${sizeClasses}
        bg-gradient-to-r from-brand-600 to-brand-700
        text-white font-medium rounded-lg
        hover:from-brand-700 hover:to-brand-800
        focus:outline-none focus:ring-2 focus:ring-brand-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
        </svg>
      ) : (
        <AiSparkleIcon size={iconSize} />
      )}
      {label ?? (size === 'sm' ? 'Assistente' : 'Redigir com Assistente')}
    </button>
  )
}
