import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import TagsInput from '@/components/ui/TagsInput'

interface AllergiesEditorModalProps {
  isOpen: boolean
  initial: string[]
  onClose: () => void
  onSave: (value: string[]) => void | Promise<void>
}

export default function AllergiesEditorModal({ isOpen, initial, onClose, onSave }: AllergiesEditorModalProps) {
  const [tags, setTags] = useState<string[]>(initial)

  async function handleSave() {
    await onSave(tags.filter(t => t.trim().length > 0))
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alergias"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Digite cada alergia e pressione Enter ou vírgula pra adicionar.
        </p>
        <TagsInput
          tags={tags}
          onChange={setTags}
          placeholder="Penicilina, látex, amendoim..."
        />
      </div>
    </Modal>
  )
}
