import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Report, ReportTemplate, Block, Page } from '@/types'
import { getReports, createReport, deleteReport } from '@/lib/api/report-api'
import { getReportTemplates, deleteReportTemplate, duplicateReportTemplate } from '@/lib/api/template-api'
import { getAllTemplates } from '@/lib/default-templates'
import { formatDateTime } from '@/lib/utils'
import { createEmptyReport } from '@/lib/report-utils'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import { useError } from '@/contexts/ErrorContext'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import ListCard, { ListCardPill, ListCardAction } from '@/components/ui/ListCard'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import EmptyState from '@/components/ui/EmptyState'
import PageSizeSelector from '@/components/ui/PageSizeSelector'
import { TrashIcon, CopyIcon } from '@/components/icons'
import { getBlockTitle } from '@/lib/block-constants'

export default function ReportList() {
  const navigate = useNavigate()
  const { showError } = useError()

  const [reportsPage, setReportsPage] = useState<Page<Report> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [customTemplates, setCustomTemplates] = useState<ReportTemplate[]>([])
  const [showNewModal, setShowNewModal] = useState(false)
  const [activeTab, setActiveTab] = useState('reports')

  const loadData = useCallback(async (page: number, size: number) => {
    try {
      const [rPage, templates] = await Promise.all([
        getReports(page, size),
        getReportTemplates(),
      ])
      setReportsPage(rPage)
      setCustomTemplates(templates)
    } catch (err) {
      showError(err)
    }
  }, [showError])

  useEffect(() => { loadData(currentPage, pageSize) }, [loadData, currentPage, pageSize])

  const allTemplates = getAllTemplates(customTemplates)

  const handleCreateFromScratch = useCallback(async () => {
    try {
      const report = await createEmptyReport()
      setShowNewModal(false)
      navigate(`/reports/${report.id}`)
    } catch (err) {
      showError(err)
    }
  }, [navigate, showError])

  const handleCreateFromTemplate = useCallback(
    async (template: ReportTemplate) => {
      try {
        const blocks: Block[] = template.blocks.map((tb) => ({
          id: crypto.randomUUID(),
          type: tb.type,
          parentId: tb.parentId ?? null,
          order: tb.order,
          data: JSON.parse(JSON.stringify(tb.data)),
          collapsed: false,
        }))

        const report = await createReport({
          status: 'rascunho',
          customerName: '',
          blocks,
        })

        setShowNewModal(false)
        navigate(`/reports/${report.id}`)
      } catch (err) {
        showError(err)
      }
    },
    [navigate, showError]
  )

  const handleDeleteReport = useCallback(async (id: string) => {
    try {
      await deleteReport(id)
      await loadData(currentPage, pageSize)
    } catch (err) {
      showError(err)
    }
  }, [loadData, currentPage, pageSize, showError])

  const { confirmId: confirmDeleteId, requestDelete: setConfirmDeleteId, confirmDelete, cancelDelete } = useConfirmDelete(handleDeleteReport)

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      try {
        await deleteReportTemplate(id)
        const templates = await getReportTemplates()
        setCustomTemplates(templates)
      } catch (err) {
        showError(err)
      }
    },
    [showError]
  )

  const handleDuplicateTemplate = useCallback(async (id: string) => {
    try {
      await duplicateReportTemplate(id)
      const templates = await getReportTemplates()
      setCustomTemplates(templates)
    } catch (err) {
      showError(err)
    }
  }, [showError])

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }, [])

  return (
    <>
      <PageHeader
        title="Relatórios"
        tabs={[
          { id: 'reports', label: 'Relatórios' },
          { id: 'templates', label: 'Templates' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          activeTab === 'reports'
            ? <Button onClick={() => setShowNewModal(true)}>+ Novo Relatório</Button>
            : undefined
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {activeTab === 'reports' ? (<>
        {/* Filters */}
        {reportsPage && reportsPage.totalElements > 0 && (
          <div className="mb-6 hidden sm:flex items-center justify-end">
            <PageSizeSelector id="page-size-reports" pageSize={pageSize} onChange={changePageSize} />
          </div>
        )}

        {!reportsPage || reportsPage.totalElements === 0 ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="18" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="9" y1="15" x2="15" y2="15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Nenhum relatório ainda"
            message="Crie seu primeiro relatório para começar"
            buttonLabel="+ Novo Relatório"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          /* Report list */
          <>
          <div className="space-y-3">
            {reportsPage.content.map((report) => (
              <ListCard
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                title={report.customerName || 'Cliente sem nome'}
                pills={
                  <>
                    <ListCardPill>{formatDateTime(report.updatedAt)}</ListCardPill>
                    <ListCardPill>{report.blocks.length} {report.blocks.length === 1 ? 'bloco' : 'blocos'}</ListCardPill>
                  </>
                }
                badges={<StatusBadge status={report.status} />}
                actions={
                  <ListCardAction
                    onClick={() => setConfirmDeleteId(report.id)}
                    title="Excluir relatório"
                    icon={<TrashIcon />}
                    variant="danger"
                  />
                }
              />
            ))}
          </div>
          <Pagination
            page={reportsPage}
            onPageChange={setCurrentPage}
          />
          </>
        )}
      </>) : (
        /* Templates tab */
        <TemplatesTab
          templates={allTemplates}
          onDuplicate={handleDuplicateTemplate}
          onDelete={handleDeleteTemplate}
        />
      )}
      </main>

      {/* New Report Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Novo Relatório"
        size="md"
      >
        <div className="p-4 space-y-4">
          {/* From scratch */}
          <button
            type="button"
            onClick={handleCreateFromScratch}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all text-left"
          >
            <div className="p-3 rounded-lg bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Começar do zero</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Relatório vazio com bloco de identificação
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase font-medium">ou use um template</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Templates */}
          <div className="space-y-2">
            {allTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => handleCreateFromTemplate(template)}
                  className="flex-1 flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-left"
                >
                  <div className="p-3 rounded-lg bg-brand-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {template.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {template.blocks.length} blocos
                    </p>
                  </div>
                </button>
                {!template.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Excluir template"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!confirmDeleteId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message="Tem certeza de que deseja excluir este relatório? Esta ação não pode ser desfeita."
      />
    </>
  )
}

function TemplatesTab({
  templates,
  onDuplicate,
  onDelete,
}: {
  templates: ReportTemplate[]
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const masterTemplates = templates.filter((t) => t.isMaster)
  const customTemplates = templates.filter((t) => !t.isMaster)

  return (
    <div className="space-y-8">
      {masterTemplates.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Templates Mestre
          </h2>
          <div className="space-y-2">
            {masterTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} onDuplicate={onDuplicate} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          {masterTemplates.length > 0 ? 'Meus Templates' : 'Templates'}
        </h2>
        {customTemplates.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">
            Nenhum template customizado. Duplique um template mestre ou salve um relatório como template.
          </p>
        ) : (
          <div className="space-y-2">
            {customTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} onDuplicate={onDuplicate} onDelete={onDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function TemplateCard({
  template,
  onDuplicate,
  onDelete,
}: {
  template: ReportTemplate
  onDuplicate: (id: string) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{template.name}</p>
          {template.isMaster && (
            <span className="text-[10px] font-medium uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              Mestre
            </span>
          )}
          {template.isLocked && (
            <span className="text-[10px] font-medium uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Estrutura fixa
            </span>
          )}
        </div>
        {template.description && (
          <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {template.blocks.map((block, i) => (
            <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {getBlockTitle(block)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-gray-400 mr-2">
          {template.blocks.length} blocos
        </span>
        <button
          type="button"
          onClick={() => onDuplicate(template.id)}
          className="p-2 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
          title="Duplicar template"
        >
          <CopyIcon size={14} />
        </button>
        {onDelete && !template.isMaster && (
          <button
            type="button"
            onClick={() => onDelete(template.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Excluir template"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
