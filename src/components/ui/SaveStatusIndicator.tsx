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

  return (
    <div className="flex items-center gap-1.5 text-xs shrink-0">
      <span className={`w-2 h-2 rounded-full ${config.dot}`} title={config.label} />
      {showLabel && (
        <span className="text-gray-500 hidden sm:inline">{config.label}</span>
      )}
    </div>
  )
}
