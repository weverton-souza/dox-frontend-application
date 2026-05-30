import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Block, BlockType, BlockData, ReportTemplate, TemplateBlock, ScoreTableTemplate, ChartTemplate } from '@/types'
import { createScoreTableFromTemplate, createChartFromTemplate } from '@/types'
import {
  getReportTemplateById,
  createReportTemplate,
  updateReportTemplate,
  getScoreTableTemplates,
  getChartTemplates,
} from '@/lib/api/template-api'
import { useError } from '@/contexts/ErrorContext'
import { createBlock, computeBlockMetas, getDescendantIds } from '@/lib/utils'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import ReportSummary from '@/components/editor/ReportSummary'
import SectionEditor from '@/components/editor/SectionEditor'
import BlockSelector from '@/components/editor/BlockSelector'
import BlockEditModal from '@/components/editor/BlockEditModal'
import AddRootBlockModal from '@/components/editor/AddRootBlockModal'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EditorPageHeader from '@/components/editor/EditorPageHeader'
import Spinner from '@/components/ui/Spinner'

// ========== Conversions: TemplateBlock <-> Block ==========

function templateBlocksToBlocks(tbs: TemplateBlock[]): Block[] {
  return tbs.map((tb) => ({
    id: tb.id || crypto.randomUUID(),
    type: tb.type,
    parentId: tb.parentId ?? null,
    order: tb.order,
    data: tb.data,
    collapsed: false,
  }))
}

function blocksToTemplateBlocks(blocks: Block[]): TemplateBlock[] {
  return blocks.map((b) => ({
    id: b.id,
    type: b.type,
    parentId: b.parentId,
    order: b.order,
    data: b.data,
  }))
}

// ========== Block Selector State ==========

interface BlockSelectorState {
  showBlockSelector: boolean
  insertAfterBlockId: string | null
  insertParentId: string | null
}

