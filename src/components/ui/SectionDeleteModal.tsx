import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { TrashIcon } from '@/components/icons'

interface SectionDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  sectionTitle: string
  childCount: number
  targetSections: { value: string; label: string }[]
  onDeleteAll: () => void
  onMoveAndDelete: (targetSectionId: string) => void
}

const trashIcon = <TrashIcon size={18} />

export default function SectionDeleteModal({
  isOpen,
  onClose,
  sectionTitle,
  childCount,
  targetSections,
  onDeleteAll,
  onMoveAndDelete,
}: SectionDeleteModalProps) {
  const [targetId, setTargetId] = useState('')

  const handleClose = () => {
    setTargetId('')
    onClose()
  }

  const handleDeleteAll = () => {
    setTargetId('')
    onDeleteAll()
  }

  const handleMoveAndDelete = () => {
    if (!targetId) return
    const id = targetId
    setTargetId('')
    onMoveAndDelete(id)
  }

  const itemLabel = childCount === 1 ? 'item' : 'itens'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Excluir seção"
      size="sm"
      accent={{ colorClass: 'bg-red-100 text-red-600', icon: trashIcon }}
    >
      <div className="space-y-5">
        {/* Warning */}
        <p className="text-sm text-gray-600">
          A seção <strong className="text-gray-900">"{sectionTitle}"</strong> possui{' '}
          <strong className="text-gray-900">{childCount} {itemLabel}</strong>.
          O que deseja fazer?
        </p>

        {/* Move option */}
        {targetSections.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <Select
              label="Mover itens para:"
              value={targetId}
              onChange={setTargetId}
              options={targetSections}
              placeholder="Selecione uma seção..."
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMoveAndDelete}
              disabled={!targetId}
              className="w-full"
            >
              Mover e excluir seção
            </Button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Não há outras seções disponíveis para mover os itens.
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteAll}>
            Excluir tudo ({childCount + 1})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
