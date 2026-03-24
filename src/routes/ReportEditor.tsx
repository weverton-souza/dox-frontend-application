import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Block, BlockType, BlockData, Report, ReportStatus, ReportVersion, Customer, ScoreTableTemplate, ChartTemplate } from '@/types'
import { createScoreTableFromTemplate, createChartFromTemplate } from '@/types'
import { getReport, updateReport } from '@/lib/api/report-api'
import { getCustomers } from '@/lib/api/customer-api'
import { createReportTemplate, getScoreTableTemplates, getChartTemplates } from '@/lib/api/template-api'
import { getFormById, getFormResponseById } from '@/lib/api/form-api'
import { useError } from '@/contexts/ErrorContext'
import { createBlock, computeBlockMetas } from '@/lib/utils'
import { useVersioning } from '@/lib/hooks/use-versioning'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import { useClickOutside } from '@/lib/hooks/use-click-outside'
import OutlineTree from '@/components/editor/OutlineTree'
import BlockSelector from '@/components/editor/BlockSelector'
import BlockEditModal from '@/components/editor/BlockEditModal'
import VersionHistoryModal from '@/components/editor/VersionHistoryModal'
import DocxPreviewPanel from '@/components/editor/DocxPreviewPanel'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import StatusSelector from '@/components/editor/StatusSelector'
import { HistoryIcon, SaveIcon } from '@/components/icons'
import SaveStatusIndicator from '@/components/ui/SaveStatusIndicator'
import { useAiGeneration } from '@/lib/hooks/use-ai-generation'
import { countFillableBlocks } from '@/lib/ai-context-builder'
import AiSparkleIcon from '@/components/ai/AiSparkleIcon'
import AiLoadingOverlay from '@/components/ai/AiLoadingOverlay'
import AiUsageBadge from '@/components/ai/AiUsageBadge'
import AiQuotaAlert from '@/components/ai/AiQuotaAlert'
import AiUnavailableBanner from '@/components/ai/AiUnavailableBanner'
import AiFinalizationModal from '@/components/ai/AiFinalizationModal'
import AiUsageDashboard from '@/components/ai/AiUsageDashboard'
import AiSectionChecklist from '@/components/ai/AiSectionChecklist'

