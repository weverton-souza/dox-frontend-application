import type { SaveStatus } from '@/lib/hooks/use-auto-save'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  showLabel?: boolean
}

const STATUS_CONFIG = {
  saved: { color: 'bg-green-500', label: 'Salvo' },
  saving: { color: 'bg-yellow-500', label: 'Salvando...' },
  unsaved: { color: 'bg-orange-500', label: 'Não salvo' },
}

export default function SaveStatusIndicator({ status, showLabel = true }: SaveStatusIndicatorProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-1.5 text-xs shrink-0">
      <span className="relative flex h-2.5 w-2.5" title={config.label}>
        {status === 'saved' && (
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
        )}
        {status === 'saving' && (
          <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-40" />
        )}
        {status === 'unsaved' && (
          <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-40" />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`} />
      </span>
      {showLabel && (
        <span className="text-gray-500 hidden sm:inline">{config.label}</span>
      )}
    </div>
  )
}
