import { useState } from 'react'
import type { Diagnosis } from '@/types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import AttachmentField from '@/components/assessments/AttachmentField'

interface DiagnosesEditorModalProps {
  isOpen: boolean
  customerId: string
  initial: Diagnosis[]
  onClose: () => void
  onSave: (value: Diagnosis[]) => void | Promise<void>
}

export default function DiagnosesEditorModal({
  isOpen,
  customerId,
  initial,
  onClose,
  onSave,
}: DiagnosesEditorModalProps) {
  const [items, setItems] = useState<Diagnosis[]>(initial.length > 0 ? initial : [{ label: '' }])

  function updateItem(index: number, patch: Partial<Diagnosis>) {
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function addItem() {
    setItems(prev => [...prev, { label: '' }])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    const cleaned = items
      .map(it => ({
        code: it.code?.trim() || undefined,
        label: it.label.trim(),
        attachmentFileId: it.attachmentFileId ?? null,
      }))
      .filter(it => it.label.length > 0)
    await onSave(cleaned)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Diagnósticos"
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
            <div className="grid grid-cols-[120px_1fr_auto] gap-2 items-end">
              <Input
                label={idx === 0 ? 'CID' : undefined}
                value={item.code ?? ''}
                onChange={e => updateItem(idx, { code: e.target.value })}
                placeholder="F41.1"
              />
              <Input
                label={idx === 0 ? 'Descrição' : undefined}
                value={item.label}
                onChange={e => updateItem(idx, { label: e.target.value })}
                placeholder="Transtorno de Ansiedade Generalizada"
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
              <label className="block text-xs text-gray-600 mb-1">Anexo</label>
              <AttachmentField
                customerId={customerId}
                attachmentFileId={item.attachmentFileId}
                category="diagnosis_attachment"
                onChange={fileId => updateItem(idx, { attachmentFileId: fileId })}
              />
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addItem}>+ Adicionar diagnóstico</Button>
      </div>
    </Modal>
  )
}
