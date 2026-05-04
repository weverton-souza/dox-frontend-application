import { useState } from 'react'
import type { EventTag, CustomerCalendarEvent } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import DatePicker from '@/components/ui/DatePicker'
import TagPicker from '@/components/calendar/TagPicker'

interface RecordEventEditModalProps {
  record: CustomerCalendarEvent
  tags: EventTag[]
  onClose: () => void
  onSave: (updated: CustomerCalendarEvent) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onViewProfile: () => void
}

export default function RecordEventEditModal({ record, tags, onClose, onSave, onDelete, onViewProfile }: RecordEventEditModalProps) {
  const [type, setType] = useState(record.type)
  const [title, setTitle] = useState(record.title)
  const [description, setDescription] = useState(record.description ?? '')
  const [date, setDate] = useState(() => {
    const dt = new Date(record.date)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  })
  const [time, setTime] = useState(() => {
    const dt = new Date(record.date)
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        ...record,
        type,
        title: title.trim(),
        description: description.trim(),
        date: `${date}T${time}:00`,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(record.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Editar Registro"
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onViewProfile}>
              Ver perfil
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do registro"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Data"
            value={date}
            onChange={setDate}
          />
          <Input
            label="Hora"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <TagPicker
          tags={tags}
          selectedId={tags.find((t) => t.name.toLowerCase() === type)?.id}
          onChange={(id) => {
            const tag = tags.find((t) => t.id === id)
            setType((tag ? tag.name.toLowerCase() : '') as typeof type)
          }}
        />

        {record.customerName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-sm font-medium text-gray-700">{record.customerName}</span>
          </div>
        )}

        <TextArea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes do registro..."
        />
      </div>
    </Modal>
  )
}
