import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block, SectionData } from '@/types'
import { getDirectChildren, getDescendantIds } from '@/lib/utils'
import { getBlockTitle } from '@/lib/block-constants'
import {
  applyReorder,
  canDropAt,
  isReorderable,
  reorderSiblingByDelta,
  type ReorderTarget,
} from '@/lib/utils-reorder'
import Button from '@/components/ui/Button'

interface ReportSummaryProps {
  blocks: Block[]
  activeItemId: string | null
  onSelect: (itemId: string) => void
  onRequestAddSection: () => void
  onReorder?: (blocks: Block[]) => void
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

interface DropProjection extends ReorderTarget {
  valid: boolean
  overItemId: string | null
  side: 'before' | 'after' | 'into'
}

interface SummaryRowProps {
  item: SummaryItem
  isActive: boolean
  isCollapsed: boolean
  isDragOverlay?: boolean
  isReorderEnabled: boolean
  isDragging?: boolean
  descendantCount: number
  onSelect: (id: string) => void
  onToggleCollapse: (id: string) => void
  projection: DropProjection | null
  draggedId: string | null
}

function SummaryRow({
  item,
  isActive,
  isCollapsed,
  isDragOverlay = false,
  isReorderEnabled,
  isDragging,
  descendantCount,
  onSelect,
  onToggleCollapse,
  projection,
  draggedId,
}: SummaryRowProps) {
  const sortable = useSortable({
    id: item.block.id,
    disabled: !isReorderEnabled,
  })

  const indentPx = 12 + item.depth * 16
  const parentTrunkX = 12 + Math.max(0, item.depth - 1) * 16
  const isTreeNode =
    item.block.type === 'section' ||
    (item.depth === 0 &&
      (item.block.type === 'identification' || item.block.type === 'closing-page' || item.block.type === 'cover'))

  const showIndicatorBefore =
    !isDragOverlay &&
    projection !== null &&
    projection.overItemId === item.block.id &&
    projection.side === 'before' &&
    draggedId !== item.block.id
  const showIndicatorAfter =
    !isDragOverlay &&
    projection !== null &&
    projection.overItemId === item.block.id &&
    projection.side === 'after' &&
    draggedId !== item.block.id
  const showIndicatorInto =
    !isDragOverlay &&
    projection !== null &&
    projection.overItemId === item.block.id &&
    projection.side === 'into' &&
    draggedId !== item.block.id
  const indicatorClass = projection?.valid
    ? 'bg-brand-500'
    : 'bg-red-300'

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: isDragging ? 0.4 : 1,
      }

  const ref = isDragOverlay ? undefined : sortable.setNodeRef

  if (!isTreeNode) {
    return (
      <li ref={ref} style={style}>
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
      </li>
    )
  }

  const dragHandleProps = isReorderEnabled && !isDragOverlay
    ? { ...sortable.attributes, ...sortable.listeners }
    : {}

