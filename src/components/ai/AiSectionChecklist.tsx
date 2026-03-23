import { useState, useMemo } from 'react'
import type { Block, TextBlockData, InfoBoxData } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import AiSparkleIcon from '@/components/ai/AiSparkleIcon'

type SectionStatus = 'empty' | 'ai-generated' | 'skipped'

interface SectionItem {
  title: string
  status: SectionStatus
}

interface AiSectionChecklistProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedSections: string[]) => void
  blocks: Block[]
  loading?: boolean
}

function getSectionStatus(titleBlock: Block, blocks: Block[]): SectionStatus {
  const titleIndex = blocks.findIndex(b => b.id === titleBlock.id)
  const nextBlock = blocks[titleIndex + 1]
  if (!nextBlock) return 'empty'

  const nextData = nextBlock.data as { title?: string }
  const isContentBlock = !nextData.title?.trim()

  if (!isContentBlock) return 'empty'
  if (nextBlock.skippedByAi) return 'skipped'
  if (nextBlock.generatedByAi) return 'ai-generated'
  return 'empty'
}

function getSectionTitle(block: Block): string {
  if (block.type === 'info-box') return (block.data as InfoBoxData).label || 'Info Box'
  const d = block.data as TextBlockData
  return d.title || d.subtitle || 'Seção'
}

export default function AiSectionChecklist({ isOpen, onClose, onConfirm, blocks, loading }: AiSectionChecklistProps) {
  const sections = useMemo<SectionItem[]>(() => {
    return blocks
      .filter(b => {
        if (b.type === 'info-box') return true
        if (b.type === 'text') {
          const d = b.data as TextBlockData
          return !!(d.title?.trim())
        }
        return false
      })
      .sort((a, b) => a.order - b.order)
      .map(b => ({
        title: getSectionTitle(b),
        status: getSectionStatus(b, blocks),
      }))
  }, [blocks])

  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    sections.forEach(s => {
      if (s.status === 'empty') initial.add(s.title)
    })
    return initial
  })

  const toggle = (title: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(sections.map(s => s.title)))
  const deselectAll = () => setSelected(new Set())

  const statusLabel = (status: SectionStatus) => {
    switch (status) {
      case 'empty': return { text: 'vazio', className: 'text-gray-400' }
      case 'ai-generated': return { text: 'gerado pelo Assistente', className: 'text-brand-500' }
      case 'skipped': return { text: 'pulado', className: 'text-amber-500' }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Redigir laudo com Assistente" size="md">
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600">
          Selecione as seções que deseja redigir. Seções já redigidas serão substituídas.
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{selected.size} de {sections.length} selecionadas</span>
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="text-xs text-brand-600 hover:text-brand-700">
              Selecionar todas
            </button>
            <span className="text-xs text-gray-300">|</span>
            <button type="button" onClick={deselectAll} className="text-xs text-gray-500 hover:text-gray-700">
              Limpar seleção
            </button>
          </div>
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {sections.map(section => {
            const isChecked = selected.has(section.title)
            const label = statusLabel(section.status)

            return (
              <label
                key={section.title}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isChecked ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(section.title)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className={`text-sm flex-1 ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {section.title}
                </span>
                <span className={`text-xs ${label.className}`}>
                  {label.text}
                </span>
              </label>
            )
          })}
        </div>

        {selected.size > 0 && sections.some(s => selected.has(s.title) && s.status === 'ai-generated') && (
          <div className="flex items-start gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-700">
            <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Seções já redigidas serão substituídas pelo novo conteúdo.</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(Array.from(selected))} disabled={selected.size === 0 || loading}>
            <span className="flex items-center gap-2">
              <AiSparkleIcon size={16} />
              Redigir {selected.size} {selected.size === 1 ? 'seção' : 'seções'}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
