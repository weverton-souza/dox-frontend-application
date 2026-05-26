import { useState } from 'react'
import type { CustomerData } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AttachmentField from '@/components/assessments/AttachmentField'

interface ReferralEditorModalProps {
  isOpen: boolean
  customerId: string
  data: CustomerData
  onClose: () => void
  onSave: (patch: Partial<CustomerData>) => void | Promise<void>
}

export default function ReferralEditorModal({
  isOpen,
  customerId,
  data,
  onClose,
  onSave,
}: ReferralEditorModalProps) {
  const [value, setValue] = useState(data.referralDoctor ?? '')
  const [attachmentFileId, setAttachmentFileId] = useState<string | null>(data.referralAttachmentFileId ?? null)

  async function handleSave() {
    await onSave({
      referralDoctor: value.trim(),
      referralAttachmentFileId: attachmentFileId,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Encaminhamento"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Médico solicitante"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Dr(a). Nome · CRM/UF número"
        />
        <div>
          <label className="block text-xs text-gray-600 mb-1">Anexo (carta de encaminhamento)</label>
          <AttachmentField
            customerId={customerId}
            attachmentFileId={attachmentFileId}
            category="referral_attachment"
            onChange={setAttachmentFileId}
          />
        </div>
      </div>
    </Modal>
  )
}
