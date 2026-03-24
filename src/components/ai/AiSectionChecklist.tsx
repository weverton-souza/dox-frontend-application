import { useState, useEffect, useMemo } from 'react'
import type { Block, SectionData, InfoBoxData, FormResponse } from '@/types'
import { FORM_RESPONSE_STATUS_LABELS, FORM_RESPONSE_STATUS_COLORS } from '@/types'
import { getFormResponsesByCustomerId } from '@/lib/api/form-api'
import { listForms } from '@/lib/api/form-api'
import { formatDateTime } from '@/lib/utils'
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
  onConfirm: (selectedSections: string[], formResponseIds: string[]) => void
  blocks: Block[]
  loading?: boolean
  customerId?: string | null
  currentFormResponseId?: string | null
}

function getSectionStatus(sectionBlock: Block, blocks: Block[]): SectionStatus {
  const children = blocks.filter(b => b.parentId === sectionBlock.id)
  if (children.length === 0) return 'empty'
  const firstChild = children[0]
  if (firstChild.skippedByAi) return 'skipped'
  if (firstChild.generatedByAi) return 'ai-generated'
  return 'empty'
}

function getSectionTitle(block: Block): string {
  if (block.type === 'info-box') return (block.data as InfoBoxData).label || 'Info Box'
  if (block.type === 'section') return (block.data as SectionData).title || 'Seção'
  return 'Seção'
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function AiSectionChecklist({ isOpen, onClose, onConfirm, blocks, loading, customerId, currentFormResponseId }: AiSectionChecklistProps) {
  const sections = useMemo<SectionItem[]>(() => {
    return blocks
      .filter(b => b.type === 'section' || b.type === 'info-box')
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

  const [formResponses, setFormResponses] = useState<FormResponse[]>([])
  const [formTitles, setFormTitles] = useState<Record<string, string>>({})
  const [selectedFormResponseIds, setSelectedFormResponseIds] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen && customerId) {
      Promise.all([
        getFormResponsesByCustomerId(customerId),
        listForms(),
      ]).then(([responses, forms]) => {
        setFormResponses(responses)
        const titles: Record<string, string> = {}
        forms.forEach(f => { titles[f.id] = f.title })
        setFormTitles(titles)
        const initial = new Set<string>()
        if (currentFormResponseId) initial.add(currentFormResponseId)
        responses.forEach(r => {
          if (r.status === 'concluido') initial.add(r.id)
        })
        setSelectedFormResponseIds(initial)
      }).catch(() => {})
    }
  }, [isOpen, customerId, currentFormResponseId])

  const toggle = (title: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const toggleFormResponse = (id: string) => {
    setSelectedFormResponseIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSectionExpand = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(sections.map(s => s.title)))
  const deselectAll = () => setSelected(new Set())

  const statusConfig = (status: SectionStatus) => {
    switch (status) {
      case 'empty': return { text: 'Vazio', bg: 'bg-gray-100', text_color: 'text-gray-400' }
      case 'ai-generated': return { text: 'Gerado', bg: 'bg-brand-50', text_color: 'text-brand-600' }
      case 'skipped': return { text: 'Requer dados', bg: 'bg-amber-50', text_color: 'text-amber-600' }
    }
  }

  const hasFormResponses = formResponses.length > 0
  const selectedSourceCount = selectedFormResponseIds.size

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="px-5 pb-5 pt-2">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 mb-3">
            <AiSparkleIcon size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Redigir com Assistente</h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Selecione as seções e fontes de dados para a redação.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-gray-400">{selected.size} de {sections.length}</span>
          <div className="flex gap-3">
            <button type="button" onClick={selectAll} className="text-[13px] text-brand-600 hover:text-brand-700 font-medium">
              Todas
            </button>
            <button type="button" onClick={deselectAll} className="text-[13px] text-gray-400 hover:text-gray-600">
              Nenhuma
            </button>
          </div>
        </div>

        {/* Section list — iOS grouped style */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100 max-h-[26rem] overflow-y-auto">
          {sections.map((section, idx) => {
            const isChecked = selected.has(section.title)
            const status = statusConfig(section.status)
            const isExpanded = expandedSections.has(section.title)
            const isFirst = idx === 0
            const isLast = idx === sections.length - 1

            return (
              <div key={section.title}>
                {/* Section row */}
                <div
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-gray-50 ${
                    isFirst ? 'rounded-t-xl' : ''
                  } ${isLast && !isExpanded ? 'rounded-b-xl' : ''}`}
                  onClick={() => toggle(section.title)}
                >
                  {/* Checkmark circle */}
                  <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? 'bg-brand-500' : 'border-2 border-gray-300'
                  }`}>
                    {isChecked && <CheckIcon className="text-white" />}
                  </div>

                  {/* Title */}
                  <span className={`text-[15px] flex-1 leading-tight ${
                    isChecked ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {section.title}
                  </span>

                  {/* Status pill */}
                  {!isExpanded && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text_color}`}>
                      {status.text}
                    </span>
                  )}

                  {/* Expand chevron for data sources */}
                  {hasFormResponses && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSectionExpand(section.title) }}
                      className="p-1 -mr-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <ChevronIcon expanded={isExpanded} />
                    </button>
                  )}
                </div>

                {/* Expanded data sources */}
                {isExpanded && hasFormResponses && (
                  <div className="bg-gray-50/80 px-4 pb-3 pt-1">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                      Fontes de dados
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {formResponses.map(response => {
                        const isSourceChecked = selectedFormResponseIds.has(response.id)
                        const formTitle = formTitles[response.formId] || 'Formulário'
                        const statusColors = FORM_RESPONSE_STATUS_COLORS[response.status]

                        return (
                          <div
                            key={response.id}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSourceChecked ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                            }`}
                            onClick={() => toggleFormResponse(response.id)}
                          >
                            <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isSourceChecked ? 'bg-emerald-500' : 'border-[1.5px] border-gray-300'
                            }`}>
                              {isSourceChecked && (
                                <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-[13px] flex-1 ${isSourceChecked ? 'text-gray-800' : 'text-gray-500'}`}>
                              {formTitle}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {formatDateTime(response.createdAt)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors.bg} ${statusColors.text}`}>
                              {FORM_RESPONSE_STATUS_LABELS[response.status]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Source count footer */}
        {hasFormResponses && (
          <div className="flex items-center gap-2 mt-3 px-1">
            <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-[12px] text-gray-400">
              {selectedSourceCount} {selectedSourceCount === 1 ? 'fonte selecionada' : 'fontes selecionadas'}
            </span>
          </div>
        )}

        {/* Overwrite warning */}
        {selected.size > 0 && sections.some(s => selected.has(s.title) && s.status === 'ai-generated') && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-700">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Seções já redigidas serão substituídas.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(Array.from(selected), Array.from(selectedFormResponseIds))}
            disabled={selected.size === 0 || loading}
            className="flex-1"
          >
            <span className="flex items-center justify-center gap-2">
              <AiSparkleIcon size={16} />
              Redigir {selected.size} {selected.size === 1 ? 'seção' : 'seções'}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
