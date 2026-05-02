import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type {
  Block,
  BlockData,
  TextBlockData,
  SectionData,
  ScoreTableData,
  ChartData,
  InfoBoxData,
  ReferencesData,
  ClosingPageData,
} from '@/types'
import {
  BLOCK_TYPE_LABELS,
  isSlateContent,
  slateContentToPlainText,
  isContainerBlock,
} from '@/types'
import { BLOCK_TYPE_BORDER_COLORS, BLOCK_TYPE_COLORS, getSectionBorderColor, getBlockTypeIcon, getBlockTitle } from '@/lib/block-constants'
import type { BlockMeta } from '@/lib/utils'

interface OutlineRowProps {
  block: Block
  meta: BlockMeta
  depth: number
  siblingIndex?: number
  onEdit: (blockId: string) => void
  onDuplicate?: (blockId: string) => void
  onRemove?: (blockId: string) => void
  onChange: (blockId: string, data: BlockData) => void
  onRequestAdd?: (afterBlockId: string, parentId?: string | null) => void
  onReviewBlock?: (blockId: string) => void
  childCount?: number
  dragDisabled?: boolean
}

function getBlockBorderColor(block: Block, depth: number): string {
  if (block.skippedByAi) return 'border-l-amber-400'
  if (block.type === 'section') return getSectionBorderColor(depth)
  return BLOCK_TYPE_BORDER_COLORS[block.type]
}

function getBlockSummary(block: Block): string {
  switch (block.type) {
    case 'score-table': {
      const d = block.data as ScoreTableData
      const rows = d.rows.length
      const cols = d.columns.length
      return `${rows} ${rows === 1 ? 'linha' : 'linhas'}, ${cols} ${cols === 1 ? 'coluna' : 'colunas'}`
    }
    case 'chart': {
      const d = block.data as ChartData
      const typeLabel = d.chartType === 'bar' ? 'Barras' : 'Linha'
      return `${typeLabel}, ${d.categories.length} categorias`
    }
    case 'info-box': {
      const d = block.data as InfoBoxData
      const infoText = isSlateContent(d.content) ? slateContentToPlainText(d.content) : (typeof d.content === 'string' ? d.content : '')
      return infoText ? infoText.slice(0, 60) + (infoText.length > 60 ? '…' : '') : ''
    }
    case 'references': {
      const d = block.data as ReferencesData
      if (Array.isArray(d.references) && d.references.length > 0 && typeof d.references[0] === 'object' && 'type' in d.references[0]) {
        const text = slateContentToPlainText(d.references as import('@/types').SlateContent)
        const count = text.split('\n').filter(l => l.trim()).length
        return `${count} ${count === 1 ? 'referência' : 'referências'}`
      }
      const count = (d.references as string[]).filter((r) => typeof r === 'string' && r.trim()).length
      return `${count} ${count === 1 ? 'referência' : 'referências'}`
    }
    case 'closing-page': {
      const d = block.data as ClosingPageData
      const sigs = [
        d.showPatientSignature && 'Paciente',
        d.showParentSignatures && 'Filiação',
        d.showGuardianSignatures && 'Responsável legal',
      ].filter(Boolean)
      return sigs.length > 0 ? `Assinaturas: ${sigs.join(', ')}` : ''
    }
    default:
      return ''
  }
}

function getContentPlainText(data: TextBlockData): string {
  if (isSlateContent(data.content)) return slateContentToPlainText(data.content)
  return typeof data.content === 'string' ? data.content : ''
}

function textBlockHasContent(data: TextBlockData): boolean {
  return !!getContentPlainText(data).trim()
}

