import { useState, useRef, useEffect } from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import 'react-day-picker/style.css'

interface DateFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onClear: () => void
  className?: string
}

function toDateStr(date: Date | undefined): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(str: string): Date | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

type PickerTarget = 'start' | 'end' | null

export default function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  className = '',
}: DateFilterProps) {
  const [openPicker, setOpenPicker] = useState<PickerTarget>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasValue = startDate || endDate

  const defaultClassNames = getDefaultClassNames()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPicker(null)
      }
    }
    if (openPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openPicker])

  const formatDate = (d: string) =>
    new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  const calendarClassNames = {
    root: `${defaultClassNames.root} text-sm`,
    today: 'font-bold text-brand-600',
    selected: 'bg-gray-200 text-gray-900 font-semibold rounded-lg',
    chevron: `${defaultClassNames.chevron} fill-gray-500`,
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="grid grid-cols-2 bg-gray-200 rounded-full overflow-hidden"
        style={{ padding: '2px' }}
      >
        {/* De */}
        <button
          type="button"
          onClick={() => setOpenPicker(openPicker === 'start' ? null : 'start')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="h-8 w-11 flex items-center justify-center shrink-0 rounded-full bg-white shadow-sm text-gray-500 hover:text-gray-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className={`text-sm whitespace-nowrap ${startDate ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
            {startDate ? formatDate(startDate) : 'De'}
          </span>
        </button>

        {/* Até */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setOpenPicker(openPicker === 'end' ? null : 'end')}
            className="flex items-center gap-2 flex-1 cursor-pointer"
          >
            <div className="h-8 w-11 flex items-center justify-center shrink-0 rounded-full bg-white shadow-sm text-gray-500 hover:text-gray-700 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className={`text-sm whitespace-nowrap ${endDate ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
              {endDate ? formatDate(endDate) : 'Até'}
            </span>
          </button>
          {hasValue && (
            <button
              type="button"
              onClick={() => { onClear(); setOpenPicker(null) }}
              className="h-7 w-7 flex items-center justify-center shrink-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-300/50 transition-colors mr-1"
              title="Limpar filtro"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Picker dropdown */}
      {openPicker && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-dropdown border border-gray-200 z-50 p-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">
            {openPicker === 'start' ? 'Data inicial' : 'Data final'}
          </p>
          <DayPicker
            mode="single"
            selected={parseDate(openPicker === 'start' ? startDate : endDate)}
            onSelect={(date) => {
              const str = toDateStr(date)
              if (openPicker === 'start') {
                onStartDateChange(str)
                if (!endDate) setOpenPicker('end')
                else setOpenPicker(null)
              } else {
                onEndDateChange(str)
                setOpenPicker(null)
              }
            }}
            locale={ptBR}
            disabled={
              openPicker === 'start'
                ? { after: endDate ? parseDate(endDate)! : new Date() }
                : {
                    before: startDate ? parseDate(startDate)! : undefined,
                    after: new Date(),
                  }
            }
            classNames={calendarClassNames}
          />
        </div>
      )}
    </div>
  )
}
