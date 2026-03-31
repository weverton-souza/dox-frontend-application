import { useState, useEffect, useMemo, useRef } from 'react'
import type { Block, SectionData, InfoBoxData, TextBlockData, ScoreTableData, ChartData, FormResponse, ReviewAction, SectionInstruction } from '@/types'
import { FORM_RESPONSE_STATUS_LABELS, FORM_RESPONSE_STATUS_COLORS, isSlateContent, slateContentToPlainText } from '@/types'
import { getFormResponsesByCustomerId } from '@/lib/api/form-api'
import { getForms } from '@/lib/api/form-api'
import { classifyTableData, classifyChartData } from '@/lib/ai-context-builder'
import { formatDateTime } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import AiSparkleIcon from '@/components/ai/AiSparkleIcon'
import { CheckIcon, EditIcon } from '@/components/icons'

type SectionStatus = 'empty' | 'ai-generated' | 'skipped' | 'has-content'

interface SectionItem {
  title: string
  status: SectionStatus
}

export interface ReviewSectionConfig {
  sectionTitle: string
  action: ReviewAction
}

interface AiSectionChecklistProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedSections: SectionInstruction[], formResponseIds: string[], reviewSections?: ReviewSectionConfig[], dataInstructions?: Record<string, string>, selectedDataBlockIds?: string[], includeCustomerData?: boolean) => void
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
  if (firstChild.type === 'text') {
    const textData = firstChild.data as TextBlockData
    const content = isSlateContent(textData.content)
      ? slateContentToPlainText(textData.content)
      : typeof textData.content === 'string' ? textData.content : ''
    if (content.trim()) return 'has-content'
  }
  return 'empty'
}

