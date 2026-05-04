import type { SaveStatus } from '@/lib/hooks/use-auto-save'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  showLabel?: boolean
}

const STATUS_CONFIG = {
  saved: { dot: 'bg-green-500', label: 'Salvo' },
  saving: { dot: 'bg-yellow-500 animate-pulse', label: 'Salvando...' },
  unsaved: { dot: 'bg-orange-500', label: 'Não salvo' },
}

export default function SaveStatusIndicator({ status, showLabel = true }: SaveStatusIndicatorProps) {
  const config = STATUS_CONFIG[status]
  const pingColor = status === 'saved' ? 'bg-green-400' : status === 'unsaved' ? 'bg-orange-400' : null

  return (
    <div className="flex items-center gap-1.5 text-xs shrink-0">
      <span className="relative inline-flex w-2 h-2" title={config.label}>
        {pingColor && (
          <span className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${pingColor}`} />
        )}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${config.dot}`} />
      </span>
      {showLabel && (
        <span className="text-gray-500">{config.label}</span>
      )}
    </div>
  )
}
