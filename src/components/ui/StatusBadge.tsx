import { LaudoStatus, LAUDO_STATUS_LABELS, LAUDO_STATUS_COLORS } from '@/types'

interface StatusBadgeProps {
  status: LaudoStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text } = LAUDO_STATUS_COLORS[status]
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {LAUDO_STATUS_LABELS[status]}
    </span>
  )
}
