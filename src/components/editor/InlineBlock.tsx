import type { Block, BlockData, TextBlockData, InfoBoxData } from '@/types'
import { BLOCK_TYPE_LABELS } from '@/types'
import { BLOCK_TYPE_COLORS, getBlockTypeIcon } from '@/lib/block-constants'
import type { BlockMeta } from '@/lib/utils'
import TextBlock from '@/components/blocks/TextBlock'
import InfoBoxBlock from '@/components/blocks/InfoBoxBlock'
import OutlineRow from '@/components/editor/OutlineRow'

interface InlineBlockProps {
  block: Block
  meta: BlockMeta
  onEdit: (id: string) => void
  onDuplicate?: (id: string) => void
  onRemove?: (id: string) => void
  onChange: (id: string, data: BlockData) => void
  onReviewBlock?: (id: string) => void
}

const INLINE_TYPES = new Set(['text', 'info-box'])

export default function InlineBlock({
  block,
  meta,
  onEdit,
  onDuplicate,
  onRemove,
  onChange,
  onReviewBlock,
}: InlineBlockProps) {
  if (!INLINE_TYPES.has(block.type)) {
    return (
      <OutlineRow
        block={block}
        meta={meta}
        depth={0}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onChange={onChange}
        onReviewBlock={onReviewBlock}
        dragDisabled
      />
    )
  }

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Toolbar header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${BLOCK_TYPE_COLORS[block.type]}`}>
            {getBlockTypeIcon(block.type, 12)}
          </div>
          <span className="text-xs font-medium text-gray-500">
            {BLOCK_TYPE_LABELS[block.type]}
          </span>
          {block.generatedByAi && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-medium rounded"
              title="Gerado pelo Assistente"
            >
              ✦
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {block.type === 'text' && onReviewBlock && (
            <button
              type="button"
              onClick={() => onReviewBlock(block.id)}
              className="p-1.5 rounded-md hover:bg-brand-50 text-brand-600 transition-colors"
              title="Revisar com Assistente"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(block.id)}
            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
            title="Expandir em modal"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(block.id)}
              className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
              title="Duplicar"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(block.id)}
              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Remover"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {block.type === 'text' ? (
          <TextBlock data={block.data as TextBlockData} onChange={(data) => onChange(block.id, data)} />
        ) : (
          <InfoBoxBlock data={block.data as InfoBoxData} onChange={(data) => onChange(block.id, data)} />
        )}
      </div>
    </div>
  )
}
