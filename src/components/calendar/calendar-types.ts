import type { CalendarEvent, CustomerCalendarEvent } from '@/types'

export const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const MAX_VISIBLE_EVENTS = 3

export type CalendarView = 'month' | 'week' | 'day'

export interface UnifiedEvent {
  id: string
  source: 'calendar' | 'record'
  title: string
  dateKey: string
  dateTime: Date
  color: string
  tagName?: string
  customerName?: string
  calendarEvent?: CalendarEvent
  recordEvent?: CustomerCalendarEvent
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: UnifiedEvent[]
}

export function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
  const dates: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getWeekDates(date: Date): Date[] {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
