import type { CalendarDay, UnifiedEvent } from '@/components/calendar/calendar-types'
import { WEEKDAYS_SHORT, MAX_VISIBLE_EVENTS, toDateKey } from '@/components/calendar/calendar-types'
import EventPill from '@/components/calendar/EventPill'

interface MonthViewProps {
  days: CalendarDay[]
  expandedDay: string | null
  setExpandedDay: (key: string | null) => void
  onDayClick: (date: Date) => void
  onEventClick: (event: UnifiedEvent) => void
}

export default function MonthView({ days, expandedDay, setExpandedDay, onDayClick, onEventClick }: MonthViewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="grid grid-cols-7">
        {WEEKDAYS_SHORT.map((day, i) => (
          <div key={i} className="py-2 text-center text-[11px] font-semibold text-gray-400 tracking-wide">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-t border-gray-100">
        {days.map((day, i) => {
          const key = toDateKey(day.date)
          const isExpanded = expandedDay === key
          const hiddenCount = day.events.length - MAX_VISIBLE_EVENTS
          const visibleEvents = isExpanded ? day.events : day.events.slice(0, MAX_VISIBLE_EVENTS)
          const isFirstRow = i < 7

          return (
            <div
              key={i}
              onClick={() => onDayClick(day.date)}
              className={`
                min-h-[100px] px-1 pt-1 pb-1.5 cursor-pointer transition-colors group/cell
                ${!isFirstRow ? 'border-t border-gray-100' : ''}
                ${i % 7 !== 6 ? 'border-r border-gray-100' : ''}
                ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/30'}
                ${day.isToday ? 'bg-brand-50/20' : ''}
              `}
            >
              <div className="flex items-center justify-center mb-0.5">
                <span
                  className={`
                    text-[13px] w-7 h-7 flex items-center justify-center rounded-full font-medium transition-colors
                    ${day.isToday
                      ? 'bg-brand-600 text-white font-semibold'
                      : day.isCurrentMonth
                        ? 'text-gray-900 group-hover/cell:bg-gray-100'
                        : 'text-gray-300'
                    }
                  `}
                >
                  {day.date.getDate()}
                </span>
              </div>

              <div className="space-y-px" onClick={(e) => e.stopPropagation()}>
                {visibleEvents.map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={() => onEventClick(event)}
                  />
                ))}
                {!isExpanded && hiddenCount > 0 && (
                  <button
                    onClick={() => setExpandedDay(key)}
                    className="w-full text-center text-[10px] text-gray-400 hover:text-brand-600 font-medium py-0.5 rounded transition-colors"
                  >
                    +{hiddenCount} mais
                  </button>
                )}
                {isExpanded && day.events.length > MAX_VISIBLE_EVENTS && (
                  <button
                    onClick={() => setExpandedDay(null)}
                    className="w-full text-center text-[10px] text-gray-400 hover:text-brand-600 font-medium py-0.5 rounded transition-colors"
                  >
                    Menos
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
