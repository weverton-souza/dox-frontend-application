import { useState } from 'react'
import type { MedicationEntry } from '@/types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import AttachmentField from '@/components/assessments/AttachmentField'

interface MedicationsEditorModalProps {
  isOpen: boolean
  customerId: string
  initial: MedicationEntry[]
  onClose: () => void
  onSave: (value: MedicationEntry[]) => void | Promise<void>
}

export default function MedicationsEditorModal({
  isOpen,
  customerId,
  initial,
  onClose,
  onSave,
}: MedicationsEditorModalProps) {
  const [items, setItems] = useState<MedicationEntry[]>(initial.length > 0 ? initial : [{ name: '' }])

  function updateItem(index: number, patch: Partial<MedicationEntry>) {
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function addItem() {
    setItems(prev => [...prev, { name: '' }])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    const cleaned = items
      .map(it => ({
        name: it.name.trim(),
        dose: it.dose?.trim() || undefined,
        frequency: it.frequency?.trim() || undefined,
        attachmentFileId: it.attachmentFileId ?? null,
      }))
      .filter(it => it.name.length > 0)
    await onSave(cleaned)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Medicações em uso"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/50">
            <div className="grid grid-cols-[1fr_120px_150px_auto] gap-2 items-end">
              <Input
                label={idx === 0 ? 'Nome' : undefined}
                value={item.name}
                onChange={e => updateItem(idx, { name: e.target.value })}
                placeholder="Sertralina"
              />
              <Input
                label={idx === 0 ? 'Dose' : undefined}
                value={item.dose ?? ''}
                onChange={e => updateItem(idx, { dose: e.target.value })}
                placeholder="50mg"
              />
              <Input
                label={idx === 0 ? 'Frequência' : undefined}
                value={item.frequency ?? ''}
                onChange={e => updateItem(idx, { frequency: e.target.value })}
                placeholder="1x/dia"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="h-10 px-2 text-gray-400 hover:text-red-600"
                aria-label="Remover"
              >
                ×
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Anexo (receita, bula...)</label>
              <AttachmentField
                customerId={customerId}
                attachmentFileId={item.attachmentFileId}
                category="medication_attachment"
                onChange={fileId => updateItem(idx, { attachmentFileId: fileId })}
              />
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addItem}>+ Adicionar medicação</Button>
      </div>
    </Modal>
  )
}