function getSectionTitle(block: Block): string {
  if (block.type === 'info-box') return (block.data as InfoBoxData).label || 'Info Box'
  if (block.type === 'section') return (block.data as SectionData).title || 'Seção'
  return 'Seção'
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
      if (s.status === 'empty' || s.status === 'skipped' || s.status === 'ai-generated') initial.add(s.title)
    })
    return initial
  })

  const [formResponses, setFormResponses] = useState<FormResponse[]>([])
  const [formTitles, setFormTitles] = useState<Record<string, string>>({})
  const [selectedFormResponseIds, setSelectedFormResponseIds] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [includeCustomerData, setIncludeCustomerData] = useState(true)
  const [sectionInstructions, setSectionInstructions] = useState<Record<string, string>>({})
  const [instructionPopover, setInstructionPopover] = useState<string | null>(null)
  const [instructionDraft, setInstructionDraft] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  interface QuantitativeItem {
    blockId: string
    title: string
    type: 'table' | 'chart'
    icon: string
  }

  const sectionBlocks = useMemo(() => {
    return blocks
      .filter(b => b.type === 'section' || b.type === 'info-box')
      .sort((a, b) => a.order - b.order)
  }, [blocks])

  const quantitativeItemsBySection = useMemo<Record<string, QuantitativeItem[]>>(() => {
    const map: Record<string, QuantitativeItem[]> = {}
    for (const sectionBlock of sectionBlocks) {
      const sectionTitle = getSectionTitle(sectionBlock)
      const children = blocks.filter(b => b.parentId === sectionBlock.id)
      const items: QuantitativeItem[] = []
      for (const child of children) {
        if (child.type === 'score-table') {
          const data = child.data as ScoreTableData
          if (classifyTableData(data) !== 'empty') {
            items.push({ blockId: child.id, title: data.title || 'Tabela sem título', type: 'table', icon: '📊' })
          }
        } else if (child.type === 'chart') {
          const data = child.data as ChartData
          if (classifyChartData(data) !== 'empty') {
            items.push({ blockId: child.id, title: data.title || 'Gráfico sem título', type: 'chart', icon: '📈' })
          }
        }
      }
      if (items.length > 0) map[sectionTitle] = items
    }
    return map
  }, [blocks, sectionBlocks])

  const allQuantitativeItems = useMemo(() => {
    return Object.values(quantitativeItemsBySection).flat()
  }, [quantitativeItemsBySection])

  const [dataInstructions, setDataInstructions] = useState<Record<string, string>>({})
  const [selectedDataIds, setSelectedDataIds] = useState<Set<string>>(() => new Set(allQuantitativeItems.map(q => q.blockId)))

  const toggleDataItem = (blockId: string) => {
    setSelectedDataIds(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }

  useEffect(() => {
    if (isOpen && customerId) {
      Promise.all([
        getFormResponsesByCustomerId(customerId),
        getForms(),
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

  const openInstructionPopover = (key: string, e: React.MouseEvent, isData = false) => {
    e.stopPropagation()
    const source = isData ? dataInstructions : sectionInstructions
    setInstructionDraft(source[key] || '')
    setInstructionPopover(isData ? `data:${key}` : key)
  }

  const saveInstruction = () => {
    if (!instructionPopover) return
    const trimmed = instructionDraft.trim()
    const isData = instructionPopover.startsWith('data:')
    const key = isData ? instructionPopover.slice(5) : instructionPopover
    const setter = isData ? setDataInstructions : setSectionInstructions
    setter(prev => {
      const next = { ...prev }
      if (trimmed) next[key] = trimmed
      else delete next[key]
      return next
    })
    setInstructionPopover(null)
  }

  const clearInstruction = () => {
    if (!instructionPopover) return
    const isData = instructionPopover.startsWith('data:')
    const key = isData ? instructionPopover.slice(5) : instructionPopover
    const setter = isData ? setDataInstructions : setSectionInstructions
    setter(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setInstructionDraft('')
    setInstructionPopover(null)
  }

  useEffect(() => {
    if (!instructionPopover) return
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setInstructionPopover(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [instructionPopover])

  const selectAll = () => setSelected(new Set(sections.map(s => s.title)))
  const deselectAll = () => setSelected(new Set())

  const statusConfig = (status: SectionStatus) => {
    switch (status) {
      case 'empty': return { text: 'Vazio', bg: 'bg-gray-100', text_color: 'text-gray-400' }
      case 'ai-generated': return { text: 'Gerado', bg: 'bg-brand-50', text_color: 'text-brand-600' }
      case 'has-content': return { text: 'Com texto', bg: 'bg-emerald-50', text_color: 'text-emerald-600' }
      case 'skipped': return { text: 'Requer dados', bg: 'bg-amber-50', text_color: 'text-amber-600' }
    }
  }

  const REVIEW_ACTIONS: { value: ReviewAction; label: string }[] = [
    { value: 'melhorar', label: 'Melhorar' },
    { value: 'corrigir', label: 'Corrigir' },
    { value: 'resumir', label: 'Resumir' },
    { value: 'expandir', label: 'Expandir' },
  ]

  const [reviewActions, setReviewActions] = useState<Record<string, ReviewAction>>({})

  const setReviewAction = (title: string, action: ReviewAction) => {
    setReviewActions(prev => ({ ...prev, [title]: action }))
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
            const hasInstruction = !!sectionInstructions[section.title]
            const isPopoverOpen = instructionPopover === section.title

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

                  {/* Instruction icon */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => openInstructionPopover(section.title, e)}
                      className={`p-1 rounded-lg transition-colors shrink-0 ${
                        hasInstruction
                          ? 'text-brand-500 hover:text-brand-600 hover:bg-brand-50'
                          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                      }`}
                      title={hasInstruction ? 'Editar instrução' : 'Adicionar instrução'}
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>

                    {/* Instruction popover */}
                    {isPopoverOpen && (
                      <div
                        ref={popoverRef}
                        className="absolute right-0 top-8 z-50 w-72 bg-white rounded-xl border border-gray-200 shadow-dropdown p-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[12px] font-medium text-gray-500 block mb-2">
                          {section.title}
                        </span>
                        <textarea
                          value={instructionDraft}
                          onChange={(e) => setInstructionDraft(e.target.value)}
                          placeholder="Instruções para o Assistente nesta seção..."
                          className="w-full h-20 text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 placeholder:text-gray-400"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={clearInstruction}
                            className="text-[12px] text-gray-400 hover:text-gray-600 px-2 py-1"
                          >
                            Limpar
                          </button>
                          <button
                            type="button"
                            onClick={saveInstruction}
                            className="text-[12px] text-brand-600 hover:text-brand-700 font-medium px-2 py-1"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

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

                {/* Manual content warning */}
                {isChecked && section.status === 'has-content' && (
                  <div className="flex items-center gap-2 mx-4 mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Esta seção contém texto manual que será substituído
                  </div>
                )}

                {/* Expanded: review actions + data sources */}
                {isExpanded && (
                  <div className="bg-gray-50/80 px-4 pb-3 pt-1">
                    {/* Review action selector for sections with content */}
                    {isChecked && (section.status === 'has-content' || section.status === 'ai-generated') && (
                      <>
                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                          Revisar
                        </span>
                        <div className="mt-1.5 mb-3 flex gap-1.5">
                          {REVIEW_ACTIONS.map(ra => {
                            const isActive = (reviewActions[section.title] || 'melhorar') === ra.value
                            return (
                              <div
                                key={ra.value}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                  isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                                }`}
                                onClick={(e) => { e.stopPropagation(); setReviewAction(section.title, ra.value) }}
                              >
                                <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  isActive ? 'bg-emerald-500' : 'border-[1.5px] border-gray-300'
                                }`}>
                                  {isActive && (
                                    <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`text-[13px] ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                                  {ra.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Data sources */}
                    {(customerId || hasFormResponses || (quantitativeItemsBySection[section.title] || []).length > 0) && (
                      <>
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                      Fontes de dados
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {/* Customer data toggle */}
                      {customerId && (
                        <div
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            includeCustomerData ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                          }`}
                          onClick={() => setIncludeCustomerData(prev => !prev)}
                        >
                          <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            includeCustomerData ? 'bg-emerald-500' : 'border-[1.5px] border-gray-300'
                          }`}>
                            {includeCustomerData && (
                              <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-[14px] shrink-0">👤</span>
                          <span className={`text-[13px] flex-1 ${includeCustomerData ? 'text-gray-800' : 'text-gray-500'}`}>
                            Dados do cliente
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                            Cadastro
                          </span>
                        </div>
                      )}

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

                      {/* Quantitative data items for this section */}
                      {(quantitativeItemsBySection[section.title] || []).map(item => {
                        const isDataChecked = selectedDataIds.has(item.blockId)
                        const hasDataInstruction = !!dataInstructions[item.blockId]
                        const isDataPopoverOpen = instructionPopover === `data:${item.blockId}`

                        return (
                          <div
                            key={item.blockId}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isDataChecked ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                            }`}
                            onClick={() => toggleDataItem(item.blockId)}
                          >
                            <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isDataChecked ? 'bg-emerald-500' : 'border-[1.5px] border-gray-300'
                            }`}>
                              {isDataChecked && (
                                <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="text-[14px] shrink-0">{item.icon}</span>
                            <span className={`text-[13px] flex-1 ${isDataChecked ? 'text-gray-800' : 'text-gray-500'}`}>
                              {item.title}
                            </span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => openInstructionPopover(item.blockId, e, true)}
                                className={`p-1 rounded-lg transition-colors shrink-0 ${
                                  hasDataInstruction
                                    ? 'text-brand-500 hover:text-brand-600 hover:bg-brand-50'
                                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                                }`}
                                title={hasDataInstruction ? 'Editar instrução' : 'Adicionar instrução'}
                              >
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>

                              {isDataPopoverOpen && (
                                <div
                                  ref={popoverRef}
                                  className="absolute right-0 top-8 z-50 w-72 bg-white rounded-xl border border-gray-200 shadow-dropdown p-3"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[12px] font-medium text-gray-500 block mb-2">
                                    {item.icon} {item.title}
                                  </span>
                                  <textarea
                                    value={instructionDraft}
                                    onChange={(e) => setInstructionDraft(e.target.value)}
                                    placeholder="Ex: Foque na discrepância entre QIV e QIE..."
                                    className="w-full h-20 text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 placeholder:text-gray-400"
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={clearInstruction} className="text-[12px] text-gray-400 hover:text-gray-600 px-2 py-1">
                                      Limpar
                                    </button>
                                    <button type="button" onClick={saveInstruction} className="text-[12px] text-brand-600 hover:text-brand-700 font-medium px-2 py-1">
                                      OK
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.type === 'table' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              {item.type === 'table' ? 'Tabela' : 'Gráfico'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Source count footer */}
        {(hasFormResponses || allQuantitativeItems.length > 0) && (
          <div className="flex items-center gap-2 mt-3 px-1">
            <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-[12px] text-gray-400">
              {selectedSourceCount} {selectedSourceCount === 1 ? 'formulário' : 'formulários'}
              {allQuantitativeItems.length > 0 && (() => {
                const selectedCount = allQuantitativeItems.filter(q => selectedDataIds.has(q.blockId)).length
                return ` · ${selectedCount}/${allQuantitativeItems.length} dados quantitativos`
              })()}
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
            onClick={() => {
              const reviewConfigs: ReviewSectionConfig[] = []
              const sectionInstructionList: SectionInstruction[] = []
              selected.forEach(title => {
                const section = sections.find(s => s.title === title)
                sectionInstructionList.push({
                  sectionTitle: title,
                  instruction: sectionInstructions[title] || null,
                })
                if (section && (section.status === 'has-content' || section.status === 'ai-generated')) {
                  reviewConfigs.push({
                    sectionTitle: title,
                    action: reviewActions[title] || 'melhorar',
                  })
                }
              })
              const hasDataInstructions = Object.keys(dataInstructions).length > 0
              onConfirm(
                sectionInstructionList,
                Array.from(selectedFormResponseIds),
                reviewConfigs.length > 0 ? reviewConfigs : undefined,
                hasDataInstructions ? dataInstructions : undefined,
                Array.from(selectedDataIds),
                includeCustomerData,
              )
            }}
            disabled={selected.size === 0 || loading}
            className="flex-1"
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  <AiSparkleIcon size={16} />
                  Redigir {selected.size} {selected.size === 1 ? 'seção' : 'seções'}
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
