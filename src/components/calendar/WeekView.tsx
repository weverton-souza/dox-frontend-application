import type { CalendarDay, UnifiedEvent } from '@/components/calendar/calendar-types'
import { WEEKDAYS } from '@/components/calendar/calendar-types'
import EventPill from '@/components/calendar/EventPill'

interface WeekViewProps {
  days: CalendarDay[]
  onDayClick: (date: Date) => void
  onEventClick: (event: UnifiedEvent) => void
}

export default function WeekView({ days, onDayClick, onEventClick }: WeekViewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {days.map((day, i) => (
          <div
            key={i}
            className={`py-3 text-center ${i < 6 ? 'border-r border-gray-100' : ''} ${day.isToday ? 'bg-brand-50/30' : ''}`}
          >
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{WEEKDAYS[i]}</p>
            <p className={`text-xl font-semibold mt-0.5 ${day.isToday ? 'text-brand-600' : 'text-gray-900'}`}>
              {day.date.getDate()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 min-h-[420px]">
        {days.map((day, i) => (
          <div
            key={i}
            onClick={() => onDayClick(day.date)}
            className={`
              p-1.5 space-y-1 cursor-pointer transition-colors
              ${i < 6 ? 'border-r border-gray-100' : ''}
              ${day.isToday ? 'bg-brand-50/15' : 'hover:bg-gray-50/40'}
            `}
          >
            <div onClick={(e) => e.stopPropagation()}>
              {day.events.map((event) => (
                <div key={event.id} className="mb-1">
                  <EventPill
                    event={event}
                    variant="normal"
                    onClick={() => onEventClick(event)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
