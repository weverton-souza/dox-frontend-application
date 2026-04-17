import { useMemo, useState, useEffect } from 'react'
import type { Block, SectionData } from '@/types'
import { BLOCK_TYPE_LABELS } from '@/types'
import { BLOCK_TYPE_COLORS, getBlockTypeIcon, getBlockTitle } from '@/lib/block-constants'
import { getDirectChildren, getDescendantIds } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface MoveBlocksModalProps {
  isOpen: boolean
  onClose: () => void
  blocks: Block[]
  sourceSectionId: string | null
  candidateBlocks: Block[]
  onConfirm: (blockIds: string[], destSectionId: string | null) => void
}

interface TargetOption {
  id: string | null
  label: string
  depth: number
}

function buildTargets(blocks: Block[], sourceId: string | null): TargetOption[] {
  const excluded = sourceId
    ? new Set<string>([sourceId, ...getDescendantIds(blocks, sourceId)])
    : new Set<string>()

  const targets: TargetOption[] = [{ id: null, label: 'Raiz do documento', depth: 0 }]

  function walk(parentId: string | null, depth: number) {
    const children = getDirectChildren(blocks, parentId).filter((b) => b.type === 'section')
    for (const block of children) {
      if (excluded.has(block.id)) continue
      const title = (block.data as SectionData).title?.trim() || 'Seção sem título'
      targets.push({ id: block.id, label: title, depth })
      walk(block.id, depth + 1)
    }
  }

  walk(null, 0)
  return targets
}

export default function MoveBlocksModal({
  isOpen,
  onClose,
  blocks,
  sourceSectionId,
  candidateBlocks,
  onConfirm,
}: MoveBlocksModalProps) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [selectedDestId, setSelectedDestId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!isOpen) {
      setSelectedBlockIds(new Set())
      setSelectedDestId(undefined)
      return
    }
    // Default: todos selecionados
    setSelectedBlockIds(new Set(candidateBlocks.map((b) => b.id)))
    setSelectedDestId(undefined)
  }, [isOpen, candidateBlocks])

  const targets = useMemo(
    () => (isOpen ? buildTargets(blocks, sourceSectionId) : []),
    [isOpen, blocks, sourceSectionId]
  )

  const sourceLabel = useMemo(() => {
    if (!sourceSectionId) return ''
    const source = blocks.find((b) => b.id === sourceSectionId)
    if (!source || source.type !== 'section') return ''
    return (source.data as SectionData).title?.trim() || 'Seção sem título'
  }, [blocks, sourceSectionId])

  const toggleBlock = (id: string) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedBlockIds(new Set(candidateBlocks.map((b) => b.id)))
  const clearAll = () => setSelectedBlockIds(new Set())

  const selectedCount = selectedBlockIds.size
  const hasSelection = selectedCount > 0 && selectedDestId !== undefined
  const itemsLabel = selectedCount === 1 ? 'bloco' : 'blocos'

  const handleConfirm = () => {
    if (!hasSelection) return
    onConfirm(Array.from(selectedBlockIds), selectedDestId ?? null)
  }

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button variant="ghost" size="sm" onClick={onClose}>
        Cancelar
      </Button>
      <Button size="sm" onClick={handleConfirm} disabled={!hasSelection}>
        Mover {selectedCount} {itemsLabel}
      </Button>
    </div>
  )

  const allSelected = selectedCount === candidateBlocks.length && candidateBlocks.length > 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mover blocos" size="lg" footer={footer}>
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Selecione os blocos
          {sourceLabel && (
            <>
              {' '}de <strong className="text-gray-900">"{sourceLabel}"</strong>
            </>
          )}
          {' '}e escolha o destino.
        </p>

        {/* Lista de blocos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Blocos
            </h3>
            {candidateBlocks.length > 0 && (
              <button
                type="button"
                onClick={allSelected ? clearAll : selectAll}
                className="text-xs text-brand-600 hover:text-brand-800 transition-colors"
              >
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            )}
          </div>
          <ul className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-1">
            {candidateBlocks.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-400 italic text-center">
                Nenhum bloco nesta seção.
              </li>
            ) : (
              candidateBlocks.map((block) => {
                const isSelected = selectedBlockIds.has(block.id)
                const title = getBlockTitle(block)
                return (
                  <li key={block.id}>
                    <label className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBlock(block.id)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div className={`p-1 rounded-md shrink-0 ${BLOCK_TYPE_COLORS[block.type]}`}>
                        {getBlockTypeIcon(block.type, 12)}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {BLOCK_TYPE_LABELS[block.type]}
                      </span>
                      <span className="text-sm text-gray-700 truncate flex-1" title={title}>
                        {title}
                      </span>
                    </label>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        {/* Árvore de destino */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Destino
          </h3>
          <ul className="space-y-0.5 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-1">
            {targets.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-400 italic text-center">
                Nenhum destino disponível.
              </li>
            ) : (
              targets.map((target) => {
                const key = target.id ?? '__root__'
                const isSelected = selectedDestId === target.id
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setSelectedDestId(target.id)}
                      style={{ paddingLeft: `${12 + target.depth * 16}px` }}
                      className={`w-full text-left pr-3 py-2 rounded-md text-sm leading-snug transition-colors ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${target.id === null ? 'italic' : ''}`}
                    >
                      {target.label}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
