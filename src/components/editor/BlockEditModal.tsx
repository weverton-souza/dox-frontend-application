import {
  Block,
  BlockData,
  BlockType,
  BLOCK_TYPE_LABELS,
  IdentificationData,
  TextBlockData,
  ScoreTableData,
  InfoBoxData,
  ChartData,
  ReferencesData,
  ClosingPageData,
  Patient,
} from '@/types'
import Modal from '@/components/ui/Modal'
import IdentificationBlock from '@/components/blocks/IdentificationBlock'
import TextBlockModal from '@/components/blocks/TextBlockModal'
import ScoreTableBlock from '@/components/blocks/ScoreTableBlock'
import InfoBoxBlock from '@/components/blocks/InfoBoxBlock'
import ChartBlock from '@/components/blocks/ChartBlock'
import ReferencesBlock from '@/components/blocks/ReferencesBlock'
import ClosingPageBlock from '@/components/blocks/ClosingPageBlock'

interface BlockEditModalProps {
  block: Block | null
  onClose: () => void
  onChange: (blockId: string, data: BlockData) => void
  patients?: Patient[]
  onPatientSelected?: (patientId: string) => void
}

const MODAL_SIZES: Record<BlockType, 'sm' | 'md' | 'lg' | 'xl' | '2xl'> = {
  identification: '2xl',
  text: 'xl',
  'score-table': 'xl',
  'info-box': 'lg',
  chart: '2xl',
  references: 'xl',
  'closing-page': 'lg',
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

const BLOCK_TYPE_ICONS: Record<BlockType, JSX.Element> = {
  identification: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  text: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  'score-table': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  'info-box': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  references: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  'closing-page': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  ),
}

function getModalTitle(block: Block): string {
  const typeLabel = BLOCK_TYPE_LABELS[block.type]

  switch (block.type) {
    case 'text': {
      const d = block.data as TextBlockData
      const name = d.title || d.subtitle || ''
      return name ? `${typeLabel} — ${name}` : typeLabel
    }
    case 'score-table': {
      const d = block.data as ScoreTableData
      return d.title ? `${typeLabel} — ${d.title}` : typeLabel
    }
    case 'chart': {
      const d = block.data as ChartData
      return d.title ? `${typeLabel} — ${d.title}` : typeLabel
    }
    case 'info-box': {
      const d = block.data as InfoBoxData
      return d.label ? `${typeLabel} — ${d.label}` : typeLabel
    }
    case 'references': {
      const d = block.data as ReferencesData
      return d.title || typeLabel
    }
    case 'closing-page': {
      const d = block.data as ClosingPageData
      return d.title || typeLabel
    }
    default:
      return typeLabel
  }
}

export default function BlockEditModal({ block, onClose, onChange, patients, onPatientSelected }: BlockEditModalProps) {
  if (!block) return null

  const handleChange = (data: BlockData) => {
    onChange(block.id, data)
  }

  const renderContent = () => {
    switch (block.type) {
      case 'identification':
        return (
          <IdentificationBlock
            data={block.data as IdentificationData}
            onChange={handleChange}
            patients={patients}
            onPatientSelected={onPatientSelected}
          />
        )
      case 'text':
        return (
          <TextBlockModal
            data={block.data as TextBlockData}
            onChange={handleChange}
          />
        )
      case 'score-table':
        return (
          <ScoreTableBlock
            data={block.data as ScoreTableData}
            onChange={handleChange}
          />
        )
      case 'info-box':
        return (
          <InfoBoxBlock
            data={block.data as InfoBoxData}
            onChange={handleChange}
          />
        )
      case 'chart':
        return (
          <ChartBlock
            data={block.data as ChartData}
            onChange={handleChange}
          />
        )
      case 'references':
        return (
          <ReferencesBlock
            data={block.data as ReferencesData}
            onChange={handleChange}
          />
        )
      case 'closing-page':
        return (
          <ClosingPageBlock
            data={block.data as ClosingPageData}
            onChange={handleChange}
          />
        )
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={getModalTitle(block)}
      size={MODAL_SIZES[block.type]}
      accent={{
        colorClass: BLOCK_TYPE_COLORS[block.type],
        icon: BLOCK_TYPE_ICONS[block.type],
      }}
    >
      {renderContent()}
    </Modal>
  )
}
