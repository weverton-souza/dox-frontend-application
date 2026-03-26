import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CalendarEvent, EventTag, CustomerCalendarEvent } from '@/types'
import { getAllCustomerEvents, updateCustomerEvent, deleteCustomerEvent } from '@/lib/api/customer-api'
import {
  getCalendarEvents,
  getEventTags,
  createEventTag,
  updateEventTag,
  deleteEventTag,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/api/calendar-api'
import { useError } from '@/contexts/ErrorContext'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import DotPattern from '@/components/ui/DotPattern'
import Button from '@/components/ui/Button'
import EventTagModal from '@/components/calendar/EventTagModal'
import CreateEventModal from '@/components/calendar/CreateEventModal'
import type { CreateEventPayload } from '@/components/calendar/CreateEventModal'
import MonthView from '@/components/calendar/MonthView'
import WeekView from '@/components/calendar/WeekView'
import DayView from '@/components/calendar/DayView'
import RecordEventEditModal from '@/components/calendar/RecordEventEditModal'
import type { CalendarView, UnifiedEvent, CalendarDay } from '@/components/calendar/calendar-types'
import { MONTH_NAMES, getMonthGrid, isSameDay, toDateKey, getWeekDates } from '@/components/calendar/calendar-types'

export default function Calendar() {
  const { showError } = useError()
  const routerNavigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [recordEvents, setRecordEvents] = useState<CustomerCalendarEvent[]>([])
  const [tags, setTags] = useState<EventTag[]>([])

  const [activeTagFilters, setActiveTagFilters] = useState<Set<string>>(new Set())

  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<EventTag | null>(null)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [clickedDate, setClickedDate] = useState<Date | null>(null)
  const [viewingRecord, setViewingRecord] = useState<CustomerCalendarEvent | null>(null)
  const [reopenEventModal, setReopenEventModal] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = useMemo(() => new Date(), [])

  const loadTags = useCallback(async () => {
    try {
      const data = await getEventTags()
      setTags(data)
      setActiveTagFilters((prev) => {
        const next = new Set(prev)
        for (const tag of data) {
          if (!next.has(tag.id)) next.add(tag.id)
        }
        return next
      })
    } catch (err) {
      showError(err)
    }
  }, [showError])

  useEffect(() => { loadTags() }, [loadTags])

  useEffect(() => {
    const from = new Date(year, month - 1, 1).toISOString()
    const to = new Date(year, month + 2, 0).toISOString()
    getCalendarEvents(from, to).then(setCalendarEvents).catch(showError)
    getAllCustomerEvents(from, to).then(setRecordEvents).catch(showError)
  }, [year, month, showError])

  const unifiedEvents = useMemo(() => {
    const events: UnifiedEvent[] = []
    for (const ce of calendarEvents) {
      if (ce.tagId && !activeTagFilters.has(ce.tagId)) continue
      const dt = ce.allDay
        ? new Date(ce.start.date + 'T00:00:00')
        : new Date(ce.start.dateTime ?? ce.start.date ?? '')
      events.push({
        id: `cal-${ce.id}`, source: 'calendar', title: ce.summary,
        dateKey: toDateKey(dt), dateTime: dt, color: ce.tagColor ?? '#007AFF',
        tagName: ce.tagName, customerName: ce.customerName, calendarEvent: ce,
      })
    }
    for (const re of recordEvents) {
      const dt = new Date(re.date)
      const matchedTag = tags.find((t) => t.name.toLowerCase() === re.type.toLowerCase())
      events.push({
        id: `rec-${re.id}`, source: 'record', title: re.title,
        dateKey: toDateKey(dt), dateTime: dt,
        color: matchedTag?.color ?? '#8E8E93',
        tagName: matchedTag?.name ?? re.type,
        customerName: re.customerName, recordEvent: re,
      })
    }
    return events
  }, [calendarEvents, recordEvents, activeTagFilters, tags])

  const eventsByDate = useMemo(() => {
    const map: Map<string, UnifiedEvent[]> = new Map()
    for (const event of unifiedEvents) {
      if (!map.has(event.dateKey)) map.set(event.dateKey, [])
      map.get(event.dateKey)!.push(event)
    }
    for (const [, dayEvents] of map) {
      dayEvents.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
    }
    return map
  }, [unifiedEvents])

  const navigate = useCallback((delta: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (view === 'month') next.setMonth(next.getMonth() + delta)
      else if (view === 'week') next.setDate(next.getDate() + delta * 7)
      else next.setDate(next.getDate() + delta)
      return next
    })
    setExpandedDay(null)
  }, [view])

  const goToToday = useCallback(() => { setCurrentDate(new Date()); setExpandedDay(null) }, [])
  const toggleTagFilter = useCallback((id: string) => {
    setActiveTagFilters((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  const handleSaveTag = async (tagData: { name: string; color: string }) => {
    try {
      if (editingTag) {
        const updated = await updateEventTag(editingTag.id, tagData)
        setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      } else {
        const created = await createEventTag(tagData)
        setTags((prev) => [...prev, created])
        setActiveTagFilters((prev) => new Set([...prev, created.id]))
      }
    } catch (err) {
      showError(err)
      throw err
    }
  }
  const handleDeleteTag = async (id: string) => {
    try {
      await deleteEventTag(id)
      setTags((prev) => prev.filter((t) => t.id !== id))
      setActiveTagFilters((prev) => { const n = new Set(prev); n.delete(id); return n })
    } catch (err) {
      showError(err)
      throw err
    }
  }
  const handleSaveEvent = async (payload: CreateEventPayload) => {
    try {
      const request = {
        summary: payload.summary, description: payload.description, location: payload.location,
        allDay: payload.allDay,
        start: payload.allDay ? { date: payload.startDate } : { dateTime: payload.startDateTime, timeZone: payload.startTimeZone },
        end: payload.allDay ? { date: payload.endDate } : { dateTime: payload.endDateTime, timeZone: payload.endTimeZone },
        tagId: payload.tagId, customerId: payload.customerId, status: payload.status,
      }
      if (editingEvent) {
        const updated = await updateCalendarEvent(editingEvent.id, request)
        setCalendarEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      } else {
        const created = await createCalendarEvent(request)
        setCalendarEvents((prev) => [...prev, created])
      }
    } catch (err) {
      showError(err)
      throw err
    }
  }
  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteCalendarEvent(id)
      setCalendarEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      showError(err)
      throw err
    }
  }

  const openNewEvent = (date?: Date) => { setEditingEvent(null); setClickedDate(date ?? null); setEventModalOpen(true) }
  const openEditEvent = (event: CalendarEvent) => { setEditingEvent(event); setClickedDate(null); setEventModalOpen(true) }
  const openNewTag = () => {
    setEditingTag(null)
    if (eventModalOpen) setReopenEventModal(true)
    setEventModalOpen(false)
    setTagModalOpen(true)
  }
  const openEditTag = (tag: EventTag) => {
    setEditingTag(tag)
    setEventModalOpen(false)
    setTagModalOpen(true)
  }
  const handleEventClick = (event: UnifiedEvent) => {
    if (event.source === 'calendar' && event.calendarEvent) {
      openEditEvent(event.calendarEvent)
    } else if (event.source === 'record' && event.recordEvent) {
      setViewingRecord(event.recordEvent)
    }
  }

  const monthDays: CalendarDay[] = useMemo(() => {
    return getMonthGrid(year, month).map((date) => ({
      date, isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today), events: eventsByDate.get(toDateKey(date)) ?? [],
    }))
  }, [year, month, today, eventsByDate])

  const weekDays: CalendarDay[] = useMemo(() => {
    return getWeekDates(currentDate).map((date) => ({
      date, isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today), events: eventsByDate.get(toDateKey(date)) ?? [],
    }))
  }, [currentDate, month, today, eventsByDate])

  const dayEvents: UnifiedEvent[] = useMemo(() => eventsByDate.get(toDateKey(currentDate)) ?? [], [currentDate, eventsByDate])

  const headerTitle = useMemo(() => {
    if (view === 'month') return `${MONTH_NAMES[month]} ${year}`
    if (view === 'week') {
      const dates = getWeekDates(currentDate)
      const f = dates[0], l = dates[6]
      if (f.getMonth() === l.getMonth()) return `${f.getDate()} – ${l.getDate()} de ${MONTH_NAMES[f.getMonth()]} ${f.getFullYear()}`
      return `${f.getDate()} ${MONTH_NAMES[f.getMonth()].slice(0, 3)} – ${l.getDate()} ${MONTH_NAMES[l.getMonth()].slice(0, 3)} ${l.getFullYear()}`
    }
    return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }, [view, currentDate, month, year])

  const totalEventsCount = useMemo(() => unifiedEvents.length, [unifiedEvents])

  return (
    <DotPattern className="min-h-[calc(100vh)] flex flex-col">
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 sm:px-6 py-3 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                >
                  <ChevronLeftIcon size={18} />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                >
                  <ChevronRightIcon size={18} />
                </button>
              </div>
              <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">{headerTitle}</h1>
              <button
                onClick={goToToday}
                className="ml-2 px-2.5 py-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5">
                {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1 text-[13px] font-medium rounded-md transition-all ${
                      view === v
                        ? 'bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <Button size="sm" onClick={() => openNewEvent()}>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
                  Agendar
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-3 flex-wrap">
            {tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {tags.map((tag) => {
                  const isActive = activeTagFilters.has(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagFilter(tag.id)}
                      onDoubleClick={() => openEditTag(tag)}
                      className={`inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-gray-100 text-gray-700'
                          : 'text-gray-400 hover:text-gray-500'
                      }`}
                      title="Clique para filtrar, duplo-clique para editar"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${isActive ? '' : 'opacity-30'}`}
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  )
                })}
                <button onClick={openNewTag} className="text-[11px] text-brand-500 hover:text-brand-600 font-medium ml-0.5 transition-colors">
                  +
                </button>
              </div>
            )}

            {tags.length === 0 && (
              <button onClick={openNewTag} className="text-[11px] text-brand-500 hover:text-brand-600 font-medium transition-colors">
                + Nova tag
              </button>
            )}

            {totalEventsCount > 0 && (
              <>
                <div className="w-px h-3.5 bg-gray-200" />
                <span className="text-[11px] text-gray-400">{totalEventsCount} evento{totalEventsCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
          {view === 'month' && <MonthView days={monthDays} expandedDay={expandedDay} setExpandedDay={setExpandedDay} onDayClick={openNewEvent} onEventClick={handleEventClick} />}
          {view === 'week' && <WeekView days={weekDays} onDayClick={openNewEvent} onEventClick={handleEventClick} />}
          {view === 'day' && <DayView events={dayEvents} onEventClick={handleEventClick} />}
        </div>
      </div>

      <CreateEventModal
        isOpen={eventModalOpen}
        onClose={() => { setEventModalOpen(false); setEditingEvent(null); setClickedDate(null) }}
        onSave={handleSaveEvent}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
        tags={tags}
        onNewTag={openNewTag}
        event={editingEvent}
        initialDate={clickedDate}
      />
      <EventTagModal
        isOpen={tagModalOpen}
        onClose={() => {
          setTagModalOpen(false)
          setEditingTag(null)
          if (reopenEventModal) {
            setReopenEventModal(false)
            setEventModalOpen(true)
          }
        }}
        onSave={handleSaveTag}
        onDelete={editingTag ? handleDeleteTag : undefined}
        tag={editingTag}
        existingColors={tags.map((t) => t.color)}
      />
      {viewingRecord && (
        <RecordEventEditModal
          record={viewingRecord}
          tags={tags}
          onClose={() => setViewingRecord(null)}
          onSave={async (updated) => {
            try {
              await updateCustomerEvent(updated.customerId, updated.id, {
                customerId: updated.customerId,
                type: updated.type,
                title: updated.title,
                description: updated.description,
                date: updated.date,
              })
              setRecordEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
              setViewingRecord(null)
            } catch (err) {
              showError(err)
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteCustomerEvent(viewingRecord.customerId, id)
              setRecordEvents((prev) => prev.filter((e) => e.id !== id))
              setViewingRecord(null)
            } catch (err) {
              showError(err)
            }
          }}
          onViewProfile={() => { routerNavigate(`/customers/${viewingRecord.customerId}`); setViewingRecord(null) }}
        />
      )}
    </DotPattern>
  )
}
