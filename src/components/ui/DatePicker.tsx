import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker, getDefaultClassNames, type Matcher } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import 'react-day-picker/style.css'

type DatePickerSize = 'sm' | 'md'

interface DatePickerProps {
  /** Valor em ISO `YYYY-MM-DD`. String vazia se nao definido. */
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  placeholder?: string
  /** ISO `YYYY-MM-DD`. Datas anteriores ficam desabilitadas. */
  min?: string
  /** ISO `YYYY-MM-DD`. Datas posteriores ficam desabilitadas. */
  max?: string
  disabled?: boolean
  required?: boolean
  id?: string
  size?: DatePickerSize
  className?: string
}

interface DropdownPosition {
  top: number
  left: number
  minWidth: number
}

const DROPDOWN_ESTIMATED_HEIGHT = 360
const DROPDOWN_ESTIMATED_WIDTH = 280
const DROPDOWN_GAP = 4
const VIEWPORT_PADDING = 8

function toIsoDate(date: Date | undefined): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function formatPtBr(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const sizeStyles: Record<DatePickerSize, { trigger: string; calendarText: string }> = {
  sm: {
    trigger: 'h-7 px-2 text-xs rounded-md',
    calendarText: 'text-xs',
  },
  md: {
    trigger: 'h-10 px-3.5 text-[15px] rounded-xl',
    calendarText: 'text-sm',
  },
}

export default function DatePicker({
  value,
  onChange,
  label,
  error,
  placeholder = 'Selecionar data',
  min,
  max,
  disabled = false,
  required = false,
  id,
  size = 'md',
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<DropdownPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const styles = sizeStyles[size]
  const defaultClassNames = getDefaultClassNames()

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth

    const spaceBelow = viewportH - rect.bottom
    const openUp = spaceBelow < DROPDOWN_ESTIMATED_HEIGHT && rect.top > DROPDOWN_ESTIMATED_HEIGHT
    const top = openUp
      ? Math.max(VIEWPORT_PADDING, rect.top - DROPDOWN_ESTIMATED_HEIGHT - DROPDOWN_GAP)
      : rect.bottom + DROPDOWN_GAP

    const overflowsRight = rect.left + DROPDOWN_ESTIMATED_WIDTH > viewportW - VIEWPORT_PADDING
    const left = overflowsRight
      ? Math.max(VIEWPORT_PADDING, viewportW - DROPDOWN_ESTIMATED_WIDTH - VIEWPORT_PADDING)
      : rect.left

    setPosition({ top, left, minWidth: rect.width })
  }, [])

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  const calendarClassNames = {
    root: `${defaultClassNames.root} ${styles.calendarText}`,
    today: 'font-bold text-brand-600',
    selected: 'bg-brand-500 text-white font-semibold rounded-lg',
    chevron: `${defaultClassNames.chevron} fill-gray-500`,
  }

  const triggerBase = `
    w-full inline-flex items-center justify-between gap-2 border bg-white text-left
    transition-colors duration-150
    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/15
    disabled:opacity-50 disabled:pointer-events-none
  `
  const triggerBorder = error
    ? 'border-red-400 focus-visible:border-red-500'
    : 'border-gray-200 hover:border-gray-300 focus-visible:border-brand-500'

  const dropdown = open && position ? (
    <div
      ref={dropdownRef}
      role="dialog"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        minWidth: position.minWidth,
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-dropdown border border-gray-200 p-3"
    >
      <DayPicker
        mode="single"
        selected={parseIsoDate(value)}
        onSelect={(date) => {
          onChange(toIsoDate(date))
          setOpen(false)
        }}
        locale={ptBR}
        disabled={(() => {
          const minDate = min ? parseIsoDate(min) : undefined
          const maxDate = max ? parseIsoDate(max) : undefined
          const matchers: Matcher[] = []
          if (minDate) matchers.push({ before: minDate })
          if (maxDate) matchers.push({ after: maxDate })
          return matchers.length > 0 ? matchers : undefined
        })()}
        classNames={calendarClassNames}
      />
      {value && (
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            Limpar
          </button>
        </div>
      )}
    </div>
  ) : null

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label || placeholder}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`${triggerBase} ${triggerBorder} ${styles.trigger}`.trim()}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? formatPtBr(value) : placeholder}
        </span>
        <svg
          width={size === 'sm' ? 12 : 14}
          height={size === 'sm' ? 12 : 14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 shrink-0"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  )
}
