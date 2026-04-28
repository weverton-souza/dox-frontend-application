import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Block, BlockType, BlockData, Report, ReportStatus, ReportVersion, Customer, ScoreTableTemplate, ChartTemplate } from '@/types'
import { createScoreTableFromTemplate, createChartFromTemplate, isSlateContent, slateContentToPlainText, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, REPORT_STATUS_TRANSITIONS } from '@/types'
import type { TextBlockData, SectionData, InfoBoxData } from '@/types'
import { getReport, updateReport, getExportData } from '@/lib/api/report-api'
import { getCustomers } from '@/lib/api/customer-api'
import { createReportTemplate, getReportTemplates, getScoreTableTemplates, getChartTemplates } from '@/lib/api/template-api'
import { getFormById, getFormResponseById } from '@/lib/api/form-api'
import { useError } from '@/contexts/ErrorContext'
import { createBlock, computeBlockMetas, getDescendantIds } from '@/lib/utils'
import { isNumberingActive, applyNumbering, removeNumbering, maybeRenumber } from '@/lib/section-numbering'
import { useVersioning } from '@/lib/hooks/use-versioning'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import { useReportEditability } from '@/lib/hooks/use-report-editability'
import ReportSummary from '@/components/editor/ReportSummary'
import SectionEditor from '@/components/editor/SectionEditor'
import PreviewModal from '@/components/editor/PreviewModal'
import BlockSelector from '@/components/editor/BlockSelector'
import AddRootBlockModal from '@/components/editor/AddRootBlockModal'
import BlockEditModal from '@/components/editor/BlockEditModal'
import VersionHistoryModal from '@/components/editor/VersionHistoryModal'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import EditorFloatingToolbar from '@/components/editor/EditorFloatingToolbar'
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
import type { ReviewSectionConfig } from '@/components/ai/AiSectionChecklist'
import type { SectionInstruction } from '@/types'
import { reviewText as reviewTextApi } from '@/lib/api/ai-api'
import AiReviewModal from '@/components/ai/AiReviewModal'

interface BlockSelectorState {
  showBlockSelector: boolean
  insertAfterBlockId: string | null
  insertParentId: string | null
  showSectionSelector: boolean
}

interface TemplateModalState {
  showSaveTemplate: boolean
  templateName: string
  templateDesc: string
}

interface AiModalsState {
  showUsageDashboard: boolean
  showFinalizationModal: boolean
  showSectionChecklist: boolean
  reviewingBlockId: string | null
}

