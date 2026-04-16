import { useMemo } from 'react'
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
}

function buildSummaryItems(blocks: Block[]): SummaryItem[] {
  const items: SummaryItem[] = []

  function walk(parentId: string | null, depth: number) {
    const children = getDirectChildren(blocks, parentId)
    for (const block of children) {
      const include =
        block.type === 'section' ||
        (parentId === null && (block.type === 'identification' || block.type === 'closing-page'))
      if (!include) continue
      items.push({ block, depth })
      if (block.type === 'section') {
        walk(block.id, depth + 1)
      }
    }
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
  const items = useMemo(() => buildSummaryItems(blocks), [blocks])

  return (
    <aside className="w-64 shrink-0 flex flex-col">
      <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Sumário
      </div>

      <nav className="flex-1 overflow-y-auto px-1">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-400 italic">Sem seções.</p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => {
              const isActive = item.block.id === activeItemId
              return (
                <li key={item.block.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.block.id)}
                    style={{ paddingLeft: `${12 + item.depth * 16}px` }}
                    className={`w-full text-left pr-3 py-1.5 rounded-md text-sm transition-colors truncate ${
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
