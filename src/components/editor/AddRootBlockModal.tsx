import type { BlockType } from '@/types'
import { BLOCK_TYPE_DESCRIPTIONS, BLOCK_TYPE_COLORS, getBlockTypeIcon } from '@/lib/block-constants'
import Modal from '@/components/ui/Modal'

interface AddRootBlockModalProps {
  isOpen: boolean
  onClose: () => void
  availableSpecials: Array<'cover' | 'identification' | 'closing-page'>
  onSelect: (type: BlockType) => void
}

export default function AddRootBlockModal({
  isOpen,
  onClose,
  availableSpecials,
  onSelect,
}: AddRootBlockModalProps) {
  const options: Array<{ type: BlockType; label: string; description: string }> = [
    {
      type: 'section',
      label: 'Nova Seção',
      description: 'Título de seção do relatório (demanda, procedimentos, conclusão, etc.)',
    },
  ]

  if (availableSpecials.includes('cover')) {
    options.push({
      type: 'cover',
      label: 'Capa',
      description: BLOCK_TYPE_DESCRIPTIONS.cover,
    })
  }
  if (availableSpecials.includes('identification')) {
    options.push({
      type: 'identification',
      label: 'Identificação',
      description: BLOCK_TYPE_DESCRIPTIONS.identification,
    })
  }
  if (availableSpecials.includes('closing-page')) {
    options.push({
      type: 'closing-page',
      label: 'Termo de Entrega',
      description: BLOCK_TYPE_DESCRIPTIONS['closing-page'],
    })
  }

  const handleSelect = (type: BlockType) => {
    onSelect(type)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar ao Relatório" size="md">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => handleSelect(option.type)}
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-left group"
            >
              <div className={`p-2 rounded-lg shrink-0 ${BLOCK_TYPE_COLORS[option.type]}`}>
                {getBlockTypeIcon(option.type, 20)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm group-hover:text-brand-700">
                  {option.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
