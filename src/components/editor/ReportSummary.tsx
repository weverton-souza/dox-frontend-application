import { useMemo, useState, useCallback } from 'react'
import type { Block, SectionData } from '@/types'
import { getDirectChildren, getDescendantIds } from '@/lib/utils'
import { getBlockTitle } from '@/lib/block-constants'
import Button from '@/components/ui/Button'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ReportSummaryProps {
  blocks: Block[]
  activeItemId: string | null
  onSelect: (itemId: string) => void
  onRequestAddSection: () => void
  onBlocksChange?: (blocks: Block[]) => void
  locked?: boolean
}

interface SummaryItem {
  block: Block
  depth: number
  hasChildren: boolean
  hasTreeSiblingAfter: boolean
}

function buildSummaryItems(blocks: Block[], collapsed: Set<string>): SummaryItem[] {
  const items: SummaryItem[] = []

  function walk(parentId: string | null, depth: number) {
    const children = getDirectChildren(blocks, parentId)
    const visibleChildren = children.filter((b) =>
      b.type === 'section' ||
      (parentId === null && (b.type === 'identification' || b.type === 'closing-page' || b.type === 'cover'))
    )
    visibleChildren.forEach((block, idx) => {
      const sectionChildren = block.type === 'section'
        ? getDirectChildren(blocks, block.id).filter((b) => b.type === 'section')
        : []
      const afterBlocks = visibleChildren.slice(idx + 1)
      // No root (depth 0) todos participam da árvore. Em níveis mais profundos, só sections.
      const hasTreeSiblingAfter = depth === 0
        ? afterBlocks.length > 0
        : afterBlocks.some((b) => b.type === 'section')
      items.push({
        block,
        depth,
        hasChildren: sectionChildren.length > 0,
        hasTreeSiblingAfter,
      })
      if (block.type === 'section' && !collapsed.has(block.id)) {
        walk(block.id, depth + 1)
      }
    })
  }

  walk(null, 0)
  return items
}

function itemLabel(block: Block): string {
  if (block.type === 'section') {
    const title = (block.data as SectionData).title?.trim()
    return title || 'Seção sem título'
  }
  return getBlockTitle(block)
}

interface ItemContentProps {
  item: SummaryItem
  isActive: boolean
  isTreeNode: boolean
  isCollapsed: boolean
  indentPx: number
  parentTrunkX: number
  toggleCollapse: (id: string) => void
  onSelect: (id: string) => void
  dragHandle?: React.ReactNode
}

