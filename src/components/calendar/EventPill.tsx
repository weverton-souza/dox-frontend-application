import type { UnifiedEvent } from '@/components/calendar/calendar-types'
import { formatTime } from '@/components/calendar/calendar-types'

interface EventPillProps {
  event: UnifiedEvent
  variant: 'compact' | 'normal'
  onClick?: () => void
}

export default function EventPill({ event, variant, onClick }: EventPillProps) {
  const time = formatTime(event.dateTime)

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-1 px-1 py-px rounded text-[10px] font-medium truncate cursor-pointer transition-colors"
        style={{ backgroundColor: event.color + '12', color: event.color }}
        title={`${time} · ${event.tagName ?? ''} · ${event.title} · ${event.customerName ?? ''}`}
      >
        <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.color }} />
        <span className="truncate" style={{ color: '#333' }}>{event.title || event.tagName}</span>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="px-2 py-1 rounded-lg text-xs font-medium cursor-pointer hover:shadow-sm transition-all"
      style={{ backgroundColor: event.color + '12' }}
    >
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.color }} />
        <span className="truncate font-semibold text-[11px] text-gray-800">{event.title || event.tagName}</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5 pl-3">
        {time}{event.customerName ? ` · ${event.customerName}` : ''}
      </p>
    </div>
  )
}
