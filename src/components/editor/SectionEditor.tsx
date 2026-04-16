import { useMemo } from 'react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Block, BlockData, SectionData } from '@/types'
import { getDirectChildren } from '@/lib/utils'
import type { BlockMeta } from '@/lib/utils'
import OutlineRow from '@/components/editor/OutlineRow'
import Button from '@/components/ui/Button'

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
  locked = false,
}: SectionEditorProps) {
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

  const sortableIds = useMemo(() => visibleBlocks.map((b) => b.id), [visibleBlocks])

  if (!activeItemId || !activeBlock) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center text-sm text-gray-400 italic py-20">
        Selecione um item no sumário para editar.
      </div>
    )
  }

  const headerTitle =
    activeBlock.type === 'section'
      ? (activeBlock.data as SectionData).title?.trim() || 'Seção sem título'
      : blockMetas[activeBlock.id]?.label || ''

  return (
    <section className="flex-1 min-w-0 flex flex-col pb-6">
      <div className="pt-4 pb-3 mb-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
          {headerTitle}
        </h2>
      </div>

      <DndContext>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {visibleBlocks.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400 italic">
                Nenhum bloco nesta seção.
              </p>
            ) : (
              visibleBlocks.map((block) => (
                <OutlineRow
                  key={block.id}
                  block={block}
                  meta={blockMetas[block.id]}
                  depth={0}
                  siblingIndex={0}
                  onEdit={onEditBlock}
                  onChange={onChangeBlock}
                  onDuplicate={locked ? undefined : onDuplicateBlock}
                  onRemove={locked ? undefined : onRemoveBlock}
                  onReviewBlock={onReviewBlock}
                  dragDisabled
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

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
    </section>
  )
}
