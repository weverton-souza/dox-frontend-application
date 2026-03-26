import type { UnifiedEvent } from '@/components/calendar/calendar-types'
import { formatTime } from '@/components/calendar/calendar-types'

interface DayViewProps {
  events: UnifiedEvent[]
  onEventClick: (event: UnifiedEvent) => void
}

export default function DayView({ events, onEventClick }: DayViewProps) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="py-20 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Nenhum evento</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Agendar" para criar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] divide-y divide-gray-100">
      {events.map((event) => {
        const time = formatTime(event.dateTime)
        const isCalendarEvent = event.source === 'calendar'
        const description = isCalendarEvent ? event.calendarEvent?.description : event.recordEvent?.description

        return (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors cursor-pointer hover:bg-gray-50/60"
          >
            <div className="shrink-0 w-14 pt-0.5">
              <p className="text-[13px] font-medium text-gray-500 tabular-nums">{time}</p>
            </div>

            <div
              className="shrink-0 w-[3px] self-stretch rounded-full mt-0.5 mb-0.5"
              style={{ backgroundColor: event.color }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-semibold text-gray-900 truncate">{event.title}</h4>
                <span className="shrink-0 text-[10px] font-medium px-1.5 py-px rounded-full text-white" style={{ backgroundColor: event.color }}>
                  {event.tagName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {event.customerName && <span className="text-[12px] text-gray-400">{event.customerName}</span>}
              </div>
              {description && (
                <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