export default function ReportEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showError } = useError()

  const [report, setReport] = useState<Report | null>(null)
  const [blockSelector, setBlockSelector] = useState<BlockSelectorState>({
    showBlockSelector: false,
    insertAfterBlockId: null,
    insertParentId: null,
    showSectionSelector: false,
  })
  const updateBlockSelector = (patch: Partial<BlockSelectorState>) => setBlockSelector(prev => ({ ...prev, ...patch }))

  const [templateModal, setTemplateModal] = useState<TemplateModalState>({
    showSaveTemplate: false,
    templateName: '',
    templateDesc: '',
  })
  const updateTemplateModal = (patch: Partial<TemplateModalState>) => setTemplateModal(prev => ({ ...prev, ...patch }))

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [pendingNewBlock, setPendingNewBlock] = useState<{ block: Block; afterBlockId: string | null } | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0)
  const [formProvenanceLabel, setFormProvenanceLabel] = useState<string | null>(null)
  const [formProvenanceId, setFormProvenanceId] = useState<string | null>(null)
  const [scoreTableTemplates, setScoreTableTemplates] = useState<ScoreTableTemplate[]>([])
  const [chartTemplatesState, setChartTemplatesState] = useState<ChartTemplate[]>([])
  const [templateName, setTemplateName] = useState<string | null>(null)

  const { canEdit, canUseAi, reasonText } = useReportEditability(report)

  const saveReportFn = useCallback((data: Report) => updateReport(data), [])
  const { saveStatus, scheduleSave, forceSave } = useAutoSave<Report>(saveReportFn, 1000, canEdit)

  const ai = useAiGeneration()
  const [aiModals, setAiModals] = useState<AiModalsState>({
    showUsageDashboard: false,
    showFinalizationModal: false,
    showSectionChecklist: false,
    reviewingBlockId: null,
  })
  const updateAiModals = (patch: Partial<AiModalsState>) => setAiModals(prev => ({ ...prev, ...patch }))

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
        const sanitizedBlocks = maybeRenumber(loaded.blocks)
        const sanitized = sanitizedBlocks === loaded.blocks ? loaded : { ...loaded, blocks: sanitizedBlocks }
        setReport(sanitized)
        if (sanitizedBlocks !== loaded.blocks) {
          scheduleSave(sanitized)
        }
        setCustomers(customersPage.content)
        setScoreTableTemplates(stTemplates)
        setChartTemplatesState(cTemplates)

        // Load template name if report was created from a template
        if (loaded.templateId) {
          try {
            const rTemplates = await getReportTemplates()
            const tpl = rTemplates.find(t => t.id === loaded.templateId)
            if (tpl) setTemplateName(tpl.name)
          } catch {
            // template name is optional
          }
        }

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
      handleUpdateReport({ blocks: maybeRenumber(blocks) })
    },
    [handleUpdateReport]
  )

  const numberingActive = useMemo(
    () => (report ? isNumberingActive(report.blocks) : false),
    [report]
  )

  const handleToggleNumbering = useCallback(() => {
    if (!report) return
    const newBlocks = numberingActive ? removeNumbering(report.blocks) : applyNumbering(report.blocks)
    handleUpdateReport({ blocks: newBlocks })
  }, [report, numberingActive, handleUpdateReport])

  const handleDuplicateBlock = useCallback(
    (blockId: string) => {
      if (!report) return
      const block = report.blocks.find((b) => b.id === blockId)
      if (!block) return
      const sorted = [...report.blocks].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex((b) => b.id === blockId)
      if (idx === -1) return
      const newBlock: Block = {
        ...block,
        id: crypto.randomUUID(),
        data: JSON.parse(JSON.stringify(block.data)),
      }
      sorted.splice(idx + 1, 0, newBlock)
      handleBlocksChange(sorted.map((b, i) => ({ ...b, order: i })))
    },
    [report, handleBlocksChange]
  )

  const handleRemoveBlock = useCallback(
    (blockId: string) => {
      if (!report) return
      const filtered = report.blocks.filter((b) => b.id !== blockId)
      handleBlocksChange(filtered.map((b, i) => ({ ...b, order: i })))
    },
    [report, handleBlocksChange]
  )

  const handleDeleteSectionCascade = useCallback(
    (sectionId: string) => {
      if (!report) return
      const descendants = getDescendantIds(report.blocks, sectionId)
      const idsToRemove = new Set([sectionId, ...descendants])
      const filtered = report.blocks.filter((b) => !idsToRemove.has(b.id))
      handleBlocksChange(filtered.map((b, i) => ({ ...b, order: i })))
      if (activeItemId && idsToRemove.has(activeItemId)) {
        setActiveItemId(null)
      }
    },
    [report, handleBlocksChange, activeItemId]
  )

  const handleMoveBlocksToSection = useCallback(
    (blockIds: string[], destSectionId: string | null) => {
      if (!report || blockIds.length === 0) return
      const movingIds = new Set(blockIds)

      const movingBlocks = report.blocks
        .filter((b) => movingIds.has(b.id))
        .map((b) => ({ ...b, parentId: destSectionId }))
      const remaining = report.blocks.filter((b) => !movingIds.has(b.id))
      const result = [...remaining, ...movingBlocks]
      handleBlocksChange(result.map((b, i) => ({ ...b, order: i })))
    },
    [report, handleBlocksChange]
  )

  const handleReorderBlocks = useCallback(
    (nextBlocks: Block[]) => {
      handleBlocksChange(nextBlocks)
    },
    [handleBlocksChange]
  )

  const handleDeleteSectionMove = useCallback(
    (sectionId: string, targetSectionId: string) => {
      if (!report) return
      const descendants = new Set(getDescendantIds(report.blocks, sectionId))
      const childBlocks = report.blocks
        .filter((b) => descendants.has(b.id) && b.parentId === sectionId)
        .map((b) => ({ ...b, parentId: targetSectionId }))
      const keptDescendants = report.blocks.filter(
        (b) => descendants.has(b.id) && b.parentId !== sectionId
      )
      const remaining = report.blocks.filter(
        (b) => b.id !== sectionId && !descendants.has(b.id)
      )
      const result = [...remaining, ...childBlocks, ...keptDescendants]
      handleBlocksChange(result.map((b, i) => ({ ...b, order: i })))
      if (activeItemId === sectionId) {
        setActiveItemId(targetSectionId)
      }
    },
    [report, handleBlocksChange, activeItemId]
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

      const newBlock = createBlock(type, 0, undefined, blockSelector.insertParentId)

      // Subseção: usar título contextual quando criado dentro de outra seção
      if (type === 'section' && blockSelector.insertParentId) {
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

      // Tabelas e gráficos: defer — só adiciona ao relatório quando salvar no modal
      if (type === 'score-table' || type === 'chart') {
        setPendingNewBlock({ block: newBlock, afterBlockId: blockSelector.insertAfterBlockId })
        updateBlockSelector({ insertAfterBlockId: null, insertParentId: null })
        return
      }

      const sorted = [...report.blocks].sort((a, b) => a.order - b.order)

      let newBlocks: Block[]
      if (blockSelector.insertAfterBlockId) {
        const afterIndex = sorted.findIndex((b) => b.id === blockSelector.insertAfterBlockId)
        if (afterIndex !== -1) {
          sorted.splice(afterIndex + 1, 0, newBlock)
          newBlocks = sorted.map((b, i) => ({ ...b, order: i }))
        } else {
          newBlocks = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
        }
      } else {
        newBlocks = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
      }

      updateBlockSelector({ insertAfterBlockId: null, insertParentId: null })
      handleBlocksChange(newBlocks)
    },
    [report, handleBlocksChange, blockSelector.insertAfterBlockId, blockSelector.insertParentId, scoreTableTemplates, chartTemplatesState]
  )

  const handleRequestAddBlock = useCallback(
    (afterBlockId: string, parentId?: string | null) => {
      updateBlockSelector({ insertAfterBlockId: afterBlockId, insertParentId: parentId ?? null, showBlockSelector: true })
    },
    []
  )

  const [showAddRootModal, setShowAddRootModal] = useState(false)

  const missingSpecials = useMemo<Array<'cover' | 'identification' | 'closing-page'>>(() => {
    if (!report) return []
    const types = new Set(report.blocks.map((b) => b.type))
    const missing: Array<'cover' | 'identification' | 'closing-page'> = []
    if (!types.has('cover')) missing.push('cover')
    if (!types.has('identification')) missing.push('identification')
    if (!types.has('closing-page')) missing.push('closing-page')
    return missing
  }, [report])

  /**
   * Insere um bloco-raiz no lugar correto da ordem:
   * - cover: topo (ordem 0)
   * - identification: depois da cover (se existir)
   * - closing-page: sempre no final
   * - section: antes do closing-page (se existir)
   */
  const insertRootBlock = useCallback((type: BlockType) => {
    if (!report) return

    const sorted = [...report.blocks].sort((a, b) => a.order - b.order)
    const newBlock = createBlock(type, 0, undefined, null)

    let inserted: Block[]
    if (type === 'cover') {
      inserted = [newBlock, ...sorted]
    } else if (type === 'identification') {
      const coverIdx = sorted.findIndex((b) => b.type === 'cover')
      const insertAt = coverIdx !== -1 ? coverIdx + 1 : 0
      inserted = [...sorted]
      inserted.splice(insertAt, 0, newBlock)
    } else if (type === 'closing-page') {
      inserted = [...sorted, newBlock]
    } else {
      const closingIdx = sorted.findIndex((b) => b.type === 'closing-page')
      inserted = [...sorted]
      if (closingIdx !== -1) {
        inserted.splice(closingIdx, 0, newBlock)
      } else {
        inserted.push(newBlock)
      }
    }

    const newBlocks = inserted.map((b, i) => ({ ...b, order: i }))
    handleBlocksChange(newBlocks)
    updateBlockSelector({ showSectionSelector: false })
    setActiveItemId(newBlock.id)
  }, [report, handleBlocksChange])

  const handleAddTextSection = useCallback(() => {
    if (!report) return

    if (missingSpecials.length > 0) {
      setShowAddRootModal(true)
      return
    }

    insertRootBlock('section')
  }, [report, missingSpecials.length, insertRootBlock])

  const handleSaveTemplate = useCallback(async () => {
    if (!report || !templateModal.templateName.trim()) return

    try {
      await createReportTemplate({
        name: templateModal.templateName.trim(),
        description: templateModal.templateDesc.trim(),
        isDefault: false,
        blocks: report.blocks.map((b) => ({
          type: b.type,
          order: b.order,
          data: JSON.parse(JSON.stringify(b.data)),
        })),
      })
      updateTemplateModal({ showSaveTemplate: false, templateName: '', templateDesc: '' })
    } catch (err) {
      showError(err)
    }
  }, [report, templateModal.templateName, templateModal.templateDesc, showError])

  const handleGenerateDocx = useCallback(async () => {
    if (!report || !id) return

    try {
      const exportReport = await getExportData(id)
      createExportSnapshot('DOCX')
      const { downloadDocx } = await import('@/lib/docx-engine')
      await downloadDocx(exportReport)
    } catch (err) {
      showError(err)
    }
  }, [report, id, createExportSnapshot, showError])

  const handleForceSave = useCallback(() => {
    if (!report) return
    forceSave(report)
  }, [report, forceSave])

  const handleStatusChange = useCallback(
    async (newStatus: ReportStatus) => {
      if (!report || !id) return

      const allowed = REPORT_STATUS_TRANSITIONS[report.status]
      if (!allowed.includes(newStatus)) {
        showError(new Error(`Transição inválida: ${REPORT_STATUS_LABELS[report.status]} → ${REPORT_STATUS_LABELS[newStatus]}.`))
        return
      }

      if (newStatus === 'finalizado') {
        try {
          const fresh = await getReport(id)
          if (fresh.status === 'finalizado') {
            setReport(fresh)
            showError(new Error('Este relatório foi finalizado em outra aba ou sessão.'))
            return
          }
          if (!REPORT_STATUS_TRANSITIONS[fresh.status].includes('finalizado')) {
            setReport(fresh)
            showError(new Error(`O status atual (${REPORT_STATUS_LABELS[fresh.status]}) não permite finalização.`))
            return
          }
          setReport(fresh)
        } catch {
          // se o refetch falhar, segue com o state local
        }
        setPendingStatusChange(newStatus)
        updateAiModals({ showFinalizationModal: true })
        return
      }

      createStatusChangeSnapshot(report.status)
      handleUpdateReport({ status: newStatus })
    },
    [report, id, handleUpdateReport, createStatusChangeSnapshot, showError]
  )

  const handleConfirmFinalization = useCallback(() => {
    if (report && pendingStatusChange) {
      createStatusChangeSnapshot(report.status)
      handleUpdateReport({ status: pendingStatusChange })
    }
    updateAiModals({ showFinalizationModal: false })
    setPendingStatusChange(null)
  }, [report, pendingStatusChange, handleUpdateReport, createStatusChangeSnapshot])

  const handleGenerateFullReport = useCallback(() => {
    if (!report || !id) return
    updateAiModals({ showSectionChecklist: true })
  }, [report, id])

  const [isReviewing, setIsReviewing] = useState(false)
  const [generatingSectionNames, setGeneratingSectionNames] = useState<string[]>([])
  const [versionFeedback, setVersionFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null)

  const handleConfirmGeneration = useCallback(async (selectedSections: SectionInstruction[], formResponseIds: string[], reviewSections?: ReviewSectionConfig[], dataInstructions?: Record<string, string>, selectedDataBlockIds?: string[], includeCustomerData?: boolean) => {
    if (!report || !id) return

    const reviewTitles = new Set(reviewSections?.map(r => r.sectionTitle) || [])
    const generateSections = selectedSections.filter(s => !reviewTitles.has(s.sectionTitle))
    const hasGenerate = generateSections.length > 0
    const hasReview = reviewSections && reviewSections.length > 0

    if (hasGenerate) {
      await createSnapshot('Antes da redação com Assistente')
      setGeneratingSectionNames(generateSections.map(s => s.sectionTitle))
      updateAiModals({ showSectionChecklist: false })
      ai.generateFullReport(
        id,
        formResponseIds,
        report.blocks,
        () => {},
        generateSections,
        dataInstructions,
        selectedDataBlockIds,
        includeCustomerData,
      )
    }

    if (hasReview) {
      setIsReviewing(true)

      for (const reviewConfig of reviewSections!) {
        const sectionBlock = report.blocks.find(
          b => (b.type === 'section' || b.type === 'info-box') &&
            ((b.data as SectionData).title === reviewConfig.sectionTitle ||
             (b.data as InfoBoxData).label === reviewConfig.sectionTitle)
        )
        if (!sectionBlock) continue

        const textChild = report.blocks.find(b => b.parentId === sectionBlock.id && b.type === 'text')
        if (!textChild) continue

        const textData = textChild.data as TextBlockData
        const plainText = isSlateContent(textData.content)
          ? slateContentToPlainText(textData.content)
          : typeof textData.content === 'string' ? textData.content : ''
        if (!plainText.trim()) continue

        try {
          const result = await reviewTextApi(id, {
            text: plainText,
            action: reviewConfig.action,
            sectionType: reviewConfig.sectionTitle,
            formResponseIds: formResponseIds.length > 0 ? formResponseIds : undefined,
          })

          const paragraphs = result.revised.split('\n\n').filter(p => p.trim())
          const slateContent = paragraphs.map(p => ({
            id: Math.random().toString(36).slice(2, 12),
            type: 'p' as const,
            children: [{ text: p.trim() }],
          }))

          const reloaded = await getReport(id)
          if (reloaded) {
            const updatedBlocks = reloaded.blocks.map((b): Block => {
              if (b.id !== textChild.id) return b
              const newData: TextBlockData = {
                ...(b.data as TextBlockData),
                content: slateContent.length > 0 ? slateContent : [{ id: '0', type: 'p' as const, children: [{ text: '' }] }],
              }
              return { ...b, data: newData, generatedByAi: true }
            })
            const updated: Report = { ...reloaded, blocks: updatedBlocks }
            await updateReport(updated)
            setReport(updated)
            setPreviewRefreshKey(k => k + 1)
          }
        } catch {
          // review failed for this section, continue with next
        }
      }

      setIsReviewing(false)
      updateAiModals({ showSectionChecklist: false })

      if (!hasGenerate) {
        const reloaded = await getReport(id)
        if (reloaded) {
          setReport(reloaded)
          setPreviewRefreshKey(k => k + 1)
        }
      }
    }

    if (!hasGenerate && !hasReview) {
      updateAiModals({ showSectionChecklist: false })
    }
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

  const showAiButton = ai.isAvailable && canUseAi
  const fillableCount = report ? countFillableBlocks(report.blocks) : 0
  const warningCount = report?.blocks.filter(b => b.skippedByAi).length ?? 0

  const sectionNamesForOverlay = useMemo(() => {
    if (generatingSectionNames.length > 0) return generatingSectionNames
    if (!report) return []
    return report.blocks
      .filter(b => b.type === 'section' || b.type === 'info-box')
      .sort((a, b) => a.order - b.order)
      .map(b => {
        const d = b.data as { title?: string; label?: string }
        return d.title || d.label || 'Seção'
      })
  }, [report, generatingSectionNames])

  const handleRestoreVersion = useCallback(
    (version: ReportVersion) => {
      handleUpdateReport({
        customerName: version.customerName,
        blocks: JSON.parse(JSON.stringify(version.blocks)),
      })
    },
    [handleUpdateReport]
  )

  const handleOpenVersionHistory = useCallback(() => {
    refreshVersions()
    setShowVersionHistory(true)
  }, [refreshVersions])

  // Summary items in order — roots of the summary (sections + identification + closing-page)
  const summaryItemIds = useMemo(() => {
    if (!report) return [] as string[]
    const collect: string[] = []
    const roots = report.blocks
      .filter((b) => (b.parentId ?? null) === null && (b.type === 'section' || b.type === 'identification' || b.type === 'closing-page'))
      .sort((a, b) => a.order - b.order)
    function walk(id: string) {
      collect.push(id)
      const children = report!.blocks
        .filter((b) => b.parentId === id && b.type === 'section')
        .sort((a, b) => a.order - b.order)
      for (const c of children) walk(c.id)
    }
    for (const r of roots) walk(r.id)
    return collect
  }, [report])

  // Initialize active item when report loads
  useEffect(() => {
    if (!report) return
    if (activeItemId && summaryItemIds.includes(activeItemId)) return
    setActiveItemId(summaryItemIds[0] ?? null)
  }, [report, activeItemId, summaryItemIds])

  // Sorted blocks + metas (memoized)
  const sortedBlocks = useMemo(() => {
    if (!report) return []
    return [...report.blocks].sort((a, b) => a.order - b.order)
  }, [report])

  const blockMetas = useMemo(() => computeBlockMetas(sortedBlocks), [sortedBlocks])

  // Compute target section name for BlockSelector context
  const insertTargetSection = useMemo(() => {
    if (!blockSelector.insertAfterBlockId || !report) return undefined
    const meta = blockMetas[blockSelector.insertAfterBlockId]
    return meta?.section || undefined
  }, [blockSelector.insertAfterBlockId, report, blockMetas])

  // Find the block being edited (includes pending new blocks not yet saved)
  const editingBlock = useMemo(() => {
    if (pendingNewBlock) return pendingNewBlock.block
    if (!editingBlockId || !report) return null
    return report.blocks.find((b) => b.id === editingBlockId) ?? null
  }, [editingBlockId, report, pendingNewBlock])

  const reviewingBlockText = useMemo(() => {
    if (!aiModals.reviewingBlockId || !report) return ''
    const block = report.blocks.find((b) => b.id === aiModals.reviewingBlockId)
    if (!block || block.type !== 'text') return ''
    const data = block.data as TextBlockData
    if (isSlateContent(data.content)) return slateContentToPlainText(data.content)
    return typeof data.content === 'string' ? data.content : ''
  }, [aiModals.reviewingBlockId, report])

  const reviewingSectionType = useMemo(() => {
    if (!aiModals.reviewingBlockId || !report) return undefined
    const block = report.blocks.find((b) => b.id === aiModals.reviewingBlockId)
    if (!block?.parentId) return undefined
    const parent = report.blocks.find((b) => b.id === block.parentId)
    if (parent?.type === 'section') {
      const parentData = parent.data as { title?: string }
      return parentData.title || undefined
    }
    return undefined
  }, [aiModals.reviewingBlockId, report])

  const handleAcceptReview = useCallback((revisedText: string) => {
    if (!aiModals.reviewingBlockId || !report) return
    const updatedBlocks = report.blocks.map((b): Block => {
      if (b.id !== aiModals.reviewingBlockId) return b
      const paragraphs = revisedText.split('\n\n').filter((p) => p.trim())
      const slateContent = paragraphs.map((p) => ({
        id: Math.random().toString(36).slice(2, 12),
        type: 'p' as const,
        children: [{ text: p.trim() }],
      }))
      const textData = b.data as TextBlockData
      const newData: TextBlockData = {
        ...textData,
        content: slateContent.length > 0 ? slateContent : [{ id: '0', type: 'p' as const, children: [{ text: '' }] }],
      }
      return { ...b, data: newData }
    })
    const updated: Report = { ...report, blocks: updatedBlocks }
    setReport(updated)
    scheduleSave(updated)
    setPreviewRefreshKey((k) => k + 1)
  }, [aiModals.reviewingBlockId, report, scheduleSave])

  if (!report) {
    return (
      <div className="min-h-[calc(100vh)] bg-gray-100 flex flex-col">
        {/* Skeleton header */}
        <div className="bg-white border-b border-gray-200 h-14 lg:h-16 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-full flex items-center gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="flex-1" />
            <div className="h-7 bg-gray-200 rounded-full w-24" />
            <div className="hidden md:block w-px h-5 bg-gray-200" />
            <div className="hidden md:flex gap-1">
              <div className="w-7 h-7 rounded-lg bg-gray-200" />
              <div className="w-7 h-7 rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>
        {/* Skeleton body */}
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 animate-pulse">
          <div className="space-y-3">
            {[180, 56, 56, 120, 56, 56, 80].map((h, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4" style={{ height: h }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 rounded bg-gray-200" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
                {h > 60 && <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />}
                {h > 100 && <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />}
              </div>
            ))}
          </div>
        </div>
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
      {/* Header — Figma-style centered */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5">
          <div className="flex items-center justify-between">
            {/* Left: back + save status */}
            <div className="flex items-center gap-2 w-40 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleForceSave()
                  navigate('/')
                }}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/80 text-gray-500 hover:text-gray-700 transition-colors"
                title="Voltar"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
              </button>
              <SaveStatusIndicator status={saveStatus} showLabel={false} />
            </div>

            {/* Center: template name · client name · status badge */}
            <div className="flex items-center gap-2 min-w-0 justify-center flex-1">
              {templateName && (
                <>
                  <span className="text-xs text-gray-400 truncate hidden sm:inline">{templateName}</span>
                  <span className="text-gray-300 hidden sm:inline">—</span>
                </>
              )}
              <input
                type="text"
                value={report.customerName || ''}
                onChange={(e) => handleUpdateReport({ customerName: e.target.value })}
                placeholder="Nome do cliente"
                readOnly={!canEdit}
                title={canEdit ? undefined : reasonText ?? undefined}
                className={`text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-0 text-center min-w-0 max-w-xs truncate placeholder:text-gray-400 ${canEdit ? 'text-gray-700' : 'text-gray-500 cursor-not-allowed'}`}
              />
              <span className="text-gray-300">·</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${REPORT_STATUS_COLORS[report.status].bg} ${REPORT_STATUS_COLORS[report.status].text}`}>
                {REPORT_STATUS_LABELS[report.status]}
              </span>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {showAiButton && fillableCount > 0 && (
                <button
                  type="button"
                  onClick={handleGenerateFullReport}
                  disabled={ai.isGenerating}
                  className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-xs font-medium disabled:opacity-50"
                  title="Redigir com Assistente"
                >
                  {ai.isGenerating ? (
                    <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <AiSparkleIcon size={14} />
                  )}
                  Assistente
                </button>
              )}

              <button
                type="button"
                onClick={handleGenerateDocx}
                className={
                  report.status === 'finalizado'
                    ? 'h-8 flex items-center gap-1.5 px-3 rounded-full bg-brand-700 text-white hover:bg-brand-800 transition-colors text-xs font-medium'
                    : 'h-8 flex items-center gap-1.5 px-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs font-medium'
                }
                title={
                  report.status === 'finalizado'
                    ? 'Baixar .docx oficial'
                    : 'Baixar .docx com marca d’água — versão preliminar'
                }
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                {report.status === 'finalizado'
                  ? 'Baixar'
                  : report.status === 'em_revisao'
                    ? 'Baixar revisão'
                    : 'Baixar rascunho'}
              </button>

              {report.status !== 'finalizado' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('finalizado')}
                  className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors text-xs font-medium"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-4 lg:gap-8 w-full px-4 sm:px-6 lg:px-8">
        {/* Floating toolbar — left column */}
        <div className="hidden lg:flex shrink-0 w-12 pt-12">
          <div className="sticky top-28 h-fit z-30">
            <EditorFloatingToolbar
              onSaveVersion={async () => {
                const created = await createManualSnapshot()
                if (created) {
                  setVersionFeedback({ type: 'success', message: 'Versão salva com sucesso' })
                } else {
                  setVersionFeedback({ type: 'info', message: 'Sem alterações desde a última versão' })
                }
                setTimeout(() => setVersionFeedback(null), 3000)
              }}
              onOpenVersionHistory={handleOpenVersionHistory}
              onSaveAsTemplate={() => updateTemplateModal({ showSaveTemplate: true })}
              onTogglePreview={() => setShowPreviewModal(true)}
              showPreview={showPreviewModal}
              onToggleNumbering={handleToggleNumbering}
              numberingActive={numberingActive}
            />
          </div>
        </div>

        {/* Left: blocks */}
        <div className="min-w-0 flex flex-col flex-1">
          {/* Read-only banner (status finalizado) */}
          {!canEdit && reasonText && (
            <div className="pt-3">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{reasonText}</span>
              </div>
            </div>
          )}
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
                  onClick={() => updateAiModals({ showUsageDashboard: true })}
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
            </div>
          </div>

          {/* Document view */}
          <main className="flex-1 pb-6">
            <div className="flex gap-8 lg:gap-12">
              <ReportSummary
                blocks={report.blocks}
                activeItemId={activeItemId}
                onSelect={setActiveItemId}
                onRequestAddSection={handleAddTextSection}
                onReorder={handleReorderBlocks}
                locked={report.isStructureLocked || !canEdit}
              />
              <SectionEditor
                blocks={report.blocks}
                activeItemId={activeItemId}
                blockMetas={blockMetas}
                onEditBlock={setEditingBlockId}
                onDuplicateBlock={handleDuplicateBlock}
                onRemoveBlock={handleRemoveBlock}
                onChangeBlock={handleBlockDataChange}
                onRequestAddBlock={handleRequestAddBlock}
                onReviewBlock={ai.isAvailable && canUseAi ? (id: string) => updateAiModals({ reviewingBlockId: id }) : undefined}
                onDeleteSectionCascade={handleDeleteSectionCascade}
                onDeleteSectionMove={handleDeleteSectionMove}
                onMoveBlocksToSection={handleMoveBlocksToSection}
                customers={customers}
                onCustomerSelected={handleCustomerSelected}
                locked={report.isStructureLocked || !canEdit}
                readOnly={!canEdit}
              />
            </div>
          </main>
        </div>

      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        report={report}
        refreshKey={previewRefreshKey}
      />

      {/* Block Edit Modal */}
      <BlockEditModal
        block={editingBlock}
        onClose={() => {
          setPendingNewBlock(null)
          setEditingBlockId(null)
        }}
        onChange={(blockId, data) => {
          if (pendingNewBlock && report) {
            // Bloco novo: adicionar ao relatório com os dados editados
            const finalBlock = { ...pendingNewBlock.block, data }
            const sorted = [...report.blocks].sort((a, b) => a.order - b.order)

            let newBlocks: Block[]
            if (pendingNewBlock.afterBlockId) {
              const afterIndex = sorted.findIndex((b) => b.id === pendingNewBlock.afterBlockId)
              if (afterIndex !== -1) {
                sorted.splice(afterIndex + 1, 0, finalBlock)
                newBlocks = sorted.map((b, i) => ({ ...b, order: i }))
              } else {
                newBlocks = [...sorted, finalBlock].map((b, i) => ({ ...b, order: i }))
              }
            } else {
              newBlocks = [...sorted, finalBlock].map((b, i) => ({ ...b, order: i }))
            }

            handleBlocksChange(newBlocks)
            setPreviewRefreshKey((k) => k + 1)
            setPendingNewBlock(null)
          } else {
            handleBlockDataChange(blockId, data)
          }
        }}
        customers={customers}
        onCustomerSelected={handleCustomerSelected}
        aiAvailable={ai.isAvailable && canUseAi}
        onGenerateSection={(sectionType) => ai.generateSection(id!, sectionType, report.formResponseId)}
        onRegenerateSection={(sectionType, generationId) => ai.regenerateSection(id!, sectionType, generationId)}
        aiLoading={ai.isGenerating}
        reportId={id}
        readOnly={!canEdit}
      />

      {/* Block Selector Modal */}
      <BlockSelector
        isOpen={blockSelector.showBlockSelector}
        onClose={() => {
          updateBlockSelector({ showBlockSelector: false, insertAfterBlockId: null, insertParentId: null })
        }}
        onSelect={handleAddBlock}
        contextLabel={insertTargetSection}
      />

      {/* Add Root Block Modal */}
      <AddRootBlockModal
        isOpen={showAddRootModal}
        onClose={() => setShowAddRootModal(false)}
        availableSpecials={missingSpecials}
        onSelect={insertRootBlock}
      />

      {/* Save Template Modal */}
      <Modal
        isOpen={templateModal.showSaveTemplate}
        onClose={() => updateTemplateModal({ showSaveTemplate: false })}
        title="Salvar como Template"
        size="sm"
      >
        <div className="p-4 space-y-4">
          <Input
            label="Nome do template"
            value={templateModal.templateName}
            onChange={(e) => updateTemplateModal({ templateName: e.target.value })}
            placeholder="Ex: Relatório Infantil"
          />
          <Input
            label="Descrição (opcional)"
            value={templateModal.templateDesc}
            onChange={(e) => updateTemplateModal({ templateDesc: e.target.value })}
            placeholder="Breve descrição do template"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => updateTemplateModal({ showSaveTemplate: false })}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateModal.templateName.trim()}>
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
        isOpen={aiModals.showUsageDashboard}
        onClose={() => updateAiModals({ showUsageDashboard: false })}
      />

      {/* AI Section Checklist */}
      {report && (
        <AiSectionChecklist
          isOpen={aiModals.showSectionChecklist}
          onClose={() => updateAiModals({ showSectionChecklist: false })}
          onConfirm={handleConfirmGeneration}
          blocks={report.blocks}
          loading={ai.isGenerating || isReviewing}
          customerId={report.customerId}
          currentFormResponseId={report.formResponseId}
        />
      )}

      {/* AI Review Modal */}
      {report && (
        <AiReviewModal
          isOpen={!!aiModals.reviewingBlockId && !!reviewingBlockText}
          onClose={() => updateAiModals({ reviewingBlockId: null })}
          reportId={report.id}
          customerId={report.customerId}
          blockText={reviewingBlockText}
          sectionType={reviewingSectionType}
          onAccept={handleAcceptReview}
        />
      )}

      {/* Finalization Modal */}
      <AiFinalizationModal
        isOpen={aiModals.showFinalizationModal}
        onClose={() => {
          updateAiModals({ showFinalizationModal: false })
          setPendingStatusChange(null)
        }}
        onConfirm={handleConfirmFinalization}
        used={ai.usageSummary?.used ?? 0}
        limit={ai.usageSummary?.limit ?? 0}
        warningCount={warningCount}
        hasAi={report.blocks.some(b => b.generatedByAi || b.skippedByAi)}
        customerName={report.customerName || undefined}
        blockCount={report.blocks.length}
      />

      {/* Version feedback modal */}
      <Modal isOpen={!!versionFeedback} onClose={() => setVersionFeedback(null)} title="" size="sm">
        <div className="px-5 pb-5 pt-2 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
            versionFeedback?.type === 'success' ? 'bg-emerald-50' : 'bg-amber-50'
          }`}>
            {versionFeedback?.type === 'success' ? (
              <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-[15px] font-medium text-gray-900">{versionFeedback?.message}</p>
          <Button onClick={() => setVersionFeedback(null)} className="mt-4 w-full">
            OK
          </Button>
        </div>
      </Modal>

    </div>
  )
}
