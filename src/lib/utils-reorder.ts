import type { Block } from '@/types'
import { getDescendantIds, getDirectChildren } from '@/lib/utils'

const FIXED_ROOT_TYPES = new Set(['identification', 'closing-page', 'cover'])

export function isFixedBlock(block: Block): boolean {
  return FIXED_ROOT_TYPES.has(block.type)
}

export function isReorderable(block: Block): boolean {
  return block.type === 'section'
}

export interface ReorderTarget {
  parentId: string | null
  index: number
}

export function canDropAt(
  blocks: Block[],
  draggedId: string,
  target: ReorderTarget
): boolean {
  const dragged = blocks.find((b) => b.id === draggedId)
  if (!dragged) return false
  if (!isReorderable(dragged)) return false

  if (dragged.parentId === null && target.parentId !== null) return false

  if (target.parentId !== null) {
    const targetParent = blocks.find((b) => b.id === target.parentId)
    if (!targetParent || targetParent.type !== 'section') return false

    if (target.parentId === draggedId) return false
    const descendants = getDescendantIds(blocks, draggedId)
    if (descendants.includes(target.parentId)) return false
  }

  return true
}

function getReorderableSiblings(blocks: Block[], parentId: string | null): Block[] {
  return getDirectChildren(blocks, parentId).filter(isReorderable)
}

export function applyReorder(
  blocks: Block[],
  draggedId: string,
  target: ReorderTarget
): Block[] {
  if (!canDropAt(blocks, draggedId, target)) return blocks

  const dragged = blocks.find((b) => b.id === draggedId)
  if (!dragged) return blocks

  const subtreeIds = new Set<string>([draggedId, ...getDescendantIds(blocks, draggedId)])
  const sortedAll = [...blocks].sort((a, b) => a.order - b.order)
  const subtreeBlocks = sortedAll.filter((b) => subtreeIds.has(b.id))
  const remaining = sortedAll.filter((b) => !subtreeIds.has(b.id))

  const updatedDragged: Block = { ...dragged, parentId: target.parentId }
  const subtreeFinal = subtreeBlocks.map((b) => (b.id === draggedId ? updatedDragged : b))

  const destSiblings = getReorderableSiblings(remaining, target.parentId)
  const clampedIndex = Math.max(0, Math.min(target.index, destSiblings.length))

  let insertAt: number
  if (destSiblings.length === 0) {
    if (target.parentId === null) {
      insertAt = remaining.length
    } else {
      const parentIdx = remaining.findIndex((b) => b.id === target.parentId)
      insertAt = parentIdx === -1 ? remaining.length : parentIdx + 1
    }
  } else if (clampedIndex === 0) {
    const firstSibling = destSiblings[0]
    insertAt = remaining.findIndex((b) => b.id === firstSibling.id)
    if (insertAt === -1) insertAt = remaining.length
  } else {
    const refSibling = destSiblings[clampedIndex - 1]
    const refSubtree = new Set<string>([refSibling.id, ...getDescendantIds(remaining, refSibling.id)])
    let lastIdx = -1
    remaining.forEach((b, i) => {
      if (refSubtree.has(b.id)) lastIdx = i
    })
    insertAt = lastIdx === -1 ? remaining.length : lastIdx + 1
  }

  const result = [
    ...remaining.slice(0, insertAt),
    ...subtreeFinal,
    ...remaining.slice(insertAt),
  ]

  return result.map((b, i) => ({ ...b, order: i }))
}

export function findSiblingIndex(
  blocks: Block[],
  blockId: string
): { parentId: string | null; index: number; total: number } | null {
  const block = blocks.find((b) => b.id === blockId)
  if (!block) return null
  const siblings = getReorderableSiblings(blocks, block.parentId)
  const index = siblings.findIndex((s) => s.id === blockId)
  if (index === -1) return null
  return { parentId: block.parentId, index, total: siblings.length }
}

export function reorderSiblingByDelta(
  blocks: Block[],
  blockId: string,
  delta: -1 | 1
): Block[] {
  const info = findSiblingIndex(blocks, blockId)
  if (!info) return blocks
  const newIndex = info.index + delta
  if (newIndex < 0 || newIndex >= info.total) return blocks

  return applyReorder(blocks, blockId, { parentId: info.parentId, index: newIndex })
}