// ========== Component ==========

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showError } = useError()
  const isNew = !id || id === 'new'

  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [pendingNewBlock, setPendingNewBlock] = useState<{ block: Block; afterBlockId: string | null } | null>(null)
  const [blockSelector, setBlockSelector] = useState<BlockSelectorState>({
    showBlockSelector: false,
    insertAfterBlockId: null,
    insertParentId: null,
  })
  const updateBlockSelector = (patch: Partial<BlockSelectorState>) => setBlockSelector(prev => ({ ...prev, ...patch }))

  const [showAddRootModal, setShowAddRootModal] = useState(false)
  const [scoreTableTemplates, setScoreTableTemplates] = useState<ScoreTableTemplate[]>([])
  const [chartTemplates, setChartTemplates] = useState<ChartTemplate[]>([])
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaved, setIsSaved] = useState(!isNew)
  const templateIdRef = useRef<string | null>(null)

  const isMaster = template?.isMaster ?? false

  // ========== Save ==========

  const saveToBackend = useCallback(async (t: ReportTemplate, b: Block[]): Promise<string | null> => {
    const templateBlocks = blocksToTemplateBlocks(b)
    const name = t.name.trim() || 'Template sem título'
    const payload: ReportTemplate = { ...t, name, blocks: templateBlocks }

    try {
      const saved = await (payload.id
        ? updateReportTemplate(payload)
        : createReportTemplate(payload))

      if (!payload.id && saved.id) {
        templateIdRef.current = saved.id
        setTemplate(prev => prev ? { ...prev, id: saved.id, name } : prev)
        setIsSaved(true)
      }
      setIsDirty(false)
      return saved.id
    } catch (err) {
      showError(err)
      return null
    }
  }, [showError])

  const saveFn = useCallback(async (data: { template: ReportTemplate; blocks: Block[] }) => {
    const id = templateIdRef.current
    if (!id) return
    await saveToBackend({ ...data.template, id }, data.blocks)
  }, [saveToBackend])

  const { saveStatus, scheduleSave } = useAutoSave(saveFn)

  const triggerSave = useCallback((t: ReportTemplate, b: Block[]) => {
    const id = templateIdRef.current
    if (isMaster || !t.name.trim() || !id) return
    scheduleSave({ template: { ...t, id }, blocks: b })
  }, [scheduleSave, isMaster])

  const handleFirstSave = useCallback(async () => {
    if (!template) return
    const savedId = await saveToBackend(template, blocks)
    if (savedId && !template.id) {
      navigate(`/templates/${savedId}`, { replace: true })
    }
  }, [template, blocks, saveToBackend, navigate])

  // ========== Load ==========

  useEffect(() => {
    async function load() {
      try {
        const [stTemplates, cTemplates] = await Promise.all([
          getScoreTableTemplates(),
          getChartTemplates(),
        ])
        setScoreTableTemplates(stTemplates)
        setChartTemplates(cTemplates)

        if (isNew) {
          const blank: ReportTemplate = {
            id: '',
            name: 'Template sem título',
            description: '',
            blocks: [],
            isDefault: false,
            isLocked: false,
            isMaster: false,
          }
          setTemplate(blank)
          setBlocks([])
        } else {
          const loaded = await getReportTemplateById(id!)
          if (!loaded) {
            navigate('/reports')
            return
          }
          setTemplate(loaded)
          templateIdRef.current = loaded.id
          setBlocks(templateBlocksToBlocks(loaded.blocks))
        }
      } catch (err) {
        showError(err)
        navigate('/reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isNew, navigate, showError])

  // ========== Central blocks setter ==========

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setIsDirty(true)
    setBlocks(newBlocks)
    if (template) triggerSave(template, newBlocks)
  }, [template, triggerSave])

  // ========== Header field handlers ==========

  const handleNameChange = useCallback((name: string) => {
    setIsDirty(true)
    setTemplate(prev => {
      if (!prev) return prev
      const updated = { ...prev, name }
      triggerSave(updated, blocks)
      return updated
    })
  }, [blocks, triggerSave])

  const handleDescChange = useCallback((description: string) => {
    setIsDirty(true)
    setTemplate(prev => {
      if (!prev) return prev
      const updated = { ...prev, description }
      triggerSave(updated, blocks)
      return updated
    })
  }, [blocks, triggerSave])

  const handleBlockDataChange = useCallback((blockId: string, data: BlockData) => {
    setIsDirty(true)
    setBlocks(prev => {
      const updated = prev.map(b => b.id === blockId ? { ...b, data } : b)
      if (template) triggerSave(template, updated)
      return updated
    })
  }, [template, triggerSave])

  // ========== Block / section handlers (ported para layout novo) ==========

  const handleReorderBlocks = useCallback((nextBlocks: Block[]) => {
    handleBlocksChange(nextBlocks)
  }, [handleBlocksChange])

  const handleDuplicateBlock = useCallback((blockId: string) => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return
    const sorted = [...blocks].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((b) => b.id === blockId)
    if (idx === -1) return
    const newBlock: Block = {
      ...block,
      id: crypto.randomUUID(),
      data: JSON.parse(JSON.stringify(block.data)),
    }
    sorted.splice(idx + 1, 0, newBlock)
    handleBlocksChange(sorted.map((b, i) => ({ ...b, order: i })))
  }, [blocks, handleBlocksChange])

  const handleRemoveBlock = useCallback((blockId: string) => {
    const filtered = blocks.filter((b) => b.id !== blockId)
    handleBlocksChange(filtered.map((b, i) => ({ ...b, order: i })))
  }, [blocks, handleBlocksChange])

  const handleDeleteSectionCascade = useCallback((sectionId: string) => {
    const descendants = getDescendantIds(blocks, sectionId)
    const idsToRemove = new Set([sectionId, ...descendants])
    const filtered = blocks.filter((b) => !idsToRemove.has(b.id))
    handleBlocksChange(filtered.map((b, i) => ({ ...b, order: i })))
    if (activeItemId && idsToRemove.has(activeItemId)) setActiveItemId(null)
  }, [blocks, handleBlocksChange, activeItemId])

  const handleDeleteSectionMove = useCallback((sectionId: string, targetSectionId: string) => {
    const descendants = new Set(getDescendantIds(blocks, sectionId))
    const childBlocks = blocks
      .filter((b) => descendants.has(b.id) && b.parentId === sectionId)
      .map((b) => ({ ...b, parentId: targetSectionId }))
    const keptDescendants = blocks.filter((b) => descendants.has(b.id) && b.parentId !== sectionId)
    const remaining = blocks.filter((b) => b.id !== sectionId && !descendants.has(b.id))
    const result = [...remaining, ...childBlocks, ...keptDescendants]
    handleBlocksChange(result.map((b, i) => ({ ...b, order: i })))
    if (activeItemId === sectionId) setActiveItemId(targetSectionId)
  }, [blocks, handleBlocksChange, activeItemId])

  const handleMoveBlocksToSection = useCallback((blockIds: string[], destSectionId: string | null) => {
    if (blockIds.length === 0) return
    const movingIds = new Set(blockIds)
    const movingBlocks = blocks
      .filter((b) => movingIds.has(b.id))
      .map((b) => ({ ...b, parentId: destSectionId }))
    const remaining = blocks.filter((b) => !movingIds.has(b.id))
    const result = [...remaining, ...movingBlocks]
    handleBlocksChange(result.map((b, i) => ({ ...b, order: i })))
  }, [blocks, handleBlocksChange])

  const handleAddBlock = useCallback((type: BlockType, templateId?: string) => {
    const newBlock = createBlock(type, 0, undefined, blockSelector.insertParentId)

    if (type === 'section' && blockSelector.insertParentId) {
      ;(newBlock.data as { title: string }).title = 'Subseção'
    }

    if (type === 'score-table' && templateId) {
      const tpl = scoreTableTemplates.find(t => t.id === templateId)
      if (tpl) newBlock.data = createScoreTableFromTemplate(tpl)
    }

    if (type === 'chart' && templateId) {
      const tpl = chartTemplates.find(t => t.id === templateId)
      if (tpl) newBlock.data = createChartFromTemplate(tpl)
    }

    if (type === 'score-table' || type === 'chart') {
      setPendingNewBlock({ block: newBlock, afterBlockId: blockSelector.insertAfterBlockId })
      updateBlockSelector({ insertAfterBlockId: null, insertParentId: null })
      return
    }

    const sorted = [...blocks].sort((a, b) => a.order - b.order)
    let newBlocks: Block[]
    if (blockSelector.insertAfterBlockId) {
      const afterIdx = sorted.findIndex(b => b.id === blockSelector.insertAfterBlockId)
      if (afterIdx !== -1) {
        sorted.splice(afterIdx + 1, 0, newBlock)
        newBlocks = sorted.map((b, i) => ({ ...b, order: i }))
      } else {
        newBlocks = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
      }
    } else {
      newBlocks = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
    }

    updateBlockSelector({ insertAfterBlockId: null, insertParentId: null })
    handleBlocksChange(newBlocks)
  }, [blockSelector.insertAfterBlockId, blockSelector.insertParentId, scoreTableTemplates, chartTemplates, blocks, handleBlocksChange])

  const handleRequestAddBlock = useCallback((afterBlockId: string, parentId?: string | null) => {
    updateBlockSelector({ insertAfterBlockId: afterBlockId, insertParentId: parentId ?? null, showBlockSelector: true })
  }, [])

  const missingSpecials = useMemo<Array<'cover' | 'identification' | 'closing-page'>>(() => {
    const types = new Set(blocks.map((b) => b.type))
    const missing: Array<'cover' | 'identification' | 'closing-page'> = []
    if (!types.has('cover')) missing.push('cover')
    if (!types.has('identification')) missing.push('identification')
    if (!types.has('closing-page')) missing.push('closing-page')
    return missing
  }, [blocks])

  const insertRootBlock = useCallback((type: BlockType) => {
    const sorted = [...blocks].sort((a, b) => a.order - b.order)
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
      if (closingIdx !== -1) inserted.splice(closingIdx, 0, newBlock)
      else inserted.push(newBlock)
    }

    handleBlocksChange(inserted.map((b, i) => ({ ...b, order: i })))
    setShowAddRootModal(false)
    setActiveItemId(newBlock.id)
  }, [blocks, handleBlocksChange])

  const handleAddTextSection = useCallback(() => {
    if (missingSpecials.length > 0) {
      setShowAddRootModal(true)
      return
    }
    insertRootBlock('section')
  }, [missingSpecials.length, insertRootBlock])

  const handleForceSave = useCallback(async () => {
    if (!template || isMaster) return
    if (!isDirty && saveStatus === 'saved') return
    const id = templateIdRef.current
    if (id) {
      await saveToBackend({ ...template, id }, blocks)
    } else {
      await handleFirstSave()
    }
  }, [template, blocks, isMaster, isDirty, saveStatus, saveToBackend, handleFirstSave])

  // ========== Pending block (score-table / chart defer) ==========

  const handlePendingSave = useCallback((_blockId: string, data: BlockData) => {
    if (!pendingNewBlock) return

    const updated = { ...pendingNewBlock.block, data }
    const sorted = [...blocks].sort((a, b) => a.order - b.order)

    if (pendingNewBlock.afterBlockId) {
      const afterIdx = sorted.findIndex(b => b.id === pendingNewBlock.afterBlockId)
      if (afterIdx !== -1) sorted.splice(afterIdx + 1, 0, updated)
      else sorted.push(updated)
    } else {
      sorted.push(updated)
    }

    handleBlocksChange(sorted.map((b, i) => ({ ...b, order: i })))
    setPendingNewBlock(null)
    setEditingBlockId(null)
  }, [pendingNewBlock, blocks, handleBlocksChange])

  // ========== Derived ==========

  const summaryItemIds = useMemo(() => {
    const collect: string[] = []
    const roots = blocks
      .filter((b) => (b.parentId ?? null) === null && (b.type === 'section' || b.type === 'identification' || b.type === 'closing-page'))
      .sort((a, b) => a.order - b.order)
    function walk(rootId: string) {
      collect.push(rootId)
      const children = blocks
        .filter((b) => b.parentId === rootId && b.type === 'section')
        .sort((a, b) => a.order - b.order)
      for (const c of children) walk(c.id)
    }
    for (const r of roots) walk(r.id)
    return collect
  }, [blocks])

  useEffect(() => {
    if (activeItemId && summaryItemIds.includes(activeItemId)) return
    setActiveItemId(summaryItemIds[0] ?? null)
  }, [activeItemId, summaryItemIds])

  const sortedBlocks = useMemo(() => [...blocks].sort((a, b) => a.order - b.order), [blocks])
  const blockMetas = useMemo(() => computeBlockMetas(sortedBlocks), [sortedBlocks])

  const editingBlock = editingBlockId
    ? blocks.find(b => b.id === editingBlockId) ?? pendingNewBlock?.block ?? null
    : pendingNewBlock?.block ?? null

  // ========== Render ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!template) return null

  return (
    <div
      className="min-h-[calc(100vh)] bg-gray-100 flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        backgroundAttachment: 'fixed',
      }}
    >
      <EditorPageHeader
        onBack={() => {
          if (!isMaster && (saveStatus === 'unsaved' || (isDirty && !isSaved))) {
            setShowLeaveConfirm(true)
            return
          }
          navigate('/', { state: { activeTab: 'templates', templateFilter: 'custom' } })
        }}
        saveStatus={isDirty && !isSaved ? 'unsaved' : saveStatus}
        showSaveStatus={!isMaster}
        center={
          <input
            type="text"
            value={template.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Template sem título"
            disabled={isMaster}
            className="text-sm font-medium text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-0 text-center min-w-0 max-w-xs truncate placeholder:text-gray-400 disabled:cursor-default"
          />
        }
        right={
          <>
            {isMaster && (
              <span className="text-[10px] font-medium uppercase bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Somente leitura
              </span>
            )}
            {!isMaster && !isSaved && (
              <button
                type="button"
                onClick={handleFirstSave}
                className="h-9 flex items-center gap-2 px-4 rounded-full bg-brand-700 text-white hover:bg-brand-800 transition-colors shadow-sm shrink-0 text-sm font-medium"
              >
                Salvar
              </button>
            )}
          </>
        }
      />

      {/* Content */}
      <div className="flex-1 flex w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="min-w-0 flex flex-col flex-1">
          {/* Description */}
          <div className="pb-4">
            <input
              type="text"
              value={template.description}
              onChange={(e) => handleDescChange(e.target.value)}
              placeholder="Descrição do template (opcional)"
              disabled={isMaster}
              className="w-full text-sm text-gray-500 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-gray-400 disabled:cursor-default"
            />
          </div>

          {/* Document view */}
          <main className="flex-1 pb-6">
            <div className="flex gap-8 lg:gap-12">
              <ReportSummary
                blocks={blocks}
                activeItemId={activeItemId}
                onSelect={setActiveItemId}
                onRequestAddSection={handleAddTextSection}
                onReorder={isMaster ? undefined : handleReorderBlocks}
                locked={isMaster}
                saveStatus={isMaster ? undefined : (isDirty && !isSaved ? 'unsaved' : saveStatus)}
              />
              <SectionEditor
                blocks={blocks}
                activeItemId={activeItemId}
                blockMetas={blockMetas}
                onEditBlock={setEditingBlockId}
                onDuplicateBlock={handleDuplicateBlock}
                onRemoveBlock={handleRemoveBlock}
                onChangeBlock={handleBlockDataChange}
                onRequestAddBlock={handleRequestAddBlock}
                onDeleteSectionCascade={handleDeleteSectionCascade}
                onDeleteSectionMove={handleDeleteSectionMove}
                onMoveBlocksToSection={handleMoveBlocksToSection}
                locked={isMaster}
                readOnly={isMaster}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Block Selector Modal */}
      <BlockSelector
        isOpen={blockSelector.showBlockSelector}
        onClose={() => updateBlockSelector({ showBlockSelector: false, insertAfterBlockId: null, insertParentId: null })}
        onSelect={handleAddBlock}
      />

      {/* Add Root Block Modal */}
      <AddRootBlockModal
        isOpen={showAddRootModal}
        onClose={() => setShowAddRootModal(false)}
        availableSpecials={missingSpecials}
        onSelect={insertRootBlock}
      />

      {/* Block Edit Modal */}
      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          onClose={() => { setEditingBlockId(null); setPendingNewBlock(null) }}
          onChange={pendingNewBlock ? handlePendingSave : handleBlockDataChange}
        />
      )}

      {/* Leave confirmation modal */}
      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Alterações não salvas"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Você tem alterações que ainda não foram salvas. O que deseja fazer?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowLeaveConfirm(false)
                navigate('/', { state: { activeTab: 'templates', templateFilter: 'custom' } })
              }}
            >
              Não salvar
            </Button>
            <Button
              onClick={async () => {
                await handleForceSave()
                setShowLeaveConfirm(false)
                navigate('/', { state: { activeTab: 'templates', templateFilter: 'custom' } })
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