  return (
    <li ref={ref} style={style} className="relative">
      {showIndicatorBefore && (
        <span
          aria-hidden="true"
          className={`absolute left-2 right-2 -top-0.5 h-0.5 rounded-full ${indicatorClass} pointer-events-none z-20`}
        />
      )}
      {showIndicatorAfter && (
        <span
          aria-hidden="true"
          className={`absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full ${indicatorClass} pointer-events-none z-20`}
        />
      )}
      {showIndicatorInto && (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-1 right-1 rounded-md ring-2 ${
            projection?.valid ? 'ring-brand-400' : 'ring-red-300'
          } pointer-events-none z-20`}
        />
      )}

      {/* Ancestor trunks */}
      {!isDragOverlay &&
        Array.from({ length: item.depth }).map((_, i) => (
          <span
            key={`trunk-${i}`}
            aria-hidden="true"
            className="absolute border-l border-gray-200 pointer-events-none"
            style={{ left: `${12 + i * 16}px`, top: '-4px', bottom: '-4px' }}
          />
        ))}

      {!isDragOverlay && item.hasTreeSiblingAfter && (
        <span
          aria-hidden="true"
          className="absolute border-l border-gray-200 pointer-events-none"
          style={{ left: `${indentPx}px`, top: '12px', bottom: '-4px' }}
        />
      )}

      {!isDragOverlay && item.depth > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0 border-l border-b border-gray-200 rounded-bl-lg pointer-events-none"
          style={{ left: `${parentTrunkX}px`, width: '16px', height: '16px' }}
        />
      )}

      {item.hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(item.block.id)
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

      <button
        type="button"
        onClick={() => onSelect(item.block.id)}
        style={{ paddingLeft: `${indentPx + (item.hasChildren ? 14 : 10)}px` }}
        className={`relative w-full text-left pr-3 py-1.5 rounded-md text-sm leading-snug transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        } ${isReorderEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
        title={itemLabel(item.block)}
        {...dragHandleProps}
      >
        {itemLabel(item.block)}
        {isDragOverlay && descendantCount > 0 && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold">
            +{descendantCount}
          </span>
        )}
      </button>
    </li>
  )
}

export default function ReportSummary({
  blocks,
  activeItemId,
  onSelect,
  onRequestAddSection,
  onReorder,
  locked = false,
}: ReportSummaryProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [projection, setProjection] = useState<DropProjection | null>(null)
  const projectionRef = useRef<DropProjection | null>(null)
  const collapsedBeforeDragRef = useRef<Set<string> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const items = useMemo(() => buildSummaryItems(blocks, collapsed), [blocks, collapsed])
  const itemIds = useMemo(
    () => items.filter((i) => isReorderable(i.block)).map((i) => i.block.id),
    [items]
  )

  const draggedItem = useMemo(
    () => (draggedId ? items.find((i) => i.block.id === draggedId) ?? null : null),
    [draggedId, items]
  )

  const draggedDescendantCount = useMemo(() => {
    if (!draggedId) return 0
    return getDescendantIds(blocks, draggedId).filter((id) => {
      const b = blocks.find((bb) => bb.id === id)
      return b?.type === 'section'
    }).length
  }, [draggedId, blocks])

  const isReorderEnabled = !locked && !!onReorder

  const computeProjection = useCallback(
    (overId: string, overRect: DOMRect, pointerY: number): DropProjection | null => {
      if (!draggedId || draggedId === overId) return null
      const overItem = items.find((i) => i.block.id === overId)
      if (!overItem) return null
      if (!isReorderable(overItem.block)) {
        return null
      }

      const midY = overRect.top + overRect.height / 2
      const side: 'before' | 'after' = pointerY < midY ? 'before' : 'after'

      const draggedBlock = blocks.find((b) => b.id === draggedId)
      if (!draggedBlock || !isReorderable(draggedBlock)) return null

      const overBlock = overItem.block
      const overSiblings = getDirectChildren(blocks, overBlock.parentId).filter(isReorderable)
      const overIdxAmongSiblings = overSiblings.findIndex((s) => s.id === overBlock.id)
      const draggedIdxAmongOverSiblings = overSiblings.findIndex((s) => s.id === draggedId)

      let target: ReorderTarget = {
        parentId: overBlock.parentId,
        index: side === 'before' ? overIdxAmongSiblings : overIdxAmongSiblings + 1,
      }

      if (draggedIdxAmongOverSiblings !== -1 && draggedIdxAmongOverSiblings < overIdxAmongSiblings) {
        target = { ...target, index: target.index - 1 }
      }

      const valid = canDropAt(blocks, draggedId, target)
      return { ...target, valid, overItemId: overId, side }
    },
    [blocks, draggedId, items]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id)
      setDraggedId(id)
      collapsedBeforeDragRef.current = new Set(collapsed)
      const descendants = getDescendantIds(blocks, id)
      if (descendants.length > 0) {
        setCollapsed((prev) => {
          const next = new Set(prev)
          next.add(id)
          return next
        })
      }
    },
    [blocks, collapsed]
  )

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const overId = event.over?.id
      if (!overId) {
        projectionRef.current = null
        setProjection(null)
        return
      }
      const overRect = event.over?.rect
      if (!overRect) {
        projectionRef.current = null
        setProjection(null)
        return
      }
      const activeRect = event.active.rect.current.translated
      if (!activeRect) {
        projectionRef.current = null
        setProjection(null)
        return
      }
      const pointerY = activeRect.top + activeRect.height / 2
      const next = computeProjection(String(overId), overRect as DOMRect, pointerY)
      projectionRef.current = next
      setProjection(next)
    },
    [computeProjection]
  )

  const restoreCollapse = useCallback(() => {
    if (collapsedBeforeDragRef.current) {
      setCollapsed(collapsedBeforeDragRef.current)
      collapsedBeforeDragRef.current = null
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id)
      const proj = projectionRef.current
      projectionRef.current = null
      setDraggedId(null)
      setProjection(null)
      restoreCollapse()
      if (!onReorder || !proj || !proj.valid) return
      const next = applyReorder(blocks, id, { parentId: proj.parentId, index: proj.index })
      if (next === blocks) return
      onReorder(next)
    },
    [blocks, onReorder, restoreCollapse]
  )

  const handleDragCancel = useCallback(() => {
    projectionRef.current = null
    setDraggedId(null)
    setProjection(null)
    restoreCollapse()
  }, [restoreCollapse])

  useEffect(() => {
    if (!isReorderEnabled) return
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey || !event.shiftKey) return
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      if (!activeItemId) return
      const block = blocks.find((b) => b.id === activeItemId)
      if (!block || !isReorderable(block)) return
      event.preventDefault()
      const delta = event.key === 'ArrowUp' ? -1 : 1
      const next = reorderSiblingByDelta(blocks, activeItemId, delta)
      if (next !== blocks && onReorder) onReorder(next)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeItemId, blocks, isReorderEnabled, onReorder])

  const navContent = items.length === 0 ? (
    <p className="px-3 py-4 text-sm text-gray-400 italic">Sem seções.</p>
  ) : (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = item.block.id === activeItemId
        const isCollapsed = collapsed.has(item.block.id)
        return (
          <SummaryRow
            key={item.block.id}
            item={item}
            isActive={isActive}
            isCollapsed={isCollapsed}
            isReorderEnabled={isReorderEnabled && isReorderable(item.block)}
            isDragging={draggedId === item.block.id}
            descendantCount={0}
            onSelect={onSelect}
            onToggleCollapse={toggleCollapse}
            projection={projection}
            draggedId={draggedId}
          />
        )
      })}
    </ul>
  )

  return (
    <aside className="w-72 lg:w-80 shrink-0 flex flex-col self-start sticky top-[160px] min-h-[400px] max-h-[calc(100vh-176px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Sumário
      </div>

      <nav className="flex-1 overflow-y-auto px-1 pb-3 min-h-0">
        {isReorderEnabled ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {navContent}
            </SortableContext>
            <DragOverlay>
              {draggedItem ? (
                <SummaryRow
                  item={draggedItem}
                  isActive={false}
                  isCollapsed={false}
                  isDragOverlay
                  isReorderEnabled={false}
                  descendantCount={draggedDescendantCount}
                  onSelect={() => {}}
                  onToggleCollapse={() => {}}
                  projection={null}
                  draggedId={null}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          navContent
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
