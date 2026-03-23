import { useState, useEffect, useCallback } from 'react'
import type {
  Block,
  BlockData,
  BlockType,
  IdentificationData,
  TextBlockData,
  ScoreTableData,
  InfoBoxData,
  ChartData,
  ReferencesData,
  ClosingPageData,
  Customer,
  AiGenerationResponse,
} from '@/types'
import { BLOCK_TYPE_LABELS } from '@/types'
import { BLOCK_TYPE_COLORS, getBlockTypeIcon } from '@/lib/block-constants'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import AiGenerateButton from '@/components/ai/AiGenerateButton'
import AiRegenerateBar from '@/components/ai/AiRegenerateBar'
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
  customers?: Customer[]
  onCustomerSelected?: (customerId: string) => void
  aiAvailable?: boolean
  onGenerateSection?: (sectionType: string) => Promise<AiGenerationResponse | null>
  onRegenerateSection?: (sectionType: string, generationId: string) => Promise<AiGenerationResponse | null>
  aiLoading?: boolean
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

export default function BlockEditModal({
  block, onClose, onChange, customers, onCustomerSelected,
  aiAvailable = false, onGenerateSection, onRegenerateSection, aiLoading = false,
}: BlockEditModalProps) {
  const [localData, setLocalData] = useState<BlockData | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (block) {
      setLocalData(structuredClone(block.data))
    } else {
      setLocalData(null)
    }
  }, [block])

  const isAiEligible = block?.type === 'text' || block?.type === 'info-box'
  const showAiButton = aiAvailable && isAiEligible && onGenerateSection
  const isGeneratedByAi = block?.generatedByAi === true

  const sectionType = block ? (() => {
    const d = block.data as { title?: string; subtitle?: string; label?: string }
    return d.title || d.subtitle || d.label || 'Seção'
  })() : ''

  const handleAiGenerate = useCallback(async () => {
    if (!onGenerateSection || !block) return
    setGenerating(true)
    const result = await onGenerateSection(sectionType)
    if (result) {
      setLocalData(prev => {
        if (!prev) return prev
        return { ...prev, content: result.text } as BlockData
      })
    }
    setGenerating(false)
  }, [onGenerateSection, block, sectionType])

  const handleAiRegenerate = useCallback(async () => {
    if (!onRegenerateSection || !block?.generationId) return
    setGenerating(true)
    const result = await onRegenerateSection(sectionType, block.generationId)
    if (result) {
      setLocalData(prev => {
        if (!prev) return prev
        return { ...prev, content: result.text } as BlockData
      })
    }
    setGenerating(false)
  }, [onRegenerateSection, block, sectionType])

  if (!block || !localData) return null

  const handleLocalChange = (data: BlockData) => {
    setLocalData(data)
  }

  const handleSave = () => {
    onChange(block.id, localData)
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  const renderContent = () => {
    switch (block.type) {
      case 'identification':
        return (
          <IdentificationBlock
            data={localData as IdentificationData}
            onChange={handleLocalChange}
            customers={customers}
            onCustomerSelected={onCustomerSelected}
          />
        )
      case 'text':
        return (
          <TextBlockModal
            data={localData as TextBlockData}
            onChange={handleLocalChange}
          />
        )
      case 'score-table':
        return (
          <ScoreTableBlock
            data={localData as ScoreTableData}
            onChange={handleLocalChange}
          />
        )
      case 'info-box':
        return (
          <InfoBoxBlock
            data={localData as InfoBoxData}
            onChange={handleLocalChange}
          />
        )
      case 'chart':
        return (
          <ChartBlock
            data={localData as ChartData}
            onChange={handleLocalChange}
          />
        )
      case 'references':
        return (
          <ReferencesBlock
            data={localData as ReferencesData}
            onChange={handleLocalChange}
          />
        )
      case 'closing-page':
        return (
          <ClosingPageBlock
            data={localData as ClosingPageData}
            onChange={handleLocalChange}
          />
        )
    }
  }

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <div>
        {showAiButton && (
          <AiGenerateButton
            onClick={handleAiGenerate}
            loading={generating || aiLoading}
            disabled={generating || aiLoading}
            size="sm"
          />
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Salvar
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={true}
      onClose={handleCancel}
      title={getModalTitle(block)}
      size={MODAL_SIZES[block.type]}
      accent={{
        colorClass: BLOCK_TYPE_COLORS[block.type],
        icon: getBlockTypeIcon(block.type, 18),
      }}
      footer={footer}
    >
      {renderContent()}
      {isGeneratedByAi && isAiEligible && (
        <AiRegenerateBar
          regenerationsLeft={3}
          onRegenerate={handleAiRegenerate}
          loading={generating}
        />
      )}
    </Modal>
  )
}