function ItemContent({
  item,
  isActive,
  isTreeNode,
  isCollapsed,
  indentPx,
  parentTrunkX,
  toggleCollapse,
  onSelect,
  dragHandle,
}: ItemContentProps) {
  if (!isTreeNode) {
    return (
      <button
        type="button"
        onClick={() => onSelect(item.block.id)}
        style={{ paddingLeft: `${indentPx}px` }}
        className={`w-full text-left pr-3 py-1.5 rounded-md text-sm leading-snug transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        title={itemLabel(item.block)}
      >
        {itemLabel(item.block)}
      </button>
    )
  }

  return (
    <>
      {/* Ancestor trunks */}
      {Array.from({ length: item.depth }).map((_, i) => (
        <span
          key={`trunk-${i}`}
          aria-hidden="true"
          className="absolute border-l border-gray-200 pointer-events-none"
          style={{ left: `${12 + i * 16}px`, top: '-4px', bottom: '-4px' }}
        />
      ))}

      {/* Trunk do próprio nível */}
      {item.hasTreeSiblingAfter && (
        <span
          aria-hidden="true"
          className="absolute border-l border-gray-200 pointer-events-none"
          style={{ left: `${indentPx}px`, top: '12px', bottom: '-4px' }}
        />
      )}

      {/* L-curve */}
      {item.depth > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0 border-l border-b border-gray-200 rounded-bl-lg pointer-events-none"
          style={{ left: `${parentTrunkX}px`, width: '16px', height: '16px' }}
        />
      )}

      {/* Bolinha / Chevron */}
      {item.hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleCollapse(item.block.id)
          }}
          aria-label={isCollapsed ? 'Expandir' : 'Recolher'}
          className="absolute w-4 h-4 flex items-center justify-center rounded-full bg-white border border-gray-400 text-gray-500 hover:text-gray-800 hover:border-gray-600 transition-colors z-10"
          style={{ left: `${indentPx - 8}px`, top: '8px' }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <span
          aria-hidden="true"
          className="absolute w-2 h-2 rounded-full border border-gray-400 bg-white pointer-events-none z-10"
          style={{ left: `${indentPx - 4}px`, top: '12px' }}
        />
      )}

      {dragHandle}

      <button
        type="button"
        onClick={() => onSelect(item.block.id)}
        style={{ paddingLeft: `${indentPx + (item.hasChildren ? 14 : 10)}px` }}
        className={`relative w-full text-left pr-3 py-1.5 rounded-md text-sm leading-snug transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        title={itemLabel(item.block)}
      >
        {itemLabel(item.block)}
      </button>
    </>
  )
}

interface SortableSectionProps extends Omit<ItemContentProps, 'dragHandle'> {}

function SortableSection(props: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.block.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dragHandle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="absolute p-1 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100 cursor-grab active:cursor-grabbing z-30"
      style={{ right: '4px', top: '4px' }}
      aria-label="Reordenar seção"
      title="Arrastar para reordenar"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
        <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
        <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
      </svg>
    </button>
  )

  return (
    <li ref={setNodeRef} style={style} className="relative">
      <ItemContent {...props} dragHandle={dragHandle} />
    </li>
  )
}

export default function ReportSummary({
  blocks,
  activeItemId,
  onSelect,
  onRequestAddSection,
  onBlocksChange,
  locked = false,
}: ReportSummaryProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const items = useMemo(() => buildSummaryItems(blocks, collapsed), [blocks, collapsed])

  // IDs de TODAS as sections (root + sub) — draggables
  const allSectionIds = useMemo(
    () => items.filter((i) => i.block.type === 'section').map((i) => i.block.id),
    [items]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Custom collision detection: só candidatos que são irmãos da section ativa (mesmo parentId)
  const collisionDetection = useCallback(
    (args: Parameters<typeof closestCenter>[0]) => {
      const activeId = String(args.active.id)
      const activeBlock = blocks.find((b) => b.id === activeId)
      if (!activeBlock) return closestCenter(args)

      const filteredContainers = args.droppableContainers.filter((c) => {
        const block = blocks.find((b) => b.id === String(c.id))
        return block?.type === 'section' && block.parentId === activeBlock.parentId
      })
      return closestCenter({ ...args, droppableContainers: filteredContainers })
    },
    [blocks]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onBlocksChange) return
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeId = String(active.id)
      const overId = String(over.id)

      const activeBlock = blocks.find((b) => b.id === activeId)
      const overBlock = blocks.find((b) => b.id === overId)
      if (!activeBlock || !overBlock) return
      if (activeBlock.type !== 'section' || overBlock.type !== 'section') return
      // Regra de negócio: só reordena entre irmãos do mesmo pai
      if (activeBlock.parentId !== overBlock.parentId) return

      const parentId = activeBlock.parentId
      const siblings = blocks
        .filter((b) => b.type === 'section' && b.parentId === parentId)
        .sort((a, b) => a.order - b.order)

      const oldIdx = siblings.findIndex((s) => s.id === activeId)
      const newIdx = siblings.findIndex((s) => s.id === overId)
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return

      const reorderedSiblings = arrayMove(siblings, oldIdx, newIdx)

      const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)
      const siblingIdSet = new Set(siblings.map((s) => s.id))
      const siblingDescendantIds = new Set<string>()
      siblings.forEach((s) => {
        getDescendantIds(blocks, s.id).forEach((id) => siblingDescendantIds.add(id))
      })

      // Cada irmão reordenado vira um grupo (irmão + descendentes na ordem original)
      const reorderedGroup = reorderedSiblings.flatMap((sibling) => {
        const descendants = sortedBlocks.filter((b) => isDescendantOf(blocks, b, sibling.id))
        return [sibling, ...descendants]
      })

      // Reconstrói: anda pela lista original, na primeira ocorrência de qualquer irmão/descendente,
      // insere o grupo reordenado inteiro; pula demais ocorrências
      let firstSiblingSeen = false
      const newBlocks: Block[] = []
      for (const b of sortedBlocks) {
        if (siblingIdSet.has(b.id) || siblingDescendantIds.has(b.id)) {
          if (!firstSiblingSeen) {
            firstSiblingSeen = true
            newBlocks.push(...reorderedGroup)
          }
          continue
        }
        newBlocks.push(b)
      }

      onBlocksChange(newBlocks.map((b, i) => ({ ...b, order: i })))
    },
    [blocks, onBlocksChange]
  )

  const isReorderable = !locked && !!onBlocksChange

  return (
    <aside className="w-72 lg:w-80 shrink-0 flex flex-col self-start sticky top-24 min-h-[600px] max-h-[calc(100vh-7rem)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Sumário
      </div>

      <nav className="flex-1 overflow-y-auto px-1 min-h-0">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-400 italic">Sem seções.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={handleDragEnd}>
            <SortableContext items={allSectionIds} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {items.map((item) => {
                  const isActive = item.block.id === activeItemId
                  const isTreeNode =
                    item.block.type === 'section' ||
                    (item.depth === 0 &&
                      (item.block.type === 'identification' || item.block.type === 'closing-page' || item.block.type === 'cover'))
                  const indentPx = 12 + item.depth * 16
                  const parentTrunkX = 12 + Math.max(0, item.depth - 1) * 16
                  const isCollapsed = collapsed.has(item.block.id)

                  const isDraggable = isReorderable && item.block.type === 'section'

                  if (isDraggable) {
                    return (
                      <SortableSection
                        key={item.block.id}
                        item={item}
                        isActive={isActive}
                        isTreeNode={isTreeNode}
                        isCollapsed={isCollapsed}
                        indentPx={indentPx}
                        parentTrunkX={parentTrunkX}
                        toggleCollapse={toggleCollapse}
                        onSelect={onSelect}
                      />
                    )
                  }

                  return (
                    <li key={item.block.id} className="relative">
                      <ItemContent
                        item={item}
                        isActive={isActive}
                        isTreeNode={isTreeNode}
                        isCollapsed={isCollapsed}
                        indentPx={indentPx}
                        parentTrunkX={parentTrunkX}
                        toggleCollapse={toggleCollapse}
                        onSelect={onSelect}
                      />
                    </li>
                  )
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </nav>

      {!locked && (
        <div className="px-2 py-3 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestAddSection}
            className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 hover:text-brand-700"
          >
            + Adicionar Seção
          </Button>
        </div>
      )}
    </aside>
  )
}

// Helper: verifica se `block` é descendente de `ancestorId` (qualquer nível)
function isDescendantOf(blocks: Block[], block: Block, ancestorId: string): boolean {
  let current = block
  while (current.parentId) {
    if (current.parentId === ancestorId) return true
    const parent = blocks.find((b) => b.id === current.parentId)
    if (!parent) return false
    current = parent
  }
  return false
}
