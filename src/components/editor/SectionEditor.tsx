import { useMemo, useState } from 'react'
import type { Block, BlockData, SectionData, Customer } from '@/types'
import { getDirectChildren, getDescendantIds } from '@/lib/utils'
import type { BlockMeta } from '@/lib/utils'
import InlineBlock from '@/components/editor/InlineBlock'
import Button from '@/components/ui/Button'
import SectionDeleteModal from '@/components/ui/SectionDeleteModal'
import MoveBlocksModal from '@/components/editor/MoveBlocksModal'
import { TrashIcon } from '@/components/icons'

interface SectionEditorProps {
  blocks: Block[]
  activeItemId: string | null
  blockMetas: Record<string, BlockMeta>
  onEditBlock: (id: string) => void
  onDuplicateBlock: (id: string) => void
  onRemoveBlock: (id: string) => void
  onChangeBlock: (id: string, data: BlockData) => void
  onRequestAddBlock: (afterId: string, parentId?: string | null) => void
  onReviewBlock?: (id: string) => void
  onDeleteSectionCascade?: (sectionId: string) => void
  onDeleteSectionMove?: (sectionId: string, targetSectionId: string) => void
  onMoveBlocksToSection?: (blockIds: string[], destSectionId: string | null) => void
  customers?: Customer[]
  onCustomerSelected?: (customerId: string) => void
  locked?: boolean
}

export default function SectionEditor({
  blocks,
  activeItemId,
  blockMetas,
  onEditBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onChangeBlock,
  onRequestAddBlock,
  onReviewBlock,
  onDeleteSectionCascade,
  onDeleteSectionMove,
  onMoveBlocksToSection,
  customers,
  onCustomerSelected,
  locked = false,
}: SectionEditorProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [movingBlocks, setMovingBlocks] = useState(false)

  const activeBlock = useMemo(
    () => (activeItemId ? blocks.find((b) => b.id === activeItemId) ?? null : null),
    [blocks, activeItemId]
  )

  const visibleBlocks = useMemo(() => {
    if (!activeBlock) return []
    if (activeBlock.type === 'section') {
      return getDirectChildren(blocks, activeBlock.id).filter((b) => b.type !== 'section')
    }
    return [activeBlock]
  }, [blocks, activeBlock])

  const targetSections = useMemo(() => {
    if (!activeBlock || activeBlock.type !== 'section') return []
    const descendants = new Set(getDescendantIds(blocks, activeBlock.id))
    return blocks
      .filter((b) => b.type === 'section' && b.id !== activeBlock.id && !descendants.has(b.id))
      .map((b) => ({ value: b.id, label: (b.data as SectionData).title || 'Seção' }))
  }, [blocks, activeBlock])

  if (!activeItemId || !activeBlock) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center text-sm text-gray-400 italic py-20">
        Selecione um item no sumário para editar.
      </div>
    )
  }

  const isSectionActive = activeBlock.type === 'section'
  const sectionTitle = isSectionActive
    ? (activeBlock.data as SectionData).title ?? ''
    : ''
  const headerLabel = isSectionActive
    ? sectionTitle.trim() || 'Seção sem título'
    : blockMetas[activeBlock.id]?.label || ''

  const handleSectionTitleChange = (value: string) => {
    if (!isSectionActive) return
    const data = activeBlock.data as SectionData
    onChangeBlock(activeBlock.id, { ...data, title: value })
  }

  const handleSectionTitleBlur = () => {
    if (!isSectionActive) return
    const data = activeBlock.data as SectionData
    if (!data.title?.trim()) {
      onChangeBlock(activeBlock.id, { ...data, title: 'Nova Seção' })
    }
  }

  const descendantCount = isSectionActive
    ? getDescendantIds(blocks, activeBlock.id).length
    : 0

  const handleRequestDeleteSection = () => {
    if (!isSectionActive || !onDeleteSectionCascade) return
    if (descendantCount === 0) {
      onDeleteSectionCascade(activeBlock.id)
      return
    }
    setConfirmingDelete(true)
  }

  const showDeleteSectionButton = isSectionActive && !locked && !!onDeleteSectionCascade
  const showMoveBlocksButton = isSectionActive && !locked && !!onMoveBlocksToSection && visibleBlocks.length > 0

  return (
    <section className="flex-1 min-w-0 flex flex-col pb-6">
      <div className="pt-4 pb-3 mb-3 border-b border-gray-200 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {isSectionActive && !locked ? (
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => handleSectionTitleChange(e.target.value)}
              onBlur={handleSectionTitleBlur}
              placeholder="Título da seção"
              className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
          ) : (
            <h2 className="text-sm font-semibold text-gray-800">
              {headerLabel}
            </h2>
          )}
        </div>
        {showMoveBlocksButton && (
          <button
            type="button"
            onClick={() => setMovingBlocks(true)}
            className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Mover blocos desta seção"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 9 2 12 5 15" />
              <polyline points="9 5 12 2 15 5" />
              <polyline points="15 19 12 22 9 19" />
              <polyline points="19 9 22 12 19 15" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
          </button>
        )}
        {showDeleteSectionButton && (
          <button
            type="button"
            onClick={handleRequestDeleteSection}
            className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Excluir seção"
          >
            <TrashIcon size={16} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visibleBlocks.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-400 italic">
            Nenhum bloco nesta seção.
          </p>
        ) : (
          visibleBlocks.map((block) => (
            <InlineBlock
              key={block.id}
              block={block}
              meta={blockMetas[block.id]}
              onEdit={onEditBlock}
              onChange={onChangeBlock}
              onDuplicate={locked ? undefined : onDuplicateBlock}
              onRemove={locked ? undefined : onRemoveBlock}
              onReviewBlock={onReviewBlock}
              customers={customers}
              onCustomerSelected={onCustomerSelected}
            />
          ))
        )}
      </div>

      {!locked && activeBlock.type === 'section' && (
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const last = visibleBlocks[visibleBlocks.length - 1]
              onRequestAddBlock(last?.id ?? activeBlock.id, activeBlock.id)
            }}
            className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 hover:text-brand-700"
          >
            + Adicionar bloco
          </Button>
        </div>
      )}

      <SectionDeleteModal
        isOpen={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        sectionTitle={isSectionActive ? (sectionTitle.trim() || 'Seção sem título') : ''}
        childCount={descendantCount}
        targetSections={targetSections}
        onDeleteAll={() => {
          if (isSectionActive && onDeleteSectionCascade) {
            onDeleteSectionCascade(activeBlock.id)
          }
          setConfirmingDelete(false)
        }}
        onMoveAndDelete={(targetId) => {
          if (isSectionActive && onDeleteSectionMove) {
            onDeleteSectionMove(activeBlock.id, targetId)
          }
          setConfirmingDelete(false)
        }}
      />

      <MoveBlocksModal
        isOpen={movingBlocks}
        onClose={() => setMovingBlocks(false)}
        blocks={blocks}
        sourceSectionId={isSectionActive ? activeBlock.id : null}
        candidateBlocks={visibleBlocks}
        onConfirm={(blockIds, destId) => {
          if (onMoveBlocksToSection) {
            onMoveBlocksToSection(blockIds, destId)
          }
          setMovingBlocks(false)
        }}
      />
    </section>
  )
}
