import { useMemo, useState, useCallback } from 'react'
import type { Block, SectionData } from '@/types'
import { getDirectChildren } from '@/lib/utils'
import { getBlockTitle } from '@/lib/block-constants'
import Button from '@/components/ui/Button'

interface ReportSummaryProps {
  blocks: Block[]
  activeItemId: string | null
  onSelect: (itemId: string) => void
  onRequestAddSection: () => void
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
      (parentId === null && (b.type === 'identification' || b.type === 'closing-page'))
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

export default function ReportSummary({
  blocks,
  activeItemId,
  onSelect,
  onRequestAddSection,
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

  return (
    <aside className="w-72 lg:w-80 shrink-0 flex flex-col self-start sticky top-24 min-h-[600px] max-h-[calc(100vh-7rem)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Sumário
      </div>

      <nav className="flex-1 overflow-y-auto px-1 min-h-0">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-400 italic">Sem seções.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = item.block.id === activeItemId
              const isTreeNode =
                item.block.type === 'section' ||
                (item.depth === 0 &&
                  (item.block.type === 'identification' || item.block.type === 'closing-page'))
              const indentPx = 12 + item.depth * 16
              const parentTrunkX = 12 + Math.max(0, item.depth - 1) * 16

              if (!isTreeNode) {
                return (
                  <li key={item.block.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.block.id)}
                      style={{ paddingLeft: `${indentPx}px` }}
                      className={`w-full text-left pr-3 py-1.5 rounded-md text-sm leading-snug transition-colors ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={itemLabel(item.block)}
                    >
                      {itemLabel(item.block)}
                    </button>
                  </li>
                )
              }

              const isCollapsed = collapsed.has(item.block.id)
              return (
                <li key={item.block.id} className="relative">
                  {/* Ancestor trunks (linhas verticais contínuas para cada nível acima) — estende -4px top/bottom pra cobrir o gap do space-y-1 */}
                  {Array.from({ length: item.depth }).map((_, i) => (
                    <span
                      key={`trunk-${i}`}
                      aria-hidden="true"
                      className="absolute border-l border-gray-200 pointer-events-none"
                      style={{ left: `${12 + i * 16}px`, top: '-4px', bottom: '-4px' }}
                    />
                  ))}

                  {/* Trunk do próprio nível (conecta este nó ao próximo irmão que participa da árvore) */}
                  {item.hasTreeSiblingAfter && (
                    <span
                      aria-hidden="true"
                      className="absolute border-l border-gray-200 pointer-events-none"
                      style={{ left: `${indentPx}px`, top: '12px', bottom: '-4px' }}
                    />
                  )}

                  {/* L-curve conectando trunk do pai até a bolinha (alinhada à primeira linha) */}
                  {item.depth > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 border-l border-b border-gray-200 rounded-bl-lg pointer-events-none"
                      style={{
                        left: `${parentTrunkX}px`,
                        width: '16px',
                        height: '16px',
                      }}
                    />
                  )}

                  {/* Bolinha / Chevron do nó — alinhado à primeira linha de texto */}
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

                  <button
                    type="button"
                    onClick={() => onSelect(item.block.id)}
                    style={{ paddingLeft: `${indentPx + (item.hasChildren ? 14 : 10)}px` }}
                    className={`relative w-full text-left pr-3 py-1.5 rounded-md text-sm leading-snug transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={itemLabel(item.block)}
                  >
                    {itemLabel(item.block)}
                  </button>
                </li>
              )
            })}
          </ul>
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
