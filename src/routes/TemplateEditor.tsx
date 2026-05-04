import { useState, useEffect, useCallback, useRef } from 'react'
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
import { createBlock } from '@/lib/utils'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import { useClickOutside } from '@/lib/hooks/use-click-outside'
import OutlineTree from '@/components/editor/OutlineTree'
import BlockSelector from '@/components/editor/BlockSelector'
import BlockEditModal from '@/components/editor/BlockEditModal'
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
  showSectionSelector: boolean
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

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [pendingNewBlock, setPendingNewBlock] = useState<{ block: Block; afterBlockId: string | null } | null>(null)
  const [blockSelector, setBlockSelector] = useState<BlockSelectorState>({
    showBlockSelector: false,
    insertAfterBlockId: null,
    insertParentId: null,
    showSectionSelector: false,
  })
  const updateBlockSelector = (patch: Partial<BlockSelectorState>) => setBlockSelector(prev => ({ ...prev, ...patch }))

  const [scoreTableTemplates, setScoreTableTemplates] = useState<ScoreTableTemplate[]>([])
  const [chartTemplates, setChartTemplates] = useState<ChartTemplate[]>([])
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaved, setIsSaved] = useState(!isNew)
  const sectionSelectorRef = useRef<HTMLDivElement>(null)
  const templateIdRef = useRef<string | null>(null)

  useClickOutside(sectionSelectorRef, () => updateBlockSelector({ showSectionSelector: false }))

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
            navigate('/')
            return
          }
          setTemplate(loaded)
          templateIdRef.current = loaded.id
          setBlocks(templateBlocksToBlocks(loaded.blocks))
        }
      } catch (err) {
        showError(err)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isNew, navigate, showError])

  // ========== Handlers ==========

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

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setIsDirty(true)
    setBlocks(newBlocks)
    if (template) triggerSave(template, newBlocks)
  }, [template, triggerSave])

  const handleBlockDataChange = useCallback((blockId: string, data: BlockData) => {
    setIsDirty(true)
    setBlocks(prev => {
      const updated = prev.map(b => b.id === blockId ? { ...b, data } : b)
      if (template) triggerSave(template, updated)
      return updated
    })
  }, [template, triggerSave])

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

    setBlocks(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)

      if (blockSelector.insertAfterBlockId) {
        const afterIdx = sorted.findIndex(b => b.id === blockSelector.insertAfterBlockId)
        if (afterIdx !== -1) sorted.splice(afterIdx + 1, 0, newBlock)
        else sorted.push(newBlock)
      } else {
        sorted.push(newBlock)
      }

      const reordered = sorted.map((b, i) => ({ ...b, order: i }))
      updateBlockSelector({ insertAfterBlockId: null, insertParentId: null })
      if (template) triggerSave(template, reordered)
      return reordered
    })
  }, [blockSelector.insertAfterBlockId, blockSelector.insertParentId, scoreTableTemplates, chartTemplates, template, triggerSave])

  const handleRequestAddBlock = useCallback((afterBlockId: string, parentId?: string | null) => {
    updateBlockSelector({ insertAfterBlockId: afterBlockId, insertParentId: parentId ?? null, showBlockSelector: true })
  }, [])

  const toggleSectionCollapse = useCallback((blockId: string, childContainerIds?: string[]) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
        childContainerIds?.forEach(id => next.add(id))
      }
      return next
    })
  }, [])

  const handleAddTextSection = useCallback(() => {
    setIsDirty(true)
    const sorted = [...blocks].sort((a, b) => a.order - b.order)
    const newBlock = createBlock('section', 0, undefined, null)

    const closingIdx = sorted.findIndex(b => b.type === 'closing-page')
    if (closingIdx !== -1) sorted.splice(closingIdx, 0, newBlock)
    else sorted.push(newBlock)

    const reordered = sorted.map((b, i) => ({ ...b, order: i }))
    setBlocks(reordered)
    if (template) triggerSave(template, reordered)
    updateBlockSelector({ showSectionSelector: false })
  }, [blocks, template, triggerSave])

  const handleAddClosingPage = useCallback(() => {
    setIsDirty(true)
    const sorted = [...blocks].sort((a, b) => a.order - b.order)
    const newBlock = createBlock('closing-page', 0)
    const reordered = [...sorted, newBlock].map((b, i) => ({ ...b, order: i }))
    setBlocks(reordered)
    if (template) triggerSave(template, reordered)
    updateBlockSelector({ showSectionSelector: false })
  }, [blocks, template, triggerSave])

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

    const reordered = sorted.map((b, i) => ({ ...b, order: i }))
    setBlocks(reordered)
    if (template) triggerSave(template, reordered)
    setPendingNewBlock(null)
    setEditingBlockId(null)
  }, [pendingNewBlock, blocks, template, triggerSave])

  // ========== Derived ==========

  const editingBlock = editingBlockId
    ? blocks.find(b => b.id === editingBlockId) ?? pendingNewBlock?.block ?? null
    : pendingNewBlock?.block ?? null

  const hasClosingPage = blocks.some(b => b.type === 'closing-page')

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
      <div className="flex-1 max-w-3xl mx-auto w-full px-2 sm:px-4">
        {/* Description */}
        <div className="pt-2 pb-4">
          <input
            type="text"
            value={template.description}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder="Descrição do template (opcional)"
            disabled={isMaster}
            className="w-full text-sm text-gray-500 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-gray-400 disabled:cursor-default"
          />
        </div>

        {/* Block tree */}
        <main className="flex-1 pb-6">
          <OutlineTree
            blocks={blocks}
            onBlocksChange={handleBlocksChange}
            collapsedSections={collapsedSections}
            onToggleSectionCollapse={toggleSectionCollapse}
            onRequestAddBlock={handleRequestAddBlock}
            onEditBlock={setEditingBlockId}
            locked={isMaster}
          />

          {!isMaster && (
            <div className="mt-6 flex justify-center">
              <div className="relative w-full max-w-md" ref={sectionSelectorRef}>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => updateBlockSelector({ showSectionSelector: !blockSelector.showSectionSelector })}
                  className="border-2 border-dashed border-gray-300 hover:border-brand-400 hover:text-brand-700 w-full"
                >
                  + Adicionar Seção
                </Button>

                {blockSelector.showSectionSelector && (
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
                        hasClosingPage ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        hasClosingPage ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
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
          )}
        </main>
      </div>

      {/* Block Selector Modal */}
      <BlockSelector
        isOpen={blockSelector.showBlockSelector}
        onClose={() => updateBlockSelector({ showBlockSelector: false })}
        onSelect={handleAddBlock}
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
