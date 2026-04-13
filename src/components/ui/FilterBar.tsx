import DateFilter from '@/components/ui/DateFilter'

interface FilterBarProps {
  open?: boolean
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  date?: {
    startDate: string
    endDate: string
    onStartDateChange: (date: string) => void
    onEndDateChange: (date: string) => void
    onClear: () => void
  }
  className?: string
}

export default function FilterBar({
  open = true,
  search,
  date,
  className = '',
}: FilterBarProps) {
  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        open ? 'max-h-40 opacity-100 mb-6 overflow-visible' : 'max-h-0 opacity-0 mb-0 overflow-hidden'
      } ${className}`}
    >
      <div className="w-full bg-white rounded-2xl px-5 py-4 shadow-card">
        <h3 className="text-xl font-bold text-gray-700 mb-3">Filtros</h3>
        <div className="flex flex-wrap items-center gap-3">
          {search && (
            <div
              className="flex items-center bg-gray-200 rounded-full overflow-hidden w-[35%]"
              style={{ padding: '2px' }}
            >
              <div className="h-8 w-11 flex items-center justify-center shrink-0 rounded-full bg-white shadow-sm text-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || 'Buscar...'}
                className="bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none px-3 w-full min-w-0"
              />
            </div>
          )}
          {date && (
            <DateFilter
              startDate={date.startDate}
              endDate={date.endDate}
              onStartDateChange={date.onStartDateChange}
              onEndDateChange={date.onEndDateChange}
              onClear={date.onClear}
              className="w-[35%]"
            />
          )}
        </div>
      </div>
    </div>
  )
}
