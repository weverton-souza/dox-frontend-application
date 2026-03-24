import { useState, useCallback, useMemo, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import type { Block, BlockData, SectionData } from '@/types'
import { isContainerBlock, isLockedBlock } from '@/types'
import { buildBlockTree, getDescendantIds, computeBlockMetas } from '@/lib/utils'
import type { TreeNode } from '@/lib/utils'
import { PlusIcon } from '@/components/icons'
import { getBlockTitle } from '@/lib/block-constants'
import OutlineRow from '@/components/editor/OutlineRow'
import SectionDeleteModal from '@/components/ui/SectionDeleteModal'

interface OutlineTreeProps {
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
  collapsedSections: Set<string>
  onToggleSectionCollapse: (sectionBlockId: string, childContainerIds?: string[]) => void
  onRequestAddBlock: (afterBlockId: string, parentId?: string | null) => void
  onEditBlock: (blockId: string) => void
  onReviewBlock?: (blockId: string) => void
  insertAfterBlockId?: string | null
}

// Insertion point between blocks (hover to reveal)
function InsertionPoint({ afterBlockId, parentId, onRequestAdd }: {
  afterBlockId: string
  parentId?: string | null
  onRequestAdd: (id: string, parentId?: string | null) => void
}) {
  return (
    <div className="group/insert relative h-1 -my-0.5 flex items-center justify-center">
      <button
        type="button"
        onClick={() => onRequestAdd(afterBlockId, parentId)}
        className="absolute z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                   text-brand-500 bg-brand-50 border border-brand-200
                   opacity-0 group-hover/insert:opacity-100 transition-opacity hover:bg-brand-100"
      >
        <PlusIcon size={10} /> Inserir
      </button>
      <div className="w-full border-t border-dashed border-transparent
                      group-hover/insert:border-brand-300 transition-colors" />
    </div>
  )
}

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function OutlineTree({
  blocks,
  onBlocksChange,
  collapsedSections,
  onToggleSectionCollapse,
  onRequestAddBlock,
  onEditBlock,
  onReviewBlock,
  insertAfterBlockId,
}: OutlineTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Build tree from flat blocks
  const tree = useMemo(() => buildBlockTree(blocks), [blocks])
  const blockMetas = useMemo(() => computeBlockMetas(blocks), [blocks])

  // Drag groups: container blocks drag all descendants
  const dragGroups = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const block of blocks) {
      if (isContainerBlock(block.type)) {
        const descendants = getDescendantIds(blocks, block.id)
        map[block.id] = [block.id, ...descendants]
      } else {
        map[block.id] = [block.id]
      }
    }
    return map
  }, [blocks])

  // Visible block IDs (exclude children of collapsed containers)
  const visibleBlockIds = useMemo(() => {
    const ids: string[] = []
    function walk(nodes: TreeNode[]) {
      for (const node of nodes) {
        ids.push(node.block.id)
        const isContainer = isContainerBlock(node.block.type)
        const isCollapsed = collapsedSections.has(node.block.id)
        if (isContainer && !isCollapsed && node.children.length > 0) {
          walk(node.children)
        }
      }
    }
    walk(tree)
    return ids
  }, [tree, collapsedSections])

  // ========== DnD with depth projection (Notion-style) ==========

  const INDENT_WIDTH = 40 // pixels per indent level

  // Flatten tree to ordered list with depth info
  const flatItems = useMemo(() => {
    const items: { id: string; depth: number; parentId: string | null; canHaveChildren: boolean }[] = []
    function walk(nodes: TreeNode[]) {
      for (const node of nodes) {
        items.push({
          id: node.block.id,
          depth: node.depth,
          parentId: node.block.parentId,
          canHaveChildren: isContainerBlock(node.block.type),
        })
        if (!collapsedSections.has(node.block.id)) {
          walk(node.children)
        }
      }
    }
    walk(tree)
    return items
  }, [tree, collapsedSections])

  const [activeId, setActiveId] = useState<string | null>(null)
  const offsetXRef = useRef(0)
  const [projectedDepth, setProjectedDepth] = useState<number | null>(null)

  // Project where the block would land based on vertical position + horizontal offset
  function getProjection(
    items: typeof flatItems,
    activeId: string,
    overId: string,
    offsetX: number
  ): { depth: number; parentId: string | null } | null {
    const activeIndex = items.findIndex(i => i.id === activeId)
    const overIndex = items.findIndex(i => i.id === overId)
    if (activeIndex === -1 || overIndex === -1) return null

    const activeItem = items[activeIndex]

    // Simulate the move
    const reordered = arrayMove(items, activeIndex, overIndex)
    const newIndex = reordered.findIndex(i => i.id === activeId)

    // Calculate projected depth from horizontal offset
    const dragDepth = Math.round(offsetX / INDENT_WIDTH)
    let depth = Math.max(0, activeItem.depth + dragDepth)

    // Constrain depth based on previous neighbor
    const prev = reordered[newIndex - 1]

    // Max depth: previous item's depth + 1 (if it can have children), or same depth
    const maxDepth = prev
      ? prev.canHaveChildren ? prev.depth + 1 : prev.depth
      : 0
    // Non-container blocks cannot be placed at root (depth 0)
    const minDepth = activeItem.canHaveChildren ? 0 : 1

    depth = Math.min(depth, maxDepth)
    depth = Math.max(depth, minDepth)

    // Determine parentId by looking at previous items
    let parentId: string | null = null
    if (depth > 0 && prev) {
      if (depth > prev.depth) {
        // Going deeper → parent is the previous item
        parentId = prev.id
      } else if (depth === prev.depth) {
        // Same level → same parent
        parentId = prev.parentId
      } else {
        // Going shallower → find ancestor at the right depth
        for (let i = newIndex - 1; i >= 0; i--) {
          if (reordered[i].depth === depth - 1 && reordered[i].canHaveChildren) {
            parentId = reordered[i].id
            break
          }
          if (reordered[i].depth < depth - 1) {
            parentId = reordered[i].depth === depth ? reordered[i].parentId : null
            break
          }
        }
      }
    }

    return { depth, parentId }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    offsetXRef.current = 0
  }, [])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    offsetXRef.current = event.delta.x
    const ovId = event.over?.id as string | undefined

    if (activeId && ovId) {
      const proj = getProjection(flatItems, activeId, ovId, event.delta.x)
      setProjectedDepth(proj?.depth ?? null)
    }
  }, [activeId, flatItems])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      setProjectedDepth(null)

      const activeStr = active.id as string
      const activeBlock = blocks.find(b => b.id === activeStr)
      if (!activeBlock || isLockedBlock(activeBlock.type)) return

      // Fallback when no valid over target (over is null or self)
      const finalOffsetX = event.delta?.x ?? offsetXRef.current
      if (!over || active.id === over.id) {
        const sorted = [...blocks].sort((a, b) => a.order - b.order)
        const activeIndex = sorted.findIndex(b => b.id === activeStr)
        if (activeIndex === -1) return

        // Dragged LEFT → escape current container (move after parent)
        // Non-container blocks cannot escape to root
        if (activeBlock.parentId && finalOffsetX < -20) {
          const parentBlock = blocks.find(b => b.id === activeBlock.parentId)
          if (parentBlock) {
            const newParentId = parentBlock.parentId
            // Block non-section blocks from going to root
            if (newParentId === null && !isContainerBlock(activeBlock.type)) return
            const groupIds = dragGroups[activeStr] || [activeStr]

            if (groupIds.length === 1) {
              const [moved] = sorted.splice(activeIndex, 1)
              moved.parentId = newParentId
              const parentIdx = sorted.findIndex(b => b.id === parentBlock.id)
              let insertAt = parentIdx + 1
              while (insertAt < sorted.length && sorted[insertAt].parentId === parentBlock.id) {
                insertAt++
              }
              sorted.splice(insertAt, 0, moved)
            } else {
              const groupSet = new Set(groupIds)
              const groupBlocks = sorted.filter(b => groupSet.has(b.id))
              const remaining = sorted.filter(b => !groupSet.has(b.id))
              groupBlocks[0].parentId = newParentId
              const parentIdx = remaining.findIndex(b => b.id === parentBlock.id)
              let insertAt = parentIdx + 1
              while (insertAt < remaining.length && remaining[insertAt].parentId === parentBlock.id) {
                insertAt++
              }
              remaining.splice(insertAt, 0, ...groupBlocks)
              sorted.length = 0
              sorted.push(...remaining)
            }

            onBlocksChange(sorted.map((b, i) => ({ ...b, order: i })))
          }
          return
        }

        // Dragged RIGHT → enter the nearest container above as last child
        if (finalOffsetX > 20) {
          // Find nearest container block above the active block (at same or higher level)
          for (let i = activeIndex - 1; i >= 0; i--) {
            const candidate = sorted[i]
            if (isContainerBlock(candidate.type) && candidate.parentId === activeBlock.parentId) {
              const groupIds = dragGroups[activeStr] || [activeStr]

              if (groupIds.length === 1) {
                const [moved] = sorted.splice(activeIndex, 1)
                moved.parentId = candidate.id
                // Insert as last child of the container
                const containerIdx = sorted.findIndex(b => b.id === candidate.id)
                let insertAt = containerIdx + 1
                while (insertAt < sorted.length && sorted[insertAt].parentId === candidate.id) {
                  insertAt++
                }
                sorted.splice(insertAt, 0, moved)
              } else {
                const groupSet = new Set(groupIds)
                const groupBlocks = sorted.filter(b => groupSet.has(b.id))
                const remaining = sorted.filter(b => !groupSet.has(b.id))
                groupBlocks[0].parentId = candidate.id
                const containerIdx = remaining.findIndex(b => b.id === candidate.id)
                let insertAt = containerIdx + 1
                while (insertAt < remaining.length && remaining[insertAt].parentId === candidate.id) {
                  insertAt++
                }
                remaining.splice(insertAt, 0, ...groupBlocks)
                sorted.length = 0
                sorted.push(...remaining)
              }

              onBlocksChange(sorted.map((b, i) => ({ ...b, order: i })))
              break
            }
          }
          return
        }

        return
      }

      const overStr = over.id as string

      // Ignore if dropping on own descendant
      const activeDescendants = new Set(dragGroups[activeStr] || [])
      if (activeDescendants.has(overStr)) return

      // Get projected parentId from horizontal offset
      const projection = getProjection(flatItems, activeStr, overStr, finalOffsetX)
      if (!projection) return

      const { parentId: newParentId } = projection
      const groupIds = dragGroups[activeStr] || [activeStr]
      const sorted = [...blocks].sort((a, b) => a.order - b.order)

      if (groupIds.length === 1) {
        const oldIndex = sorted.findIndex(b => b.id === activeStr)
        const newIndex = sorted.findIndex(b => b.id === overStr)
        if (oldIndex === -1 || newIndex === -1) return
        const [moved] = sorted.splice(oldIndex, 1)
        moved.parentId = newParentId
        sorted.splice(newIndex, 0, moved)
      } else {
        const groupSet = new Set(groupIds)
        const groupBlocks = sorted.filter(b => groupSet.has(b.id))
        const remaining = sorted.filter(b => !groupSet.has(b.id))
        const overIndex = remaining.findIndex(b => b.id === overStr)
        if (overIndex === -1) return
        groupBlocks[0].parentId = newParentId
        remaining.splice(overIndex, 0, ...groupBlocks)
        sorted.length = 0
        sorted.push(...remaining)
      }

      const reordered = sorted.map((b, i) => ({ ...b, order: i }))
      onBlocksChange(reordered)
    },
    [blocks, onBlocksChange, dragGroups, flatItems]
  )

  // Block operations
  const updateBlockData = useCallback(
    (blockId: string, newData: BlockData) => {
      const updated = blocks.map(b => b.id === blockId ? { ...b, data: newData } : b)
      onBlocksChange(updated)
    },
    [blocks, onBlocksChange]
  )

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const block = blocks.find(b => b.id === blockId)
      if (!block) return
      const sorted = [...blocks].sort((a, b) => a.order - b.order)
      const blockIndex = sorted.findIndex(b => b.id === blockId)
      const newBlock: Block = {
        ...block,
        id: crypto.randomUUID(),
        data: JSON.parse(JSON.stringify(block.data)),
        collapsed: false,
      }
      sorted.splice(blockIndex + 1, 0, newBlock)
      onBlocksChange(sorted.map((b, i) => ({ ...b, order: i })))
    },
    [blocks, onBlocksChange]
  )

  const removeBlock = useCallback(
    (blockId: string) => {
      const filtered = blocks.filter(b => b.id !== blockId)
      onBlocksChange(filtered.map((b, i) => ({ ...b, order: i })))
    },
    [blocks, onBlocksChange]
  )

  // Section cascading delete
  const [sectionDeleteTarget, setSectionDeleteTarget] = useState<{
    sectionBlockId: string
    sectionTitle: string
    childBlockIds: string[]
  } | null>(null)

  const handleRemoveRequest = useCallback(
    (blockId: string) => {
      const block = blocks.find(b => b.id === blockId)
      if (!block) return

      if (isContainerBlock(block.type)) {
        const childIds = getDescendantIds(blocks, blockId)
        if (childIds.length > 0) {
          const title = block.type === 'section'
            ? (block.data as SectionData).title || 'Seção'
            : getBlockTitle(block)
          setSectionDeleteTarget({
            sectionBlockId: blockId,
            sectionTitle: title,
            childBlockIds: childIds,
          })
          return
        }
      }
      removeBlock(blockId)
    },
    [blocks, removeBlock]
  )

  const handleDeleteAll = useCallback(() => {
    if (!sectionDeleteTarget) return
    const idsToRemove = new Set([sectionDeleteTarget.sectionBlockId, ...sectionDeleteTarget.childBlockIds])
    const filtered = blocks.filter(b => !idsToRemove.has(b.id))
    onBlocksChange(filtered.map((b, i) => ({ ...b, order: i })))
    setSectionDeleteTarget(null)
  }, [blocks, onBlocksChange, sectionDeleteTarget])

  const handleMoveAndDelete = useCallback(
    (targetSectionId: string) => {
      if (!sectionDeleteTarget) return
      const childBlockIds = new Set(sectionDeleteTarget.childBlockIds)
      const childBlocks = blocks.filter(b => childBlockIds.has(b.id))
        .map(b => ({ ...b, parentId: targetSectionId }))
      const remaining = blocks.filter(
        b => b.id !== sectionDeleteTarget.sectionBlockId && !childBlockIds.has(b.id)
      )
      const result = [...remaining, ...childBlocks]
      onBlocksChange(result.map((b, i) => ({ ...b, order: i })))
      setSectionDeleteTarget(null)
    },
    [blocks, onBlocksChange, sectionDeleteTarget]
  )

  // Target sections for "move children" modal
  const deleteTargetSections = useMemo(() => {
    if (!sectionDeleteTarget) return []
    return blocks
      .filter(b => b.type === 'section' && b.id !== sectionDeleteTarget.sectionBlockId)
      .map(b => ({ value: b.id, label: (b.data as SectionData).title || 'Seção' }))
  }, [blocks, sectionDeleteTarget])

  // Helper: collect child container IDs for cascade collapse
  function getChildContainerIds(node: TreeNode): string[] {
    const ids: string[] = []
    for (const child of node.children) {
      if (isContainerBlock(child.block.type)) {
        ids.push(child.block.id)
        ids.push(...getChildContainerIds(child))
      }
    }
    return ids
  }

  // ========== Recursive node renderer ==========
  function renderNode(node: TreeNode, siblingIndex: number, _siblingCount: number) {
    const { block, children, depth } = node
    const isContainer = isContainerBlock(block.type)
    const isLocked = isLockedBlock(block.type)
    const isCollapsed = collapsedSections.has(block.id)
    const hasChildren = children.length > 0
    const meta = blockMetas[block.id]

    return (
      <div key={block.id}>
        {/* Node header row */}
        <div className="flex items-center group/section">
          {/* Collapse chevron or spacer — fixed width for alignment */}
          <div className="w-6 shrink-0 flex items-center justify-center relative">
            {isContainer && hasChildren ? (
              <button
                type="button"
                onClick={() => {
                  const childContainerIds = getChildContainerIds(node)
                  onToggleSectionCollapse(block.id, childContainerIds)
                }}
                className="p-1 rounded hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Chevron collapsed={isCollapsed} />
              </button>
            ) : isContainer && !isLocked ? (
              <button
                type="button"
                onClick={() => {
                  // Find the last child of this section to insert after it
                  const sectionChildren = blocks
                    .filter(b => b.parentId === block.id)
                    .sort((a, b) => a.order - b.order)
                  const lastChild = sectionChildren[sectionChildren.length - 1]
                  onRequestAddBlock(lastChild?.id ?? block.id, block.id)
                }}
                className="p-1 rounded-md text-gray-300 hover:text-brand-600 hover:bg-white/60 transition-all opacity-0 group-hover/section:opacity-100"
                title="Adicionar bloco na seção"
              >
                <PlusIcon size={14} />
              </button>
            ) : null}
          </div>

          {/* Block row */}
          <div className="flex-1 min-w-0">
            <OutlineRow
              block={block}
              meta={meta}
              depth={depth}
              siblingIndex={siblingIndex}
              onEdit={onEditBlock}
              onRequestAdd={isContainer && !isLocked ? onRequestAddBlock : undefined}
              onReviewBlock={onReviewBlock}
              childCount={children.length}
              onDuplicate={duplicateBlock}
              onRemove={handleRemoveRequest}
              onChange={updateBlockData}
              dragDisabled={isLocked}
            />
          </div>

        </div>

        {/* Children with animated collapse */}
        {isContainer && hasChildren && (
          <div className={`collapse-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="collapse-content">
              <div className="tree-children">
                {children.map((child, idx) => (
                  <div key={child.block.id} className="tree-node">
                    {renderNode(child, idx, children.length)}

                    {/* Insertion point between siblings */}
                    {idx < children.length - 1 && (
                      <InsertionPoint
                        afterBlockId={child.block.id}
                        parentId={block.id}
                        onRequestAdd={onRequestAddBlock}
                      />
                    )}

                    {/* Active insertion indicator */}
                    {child.block.id === insertAfterBlockId && (
                      <div className="h-0.5 bg-brand-400 rounded-full mx-4 my-1 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insertion point for empty containers */}
        {isContainer && !hasChildren && !isLocked && (
          <InsertionPoint
            afterBlockId={block.id}
            parentId={block.id}
            onRequestAdd={onRequestAddBlock}
          />
        )}
      </div>
    )
  }

  // ========== Empty state ==========
  if (blocks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg
          className="mx-auto mb-4 text-gray-300"
          width="48" height="48" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <p className="text-sm">Nenhum bloco adicionado.</p>
        <p className="text-xs mt-1">Clique em "Adicionar Seção" para começar.</p>
      </div>
    )
  }

  // ========== Main render ==========
  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleBlockIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tree.map((node, idx) => (
            <div key={node.block.id}>
              {renderNode(node, idx, tree.length)}
            </div>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId ? (() => {
          const dragBlock = blocks.find(b => b.id === activeId)
          if (!dragBlock) return null
          const groupIds = dragGroups[activeId] || [activeId]
          const title = getBlockTitle(dragBlock)
          const depthLabel = projectedDepth !== null
            ? projectedDepth === 0 ? 'raiz' : `nível ${projectedDepth}`
            : null

          return (
            <div style={{ marginLeft: projectedDepth !== null ? projectedDepth * INDENT_WIDTH : 0 }}>
              <div className="bg-white shadow-md rounded-lg px-3 py-2 border border-brand-200 opacity-90 flex items-center gap-2 max-w-xs">
                <span className="text-sm font-medium text-gray-800 truncate">{title}</span>
                {groupIds.length > 1 && (
                  <span className="text-xs text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full shrink-0">
                    {groupIds.length} blocos
                  </span>
                )}
                {depthLabel && (
                  <span className="text-xs text-gray-400 shrink-0">
                    → {depthLabel}
                  </span>
                )}
              </div>
            </div>
          )
        })() : null}
      </DragOverlay>
    </DndContext>

    <SectionDeleteModal
      isOpen={!!sectionDeleteTarget}
      onClose={() => setSectionDeleteTarget(null)}
      sectionTitle={sectionDeleteTarget?.sectionTitle ?? ''}
      childCount={sectionDeleteTarget?.childBlockIds.length ?? 0}
      targetSections={deleteTargetSections}
      onDeleteAll={handleDeleteAll}
      onMoveAndDelete={handleMoveAndDelete}
    />
    </>
  )
}
