import { useState, useEffect } from 'react'
import type { EventTag, CalendarEvent, Customer } from '@/types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import TextArea from '@/components/ui/TextArea'
import Toggle from '@/components/ui/Toggle'
import DatePicker from '@/components/ui/DatePicker'
import { useCustomerSearch } from '@/lib/hooks/use-customer-search'
import TagPicker from '@/components/calendar/TagPicker'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: CreateEventPayload) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  tags: EventTag[]
  onNewTag: () => void
  event?: CalendarEvent | null
  initialDate?: Date | null
}

export interface CreateEventPayload {
  summary: string
  description?: string
  location?: string
  allDay: boolean
  startDate?: string
  startDateTime?: string
  startTimeZone?: string
  endDate?: string
  endDateTime?: string
  endTimeZone?: string
  tagId?: string
  customerId?: string
  status: string
}

function formatDateForInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTimeForInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

interface EventFormData {
  summary: string
  description: string
  location: string
  allDay: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  tagId: string
  customerId: string
}

const EMPTY_FORM: EventFormData = {
  summary: '',
  description: '',
  location: '',
  allDay: false,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  tagId: '',
  customerId: '',
}

export default function CreateEventModal({ isOpen, onClose, onSave, onDelete, tags, onNewTag, event, initialDate }: CreateEventModalProps) {
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM)
  const { search: customerSearch, setSearch: setCustomerSearch, customers, loading: _customerLoading, reset: resetCustomerSearch } = useCustomerSearch(isOpen)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const updateForm = (patch: Partial<EventFormData>) => setForm(prev => ({ ...prev, ...patch }))

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    if (!isOpen) return

    if (event) {
      const dateFields: Pick<EventFormData, 'startDate' | 'startTime' | 'endDate' | 'endTime'> = event.allDay
        ? { startDate: event.start.date ?? '', endDate: event.end.date ?? '', startTime: '', endTime: '' }
        : (() => {
            const startDt = event.start.dateTime ? new Date(event.start.dateTime) : new Date()
            const endDt = event.end.dateTime ? new Date(event.end.dateTime) : addHours(startDt, 1)
            return {
              startDate: formatDateForInput(startDt),
              startTime: formatTimeForInput(startDt),
              endDate: formatDateForInput(endDt),
              endTime: formatTimeForInput(endDt),
            }
          })()

      setForm({
        summary: event.summary,
        description: event.description ?? '',
        location: event.location ?? '',
        allDay: event.allDay,
        tagId: event.tagId ?? '',
        customerId: event.customerId ?? '',
        ...dateFields,
      })
      setCustomerSearch(event.customerName ?? '')
    } else {
      const base = initialDate ?? new Date()
      const now = new Date()
      const roundedHour = new Date(now)
      roundedHour.setMinutes(0, 0, 0)
      roundedHour.setHours(roundedHour.getHours() + 1)

      setForm({
        ...EMPTY_FORM,
        startDate: formatDateForInput(base),
        startTime: formatTimeForInput(roundedHour),
        endDate: formatDateForInput(base),
        endTime: formatTimeForInput(addHours(roundedHour, 1)),
        tagId: tags.length > 0 ? tags[0].id : '',
      })
      resetCustomerSearch()
    }
  }, [isOpen, event, initialDate, tags])

  useEffect(() => {
    if (customers.length > 0) setShowCustomerDropdown(true)
  }, [customers])

  const handleSave = async () => {
    if (!form.summary.trim()) return
    setSaving(true)
    try {
      const payload: CreateEventPayload = {
        summary: form.summary.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        allDay: form.allDay,
        tagId: form.tagId || undefined,
        customerId: form.customerId || undefined,
        status: 'confirmed',
      }

      if (form.allDay) {
        payload.startDate = form.startDate
        payload.endDate = form.endDate || form.startDate
      } else {
        payload.startDateTime = `${form.startDate}T${form.startTime}:00`
        payload.startTimeZone = timeZone
        payload.endDateTime = `${form.endDate}T${form.endTime}:00`
        payload.endTimeZone = timeZone
      }

      await onSave(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(event.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const selectCustomer = (customer: Customer) => {
    updateForm({ customerId: customer.id })
    setCustomerSearch(customer.data.name)
    setShowCustomerDropdown(false)
  }

  const clearCustomer = () => {
    updateForm({ customerId: '' })
    resetCustomerSearch()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Editar Agendamento' : 'Novo Agendamento'}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <div>
            {event && onDelete && (
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.summary.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Título"
          value={form.summary}
          onChange={(e) => updateForm({ summary: e.target.value })}
          placeholder="Ex: Consulta com Maria"
          autoFocus
        />

        <Toggle label="Dia inteiro" checked={form.allDay} onChange={(v) => updateForm({ allDay: v })} />

        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Data início"
            value={form.startDate}
            onChange={(value) => {
              updateForm({ startDate: value })
              if (!form.endDate || value > form.endDate) updateForm({ endDate: value })
            }}
          />
          {!form.allDay && (
            <Input
              label="Hora início"
              type="time"
              value={form.startTime}
              onChange={(e) => updateForm({ startTime: e.target.value })}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Data fim"
            value={form.endDate}
            min={form.startDate}
            onChange={(value) => updateForm({ endDate: value })}
          />
          {!form.allDay && (
            <Input
              label="Hora fim"
              type="time"
              value={form.endTime}
              onChange={(e) => updateForm({ endTime: e.target.value })}
            />
          )}
        </div>

        <TagPicker tags={tags} selectedId={form.tagId} onChange={(v) => updateForm({ tagId: v })} onNewTag={onNewTag} />

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (opcional)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value)
                if (!e.target.value.trim()) clearCustomer()
              }}
              onFocus={() => {
                if (customers.length > 0) setShowCustomerDropdown(true)
              }}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors placeholder:text-gray-400"
            />
            {form.customerId && (
              <button
                type="button"
                onClick={clearCustomer}
                className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {showCustomerDropdown && customers.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCustomer(c)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {c.data.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Localização (opcional)"
          value={form.location}
          onChange={(e) => updateForm({ location: e.target.value })}
          placeholder="Ex: Consultório, Sala 3"
        />

        <TextArea
          label="Descrição (opcional)"
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          placeholder="Detalhes do agendamento..."
        />
      </div>
    </Modal>
  )
}