export default function OutlineRow({
  block,
  meta: _meta,
  depth,
  siblingIndex = 0,
  onEdit,
  onDuplicate,
  onRemove,
  onChange,
  onRequestAdd,
  onReviewBlock,
  childCount = 0,
  dragDisabled,
}: OutlineRowProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuPos = useRef({ top: 0, left: 0 })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: dragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if (menuBtnRef.current?.contains(target)) return
      setShowMenu(false)
      setConfirmingRemove(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  useEffect(() => {
    if (!confirmingRemove) return
    const timer = setTimeout(() => setConfirmingRemove(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmingRemove])

  const handleRemoveClick = useCallback(() => {
    if (!onRemove) return
    if (isContainerBlock(block.type)) {
      onRemove(block.id)
      setShowMenu(false)
    } else if (confirmingRemove) {
      onRemove(block.id)
      setShowMenu(false)
      setConfirmingRemove(false)
    } else {
      setConfirmingRemove(true)
    }
  }, [block.type, confirmingRemove, onRemove, block.id])

  const isTextBlock = block.type === 'text'
  const isSectionBlock = block.type === 'section'
  const textData = isTextBlock ? (block.data as TextBlockData) : null
  const hasContent = textData ? textBlockHasContent(textData) : false

  const showEditButton = isSectionBlock ? false : (!isTextBlock || hasContent)

  const displayTitle = getBlockTitle(block)
  const summary = getBlockSummary(block)

  const handleSectionTitleChange = useCallback(
    (value: string) => {
      if (!isSectionBlock) return
      const sectionData = block.data as SectionData
      onChange(block.id, { ...sectionData, title: value })
    },
    [block.id, block.data, isSectionBlock, onChange]
  )

  const handleSectionTitleBlur = useCallback(() => {
    if (!isSectionBlock) return
    const sectionData = block.data as SectionData
    if (!sectionData.title.trim()) {
      const defaultTitle = depth > 0 ? 'Subseção' : 'Nova Seção'
      onChange(block.id, { ...sectionData, title: defaultTitle })
    }
  }, [block.id, block.data, isSectionBlock, depth, onChange])

  const titleClass =
    depth === 0
      ? 'text-sm font-semibold text-gray-800 uppercase tracking-wide'
      : depth === 1
        ? 'text-sm font-medium text-gray-700'
        : 'text-sm text-gray-700'

  const placeholderClass =
    'placeholder:text-gray-400 placeholder:normal-case placeholder:tracking-normal'

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      className={`
        group flex items-center gap-2.5 pl-1.5 pr-4 py-3 rounded-lg border-l-4 transition-all
        ${getBlockBorderColor(block, depth)}
        ${isDragging ? 'opacity-50 shadow-lg bg-white z-10' : block.skippedByAi ? 'bg-amber-50 shadow-sm hover:shadow-md' : isContainerBlock(block.type) && siblingIndex % 2 === 1 ? 'bg-gray-100 shadow-sm hover:shadow-md' : isContainerBlock(block.type) ? 'bg-[#FAFAFA] shadow-sm hover:shadow-md' : 'bg-white shadow-sm hover:shadow-md'}
      `}
    >
      {/* Block type icon — flush with left border */}
      <div className={`p-1.5 rounded-md shrink-0 ${BLOCK_TYPE_COLORS[block.type]}`}>
        {getBlockTypeIcon(block.type, 14)}
      </div>

      {/* Drag handle */}
      <button
        type="button"
        className={`focus:outline-none shrink-0 transition-opacity ${
          dragDisabled ? 'invisible' : 'cursor-grab text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100'
        }`}
        {...attributes}
        {...listeners}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Title / Content area */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {isSectionBlock ? (
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={(block.data as SectionData).title}
              onChange={(e) => handleSectionTitleChange(e.target.value)}
              onBlur={handleSectionTitleBlur}
              placeholder="Título da seção"
              className={`w-full bg-transparent border-0 p-0 ${titleClass} ${placeholderClass} focus:outline-none focus:ring-0`}
            />
          </div>
        ) : isTextBlock && textData ? (
          <div className="flex-1 min-w-0">
            {(() => {
              const plainText = getContentPlainText(textData)
              return (
                <span
                  className="text-sm text-gray-500 italic truncate block cursor-pointer"
                  onDoubleClick={() => onEdit(block.id)}
                  title={plainText}
                >
                  {plainText
                    ? plainText.slice(0, 80) + (plainText.length > 80 ? '…' : '')
                    : 'Texto vazio'}
                </span>
              )
            })()}
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <span
              className={`${titleClass} truncate block`}
              onDoubleClick={() => onEdit(block.id)}
            >
              {displayTitle}
            </span>
            {summary && (
              <span className="text-xs text-gray-400 italic truncate block">
                {summary}
              </span>
            )}
          </div>
        )}

        {/* Content indicator for text blocks with content */}
        {isTextBlock && hasContent && (
          <span className="text-gray-400 shrink-0" title="Tem conteúdo">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h11.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zM2 7.5a.75.75 0 01.75-.75h6.365a.75.75 0 010 1.5H2.75A.75.75 0 012 7.5zM14 7a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02l-1.95-2.1v6.59a.75.75 0 01-1.5 0V9.66l-1.95 2.1a.75.75 0 11-1.1-1.02l3.25-3.5A.75.75 0 0114 7zM2 11.25a.75.75 0 01.75-.75H7A.75.75 0 017 12H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </span>
        )}

        {/* AI badge */}
        {block.skippedByAi ? (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded shrink-0" title="Dados insuficientes">
            ⚠
          </span>
        ) : block.generatedByAi ? (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-medium rounded shrink-0" title="Gerado pelo Assistente">
            ✦
          </span>
        ) : null}

        {/* Block type badge for leaf blocks */}
        {!isContainerBlock(block.type) && (
          <span className="text-xs text-gray-400 shrink-0 hidden group-hover:inline">
            {BLOCK_TYPE_LABELS[block.type]}
          </span>
        )}
      </div>

      {/* Section pill: shows count, hover switches to "+", click adds block */}
      {isSectionBlock && onRequestAdd && (
        <button
          type="button"
          onClick={() => onRequestAdd(block.id, block.id)}
          className="group/pill min-w-8 h-8 px-2 rounded-full bg-gray-100 hover:bg-brand-100 text-gray-400 hover:text-brand-600 transition-all hover:-translate-y-0.5 shrink-0 flex items-center justify-center"
          title="Adicionar bloco na seção"
        >
          {childCount > 0 ? (
            <>
              <span className="text-[10px] font-medium group-hover/pill:hidden">{childCount}</span>
              <svg className="hidden group-hover/pill:block" width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </>
          ) : (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          )}
        </button>
      )}

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Edit button */}
        {showEditButton && (
          <button
            type="button"
            onClick={() => onEdit(block.id)}
            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
            title="Editar"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
        )}

        {/* Three-dot menu */}
        <div>
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => {
              if (!showMenu && menuBtnRef.current) {
                const r = menuBtnRef.current.getBoundingClientRect()
                menuPos.current = { top: r.bottom + 4, left: r.right - 192 }
              }
              setShowMenu(!showMenu)
            }}
            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
            title="Mais opções"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
            </svg>
          </button>

          {/* Dropdown menu (portal to escape dnd-kit transform stacking context) */}
          {showMenu && createPortal(
            <div ref={menuRef} style={{ position: 'fixed', top: menuPos.current.top, left: menuPos.current.left, zIndex: 9999 }} className="w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {/* Edit content option for text blocks without content */}
              {isTextBlock && !hasContent && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onEdit(block.id)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                  Editar conteúdo
                </button>
              )}

              {/* Review with AI */}
              {isTextBlock && hasContent && onReviewBlock && (
                <button
                  type="button"
                  onClick={() => {
                    onReviewBlock(block.id)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
                  </svg>
                  Revisar com Assistente
                </button>
              )}

              {/* Duplicate */}
              {onDuplicate && <button
                type="button"
                onClick={() => {
                  onDuplicate(block.id)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
                Duplicar
              </button>}

              {/* Remove */}
              {onRemove && <button
                type="button"
                onClick={handleRemoveClick}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                  confirmingRemove
                    ? 'text-red-700 bg-red-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {isContainerBlock(block.type) ? 'Excluir seção' : confirmingRemove ? 'Confirmar remoção' : 'Remover'}
              </button>}
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  )
}