export default function ReportEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showError } = useError()

  const [report, setReport] = useState<Report | null>(null)
  const [showBlockSelector, setShowBlockSelector] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [insertAfterBlockId, setInsertAfterBlockId] = useState<string | null>(null)
  const [insertParentId, setInsertParentId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [showSectionSelector, setShowSectionSelector] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showDocxPreview, setShowDocxPreview] = useState(false)
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0)
  const [formProvenanceLabel, setFormProvenanceLabel] = useState<string | null>(null)
  const [formProvenanceId, setFormProvenanceId] = useState<string | null>(null)
  const [scoreTableTemplates, setScoreTableTemplates] = useState<ScoreTableTemplate[]>([])
  const [chartTemplatesState, setChartTemplatesState] = useState<ChartTemplate[]>([])
  const sectionSelectorRef = useRef<HTMLDivElement>(null)

  const saveReportFn = useCallback((data: Report) => updateReport(data), [])
  const { saveStatus, scheduleSave, forceSave } = useAutoSave<Report>(saveReportFn)

  const ai = useAiGeneration()
  const [showUsageDashboard, setShowUsageDashboard] = useState(false)
  const [showFinalizationModal, setShowFinalizationModal] = useState(false)
  const [showSectionChecklist, setShowSectionChecklist] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<ReportStatus | null>(null)

  // Load report, customers, and templates
  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const [loaded, customersPage, stTemplates, cTemplates] = await Promise.all([
          getReport(id!),
          getCustomers(0, 200),
          getScoreTableTemplates(),
          getChartTemplates(),
        ])
        setReport(loaded)
        setCustomers(customersPage.content)
        setScoreTableTemplates(stTemplates)
        setChartTemplatesState(cTemplates)

        // Load provenance info if report was generated from a form response
        if (loaded.formResponseId && loaded.formId) {
          try {
            const resp = await getFormResponseById(loaded.formId, loaded.formResponseId)
            if (resp) {
              const form = await getFormById(resp.formId)
              setFormProvenanceLabel(form?.title || 'Formulário')
              setFormProvenanceId(resp.formId)
            }
          } catch {
            // provenance info is optional
          }
        }
      } catch {
        navigate('/')
      }
    }
    load()
  }, [id, navigate])

  // Versioning
  const {
    versions,
    refreshVersions,
    createStatusChangeSnapshot,
    createExportSnapshot,
    createManualSnapshot,
    createSnapshot,
  } = useVersioning(report, showError)

  const handleUpdateReport = useCallback(
    (updates: Partial<Report>) => {
      if (!report) return
      const updated = { ...report, ...updates }
      setReport(updated)
      scheduleSave(updated)
      if (updates.blocks) {
        setPreviewRefreshKey((k) => k + 1)
      }
    },
    [report, scheduleSave]
  )

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      handleUpdateReport({ blocks })
    },
    [handleUpdateReport]
  )

  const handleBlockDataChange = useCallback(
    (blockId: string, data: BlockData) => {
      if (!report) return
      const updated = report.blocks.map((b) =>
        b.id === blockId ? { ...b, data } : b
      )
      handleUpdateReport({ blocks: updated })
      setPreviewRefreshKey((k) => k + 1)
    },
    [report, handleUpdateReport]
  )

  const handleCustomerSelected = useCallback(
    (customerId: string) => {
      handleUpdateReport({ customerId })
    },
    [handleUpdateReport]
  )

  const handleAddBlock = useCallback(
    (type: BlockType, templateId?: string) => {
      if (!report) return

      const sorted = [...report.blocks].sort((a, b) => a.order - b.order)

      const newBlock = createBlock(type, 0, undefined, insertParentId)

      // Subseção: usar título contextual quando criado dentro de outra seção
      if (type === 'section' && insertParentId) {
        ;(newBlock.data as { title: string }).title = 'Subseção'
      }

      // Score table com template: preencher dados do template
      if (type === 'score-table' && templateId) {
        const template = scoreTableTemplates.find(t => t.id === templateId)
        if (template) {
          newBlock.data = createScoreTableFromTemplate(template)
        }
      }

      // Chart com template: preencher dados do template
      if (type === 'chart' && templateId) {
        const template = chartTemplatesState.find(t => t.id === templateId)
        if (template) {
          newBlock.data = createChartFromTemplate(template)
        }
      }

      let newBlocks: Block[]
      if (insertAfterBlockId) {
        const afterIndex = sorted.findIndex((b) => b.id === insertAfterBlockId)
        if (afterIndex !== -1) {
          sorted.splice(afterIndex + 1, 0, newBlock)
          newBlocks = sorted.map((b, i) => ({ ...b, order: i }))
        } else {
          newBlocks = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
        }
      } else {
        newBlocks = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
      }

      setInsertAfterBlockId(null)
      setInsertParentId(null)
      handleUpdateReport({ blocks: newBlocks })

      // Abrir edição automaticamente para tabelas e gráficos
      if (type === 'score-table' || type === 'chart') {
        setEditingBlockId(newBlock.id)
      }
    },
    [report, handleUpdateReport, insertAfterBlockId, insertParentId, scoreTableTemplates, chartTemplatesState]
  )

  const handleRequestAddBlock = useCallback(
    (afterBlockId: string, parentId?: string | null) => {
      setInsertAfterBlockId(afterBlockId)
      setInsertParentId(parentId ?? null)
      setShowBlockSelector(true)
    },
    []
  )

  const handleAddTextSection = useCallback(() => {
    if (!report) return

    const sorted = [...report.blocks].sort((a, b) => a.order - b.order)
    const newBlock = createBlock('section', 0, undefined, null)

    // Insert before closing-page so it always stays last
    const closingIdx = sorted.findIndex((b) => b.type === 'closing-page')
    if (closingIdx !== -1) {
      sorted.splice(closingIdx, 0, newBlock)
    } else {
      sorted.push(newBlock)
    }
    const newBlocks = sorted.map((b, i) => ({ ...b, order: i }))
    handleUpdateReport({ blocks: newBlocks })
    setShowSectionSelector(false)
  }, [report, handleUpdateReport])

  const handleAddClosingPage = useCallback(() => {
    if (!report) return

    const sorted = [...report.blocks].sort((a, b) => a.order - b.order)
    const newBlock = createBlock('closing-page', 0)
    const newBlocks = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
    handleUpdateReport({ blocks: newBlocks })
    setShowSectionSelector(false)
  }, [report, handleUpdateReport])

  const handleSaveTemplate = useCallback(async () => {
    if (!report || !templateName.trim()) return

    try {
      await createReportTemplate({
        name: templateName.trim(),
        description: templateDesc.trim(),
        isDefault: false,
        blocks: report.blocks.map((b) => ({
          type: b.type,
          order: b.order,
          data: JSON.parse(JSON.stringify(b.data)),
        })),
      })
      setShowSaveTemplate(false)
      setTemplateName('')
      setTemplateDesc('')
    } catch (err) {
      showError(err)
    }
  }, [report, templateName, templateDesc, showError])

  const handleGenerateDocx = useCallback(async () => {
    if (!report) return

    try {
      createExportSnapshot('DOCX')
      const finalized = { ...report, status: 'finalizado' as const }
      setReport(finalized)
      await updateReport(finalized)

      const { downloadDocx } = await import('@/lib/docx-engine')
      await downloadDocx(finalized)
    } catch (err) {
      showError(err)
    }
  }, [report, createExportSnapshot, showError])

  const handleForceSave = useCallback(() => {
    if (!report) return
    forceSave(report)
  }, [report, forceSave])

  const handleStatusChange = useCallback(
    (newStatus: ReportStatus) => {
      if (newStatus === 'finalizado' && report?.blocks.some(b => b.generatedByAi || b.skippedByAi)) {
        setPendingStatusChange(newStatus)
        setShowFinalizationModal(true)
        return
      }
      if (report) createStatusChangeSnapshot(report.status)
      handleUpdateReport({ status: newStatus })
    },
    [report, handleUpdateReport, createStatusChangeSnapshot]
  )

  const handleConfirmFinalization = useCallback(() => {
    if (report && pendingStatusChange) {
      createStatusChangeSnapshot(report.status)
      handleUpdateReport({ status: pendingStatusChange })
    }
    setShowFinalizationModal(false)
    setPendingStatusChange(null)
  }, [report, pendingStatusChange, handleUpdateReport, createStatusChangeSnapshot])

  const handleGenerateFullReport = useCallback(() => {
    if (!report || !id) return
    setShowSectionChecklist(true)
  }, [report, id])

  const handleConfirmGeneration = useCallback((selectedSections: string[], formResponseIds: string[]) => {
    if (!report || !id) return
    setShowSectionChecklist(false)
    ai.generateFullReport(
      id,
      formResponseIds,
      report.blocks,
      () => {},
      selectedSections,
    )
  }, [report, id, ai])

  useEffect(() => {
    if (ai.generationStatus === 'success' && id) {
      getReport(id).then(reloaded => {
        if (reloaded) {
          setReport(reloaded)
          setPreviewRefreshKey((k) => k + 1)
        }
      }).catch(() => {})
    }
  }, [ai.generationStatus, id])

  const showAiButton = ai.isAvailable && report?.status !== 'finalizado'
  const fillableCount = report ? countFillableBlocks(report.blocks) : 0
  const warningCount = report?.blocks.filter(b => b.skippedByAi).length ?? 0

  const sectionNamesForOverlay = useMemo(() => {
    if (!report) return []
    return report.blocks
      .filter(b => b.type === 'section' || b.type === 'info-box')
      .sort((a, b) => a.order - b.order)
      .map(b => {
        const d = b.data as { title?: string; label?: string }
        return d.title || d.label || 'Seção'
      })
  }, [report])

  const handleRestoreVersion = useCallback(
    (version: ReportVersion) => {
      createSnapshot('Estado antes de restaurar versão')
      handleUpdateReport({
        customerName: version.customerName,
        blocks: JSON.parse(JSON.stringify(version.blocks)),
      })
    },
    [createSnapshot, handleUpdateReport]
  )

  const handleOpenVersionHistory = useCallback(() => {
    refreshVersions()
    setShowVersionHistory(true)
  }, [refreshVersions])

  // Section collapse/expand (with cascade for subsections)
  const toggleSectionCollapse = useCallback((sectionBlockId: string, subsectionIds?: string[]) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionBlockId)) {
        next.delete(sectionBlockId)
      } else {
        next.add(sectionBlockId)
        // Cascade: colapsar todas as subseções junto
        subsectionIds?.forEach(id => next.add(id))
      }
      return next
    })
  }, [])

  // Sorted blocks + metas (memoized)
  const sortedBlocks = useMemo(() => {
    if (!report) return []
    return [...report.blocks].sort((a, b) => a.order - b.order)
  }, [report])

  const blockMetas = useMemo(() => computeBlockMetas(sortedBlocks), [sortedBlocks])

  // Collect all section IDs for collapse/expand all
  const allSectionIds = useMemo(() => {
    const ids: string[] = []
    for (const block of sortedBlocks) {
      const meta = blockMetas[block.id]
      if (meta?.isSection) ids.push(block.id)
    }
    return ids
  }, [sortedBlocks, blockMetas])

  // Default: start with all sections collapsed
  const initialCollapseRef = useRef(false)
  useEffect(() => {
    if (!initialCollapseRef.current && allSectionIds.length > 0) {
      initialCollapseRef.current = true
      setCollapsedSections(new Set(allSectionIds))
    }
  }, [allSectionIds])

  const collapseAll = useCallback(() => {
    setCollapsedSections(new Set(allSectionIds))
  }, [allSectionIds])

  const expandAll = useCallback(() => {
    setCollapsedSections(new Set())
  }, [])

  // Compute target section name for BlockSelector context
  const insertTargetSection = useMemo(() => {
    if (!insertAfterBlockId || !report) return undefined
    const meta = blockMetas[insertAfterBlockId]
    return meta?.section || undefined
  }, [insertAfterBlockId, report, blockMetas])

  // Find the block being edited
  const editingBlock = useMemo(() => {
    if (!editingBlockId || !report) return null
    return report.blocks.find((b) => b.id === editingBlockId) ?? null
  }, [editingBlockId, report])

  // Check if closing-page already exists (only allow one)
  const hasClosingPage = useMemo(() => {
    if (!report) return false
    return report.blocks.some((b) => b.type === 'closing-page')
  }, [report])

  // Close section selector on outside click
  const closeSectionSelector = useCallback(() => setShowSectionSelector(false), [])
  useClickOutside(sectionSelectorRef, closeSectionSelector, showSectionSelector)

  if (!report) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-[calc(100vh)] bg-gray-100 flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-12 z-30 h-14 lg:h-16 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-full flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              handleForceSave()
              navigate('/')
            }}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
            title="Voltar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={report.customerName || ''}
              onChange={(e) => handleUpdateReport({ customerName: e.target.value })}
              placeholder="Nome do cliente"
              className="text-base lg:text-lg font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 w-full truncate placeholder:text-gray-400"
            />
          </div>

          <SaveStatusIndicator status={saveStatus} />

          <StatusSelector status={report.status} onChange={handleStatusChange} />

          {/* Separador */}
          <div className="hidden md:block w-px h-5 bg-gray-200" />

          {/* Ações de versão */}
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={createManualSnapshot}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Salvar versão"
            >
              <SaveIcon size={16} />
            </button>
            <button
              type="button"
              onClick={handleOpenVersionHistory}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Histórico de versões"
            >
              <HistoryIcon size={16} />
            </button>
          </div>

          {/* Separador */}
          <div className="hidden lg:block w-px h-5 bg-gray-200" />

          {/* Ações principais */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowSaveTemplate(true)}>
              Salvar como Template
            </Button>

            {showAiButton && fillableCount > 0 && (
              <Button variant="primary" size="sm" onClick={handleGenerateFullReport} disabled={ai.isGenerating}>
                <span className="flex items-center gap-1.5">
                  {ai.isGenerating ? (
                    <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <AiSparkleIcon size={14} />
                  )}
                  Redigir com Assistente
                </span>
              </Button>
            )}
          </div>

          {/* Separador */}
          <div className="hidden lg:block w-px h-5 bg-gray-200" />

          {/* Export */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDocxPreview((v) => !v)} className="hidden lg:inline-flex">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Preview
              </span>
            </Button>

            <Button variant="primary" size="sm" onClick={handleGenerateDocx}>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                .docx
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div
        className={`flex-1 flex w-full px-4 sm:px-6 ${showDocxPreview ? 'gap-6' : 'max-w-3xl mx-auto'}`}
      >
        {/* Left: blocks */}
        <div className={`min-w-0 flex flex-col ${showDocxPreview ? 'w-full max-w-3xl' : 'flex-1'}`}>
          {/* Form provenance banner */}
          {formProvenanceLabel && (
            <div className="pt-3">
              <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-3 py-2 text-xs text-brand-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>
                  Gerado a partir do formulário{' '}
                  <button
                    type="button"
                    onClick={() => formProvenanceId && navigate(`/forms/${formProvenanceId}/responses`)}
                    className="font-medium underline hover:text-brand-800"
                  >
                    {formProvenanceLabel}
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* AI alerts */}
          {ai.isAvailable && ai.usageSummary?.alertLevel && ai.usageSummary.alertMessage && (
            <div className="pt-3">
              <AiQuotaAlert
                alertLevel={ai.usageSummary.alertLevel}
                alertMessage={ai.usageSummary.alertMessage}
                overage={ai.usageSummary.overage}
              />
            </div>
          )}
          {!ai.isAvailable && ai.aiStatus && ai.aiStatus.tierName && (
            <div className="pt-3">
              <AiUnavailableBanner />
            </div>
          )}

          {/* Toolbar */}
          <div className="pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {ai.isAvailable && ai.usageSummary && (
                <AiUsageBadge
                  used={ai.usageSummary.used}
                  limit={ai.usageSummary.limit}
                  onClick={() => setShowUsageDashboard(true)}
                />
              )}
              {warningCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const first = report?.blocks.find(b => b.skippedByAi)
                    if (first) {
                      const el = document.querySelector(`[data-block-id="${first.id}"]`)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100"
                  title={`${warningCount} seção(ões) não gerada(s) por dados insuficientes`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {warningCount} {warningCount === 1 ? 'aviso' : 'avisos'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{report.blocks.length} blocos</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={collapseAll}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Recolher todas as seções"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 15.79a.75.75 0 001.06-.02L10 11.832l3.71 3.938a.75.75 0 101.08-1.04l-4.25-4.5a.75.75 0 00-1.08 0l-4.25 4.5a.75.75 0 00.02 1.06z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M5.23 9.79a.75.75 0 001.06-.02L10 5.832l3.71 3.938a.75.75 0 101.08-1.04l-4.25-4.5a.75.75 0 00-1.08 0l-4.25 4.5a.75.75 0 00.02 1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={expandAll}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Expandir todas as seções"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.77 4.21a.75.75 0 01-.02 1.06L10 9.168 6.29 5.23a.75.75 0 00-1.08 1.04l4.25 4.5a.75.75 0 001.08 0l4.25-4.5a.75.75 0 00-.02-1.06z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M14.77 10.21a.75.75 0 01-.02 1.06L10 15.168l-3.71-3.938a.75.75 0 00-1.08 1.04l4.25 4.5a.75.75 0 001.08 0l4.25-4.5a.75.75 0 00-.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Outline Tree */}
          <main className="flex-1 pb-6">
            <OutlineTree
              blocks={report.blocks}
              onBlocksChange={handleBlocksChange}
              collapsedSections={collapsedSections}
              onToggleSectionCollapse={toggleSectionCollapse}
              onRequestAddBlock={handleRequestAddBlock}
              onEditBlock={setEditingBlockId}
              insertAfterBlockId={insertAfterBlockId}
            />

            <div className="mt-6 flex justify-center">
              <div className="relative w-full max-w-md" ref={sectionSelectorRef}>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowSectionSelector(!showSectionSelector)}
                  className="border-2 border-dashed border-gray-300 hover:border-brand-400 hover:text-brand-700 w-full"
                >
                  + Adicionar Seção
                </Button>

                {showSectionSelector && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      type="button"
                      onClick={handleAddTextSection}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium">Nova Seção</p>
                        <p className="text-xs text-gray-400">Seção de texto com título</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddClosingPage}
                      disabled={hasClosingPage}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
                        hasClosingPage
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        hasClosingPage ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <path d="M9 15l2 2 4-4" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium">Termo de Entrega</p>
                        <p className="text-xs text-gray-400">
                          {hasClosingPage ? 'Já adicionado' : 'Página de encerramento e assinaturas'}
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Right: preview panel (desktop only) */}
        {showDocxPreview && (
          <div className="hidden lg:block flex-1 min-w-0 sticky top-16 h-[calc(100vh-4rem)] py-4">
            <DocxPreviewPanel
              report={report}
              refreshKey={previewRefreshKey}
            />
          </div>
        )}
      </div>

      {/* Block Edit Modal */}
      <BlockEditModal
        block={editingBlock}
        onClose={() => setEditingBlockId(null)}
        onChange={handleBlockDataChange}
        customers={customers}
        onCustomerSelected={handleCustomerSelected}
        aiAvailable={ai.isAvailable && report.status !== 'finalizado'}
        onGenerateSection={(sectionType) => ai.generateSection(id!, sectionType, report.formResponseId)}
        onRegenerateSection={(sectionType, generationId) => ai.regenerateSection(id!, sectionType, generationId)}
        aiLoading={ai.isGenerating}
      />

      {/* Block Selector Modal */}
      <BlockSelector
        isOpen={showBlockSelector}
        onClose={() => {
          setShowBlockSelector(false)
          setInsertAfterBlockId(null)
          setInsertParentId(null)
        }}
        onSelect={handleAddBlock}
        contextLabel={insertTargetSection}
      />

      {/* Save Template Modal */}
      <Modal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        title="Salvar como Template"
        size="sm"
      >
        <div className="p-4 space-y-4">
          <Input
            label="Nome do template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Ex: Relatório Infantil"
          />
          <Input
            label="Descrição (opcional)"
            value={templateDesc}
            onChange={(e) => setTemplateDesc(e.target.value)}
            placeholder="Breve descrição do template"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowSaveTemplate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        versions={versions}
        onRestore={handleRestoreVersion}
      />

      {/* AI Loading Overlay */}
      {ai.isGenerating && ai.progress && (
        <AiLoadingOverlay
          progress={ai.progress}
          onCancel={ai.cancelGeneration}
          sectionNames={sectionNamesForOverlay}
        />
      )}

      {/* AI Usage Dashboard */}
      <AiUsageDashboard
        isOpen={showUsageDashboard}
        onClose={() => setShowUsageDashboard(false)}
      />

      {/* AI Section Checklist */}
      {report && (
        <AiSectionChecklist
          isOpen={showSectionChecklist}
          onClose={() => setShowSectionChecklist(false)}
          onConfirm={handleConfirmGeneration}
          blocks={report.blocks}
          loading={ai.isGenerating}
          customerId={report.customerId}
          currentFormResponseId={report.formResponseId}
        />
      )}

      {/* AI Finalization Modal */}
      <AiFinalizationModal
        isOpen={showFinalizationModal}
        onClose={() => {
          setShowFinalizationModal(false)
          setPendingStatusChange(null)
        }}
        onConfirm={handleConfirmFinalization}
        used={ai.usageSummary?.used ?? 0}
        limit={ai.usageSummary?.limit ?? 0}
        warningCount={warningCount}
      />

    </div>
  )
}
