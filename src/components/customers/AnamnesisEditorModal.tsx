import { useState } from 'react'
import type { CustomerData } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TextArea from '@/components/ui/TextArea'
import AttachmentField from '@/components/assessments/AttachmentField'

interface AnamnesisEditorModalProps {
  isOpen: boolean
  customerId: string
  data: CustomerData
  onClose: () => void
  onSave: (patch: Partial<CustomerData>) => void | Promise<void>
}

export default function AnamnesisEditorModal({
  isOpen,
  customerId,
  data,
  onClose,
  onSave,
}: AnamnesisEditorModalProps) {
  const [chiefComplaint, setChiefComplaint] = useState(data.chiefComplaint ?? '')
  const [anamnesisHistory, setAnamnesisHistory] = useState(data.anamnesisHistory ?? '')
  const [familyHistory, setFamilyHistory] = useState(data.familyHistory ?? '')
  const [attachmentFileId, setAttachmentFileId] = useState<string | null>(data.anamnesisAttachmentFileId ?? null)

  async function handleSave() {
    await onSave({
      chiefComplaint: chiefComplaint.trim(),
      anamnesisHistory: anamnesisHistory.trim(),
      familyHistory: familyHistory.trim(),
      anamnesisAttachmentFileId: attachmentFileId,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Anamnese"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TextArea
          label="Queixa principal"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="Descreva a queixa principal do cliente..."
        />
        <TextArea
          label="Histórico clínico"
          value={anamnesisHistory}
          onChange={(e) => setAnamnesisHistory(e.target.value)}
          placeholder="Evolução, tratamentos prévios, intervenções anteriores..."
        />
        <TextArea
          label="Antecedentes familiares"
          value={familyHistory}
          onChange={(e) => setFamilyHistory(e.target.value)}
          placeholder="Histórico de transtornos, doenças relevantes na família..."
        />
        <div>
          <label className="block text-xs text-gray-600 mb-1">Anexo</label>
          <AttachmentField
            customerId={customerId}
            attachmentFileId={attachmentFileId}
            category="anamnesis_attachment"
            onChange={setAttachmentFileId}
          />
        </div>
      </div>
    </Modal>
  )
}
