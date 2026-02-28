import { BlockType, BLOCK_TYPE_LABELS, BLOCK_TYPE_DESCRIPTIONS } from '@/types'
import Modal from '@/components/ui/Modal'

export type BlockVariant = 'subtitle'

interface BlockSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: BlockType, variant?: BlockVariant) => void
}

const BLOCK_TYPE_ICONS: Record<BlockType, JSX.Element> = {
  identification: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  text: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  'score-table': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  'info-box': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  references: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
    </svg>
  ),
  'closing-page': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  ),
}

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  identification: 'bg-blue-100 text-blue-600',
  text: 'bg-emerald-100 text-emerald-600',
  'score-table': 'bg-amber-100 text-amber-600',
  'info-box': 'bg-violet-100 text-violet-600',
  chart: 'bg-rose-100 text-rose-600',
  references: 'bg-cyan-100 text-cyan-600',
  'closing-page': 'bg-gray-100 text-gray-600',
}

// Subtitle icon
const SUBTITLE_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="14" y2="15" />
  </svg>
)

interface BlockOption {
  type: BlockType
  variant?: BlockVariant
  label: string
  description: string
  icon: JSX.Element
  colorClass: string
}

const blockOptions: BlockOption[] = [
  { type: 'text', variant: 'subtitle', label: 'Subtítulo', description: 'Subseção com apenas um título menor', icon: SUBTITLE_ICON, colorClass: 'bg-teal-100 text-teal-600' },
  { type: 'text', label: BLOCK_TYPE_LABELS.text, description: BLOCK_TYPE_DESCRIPTIONS.text, icon: BLOCK_TYPE_ICONS.text, colorClass: BLOCK_TYPE_COLORS.text },
  { type: 'score-table', label: BLOCK_TYPE_LABELS['score-table'], description: BLOCK_TYPE_DESCRIPTIONS['score-table'], icon: BLOCK_TYPE_ICONS['score-table'], colorClass: BLOCK_TYPE_COLORS['score-table'] },
  { type: 'info-box', label: BLOCK_TYPE_LABELS['info-box'], description: BLOCK_TYPE_DESCRIPTIONS['info-box'], icon: BLOCK_TYPE_ICONS['info-box'], colorClass: BLOCK_TYPE_COLORS['info-box'] },
  { type: 'chart', label: BLOCK_TYPE_LABELS.chart, description: BLOCK_TYPE_DESCRIPTIONS.chart, icon: BLOCK_TYPE_ICONS.chart, colorClass: BLOCK_TYPE_COLORS.chart },
  { type: 'references', label: BLOCK_TYPE_LABELS.references, description: BLOCK_TYPE_DESCRIPTIONS.references, icon: BLOCK_TYPE_ICONS.references, colorClass: BLOCK_TYPE_COLORS.references },
]

export default function BlockSelector({ isOpen, onClose, onSelect }: BlockSelectorProps) {
  const handleSelect = (option: BlockOption) => {
    onSelect(option.type, option.variant)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Bloco" size="md">
      <div className="grid grid-cols-2 gap-3 p-4">
        {blockOptions.map((option) => (
          <button
            key={`${option.type}-${option.variant ?? 'default'}`}
            type="button"
            onClick={() => handleSelect(option)}
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-left group"
          >
            <div className={`p-2 rounded-lg shrink-0 ${option.colorClass}`}>
              {option.icon}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm group-hover:text-brand-700">
                {option.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
