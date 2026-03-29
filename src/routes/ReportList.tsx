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
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import StatusBadge from '@/components/ui/StatusBadge'
import ListCard, { ListCardPill, ListCardAction } from '@/components/ui/ListCard'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import EmptyState from '@/components/ui/EmptyState'
import PageSizeSelector from '@/components/ui/PageSizeSelector'
import SegmentedControl from '@/components/ui/SegmentedControl'
import FilterBar from '@/components/ui/FilterBar'
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
  const [templateFilter, setTemplateFilter] = useState('standard')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

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
      <main className="page-container">
      <div className="flex items-center justify-between bg-white rounded-full px-5 py-1.5 shadow-card">
        <h2 className="text-xl font-bold text-gray-700">Relatórios</h2>
        <div className="flex items-center gap-2">
          <SegmentedControl
            options={[
              { value: 'reports', label: 'Histórico' },
              { value: 'templates', label: 'Templates' },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`h-11 w-11 flex items-center justify-center rounded-full transition-colors shadow-sm shrink-0 ${
              filtersOpen ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
            title="Filtros"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          {activeTab === 'reports' && (
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="h-11 w-11 flex items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800 transition-colors shadow-sm shrink-0"
              title="Novo Relatório"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="10" y1="4" x2="10" y2="16" />
                <line x1="4" y1="10" x2="16" y2="10" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Zona entre toolbar e cards */}
      <div className="my-6">
        {activeTab === 'templates' && (
          <SegmentedControl
            options={[
              { value: 'standard', label: 'Padrão' },
              { value: 'custom', label: 'Personalizados' },
            ]}
            value={templateFilter}
            onChange={setTemplateFilter}
            size="sm"
          />
        )}
      </div>
      {activeTab === 'reports' && (
        <FilterBar
          open={filtersOpen}
          date={{
            startDate,
            endDate,
            onStartDateChange: setStartDate,
            onEndDateChange: setEndDate,
            onClear: () => { setStartDate(''); setEndDate('') },
          }}
        />
      )}

      {activeTab === 'reports' ? (<>

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
            {reportsPage.content
              .filter((report) => {
                if (startDate && report.updatedAt < startDate) return false
                if (endDate && report.updatedAt.slice(0, 10) > endDate) return false
                return true
              })
              .map((report) => (
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
          <div className="mt-4 flex items-center justify-center">
            <div className="flex-1" />
            <Pagination
              page={reportsPage}
              onPageChange={setCurrentPage}
            />
            <div className="flex-1 flex justify-end">
              <PageSizeSelector pageSize={pageSize} onChange={changePageSize} />
            </div>
          </div>
          </>
        )}
      </>) : (
        /* Templates tab */
        <TemplatesTab
          templates={allTemplates}
          filter={templateFilter}
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
  filter,
  onDuplicate,
  onDelete,
}: {
  templates: ReportTemplate[]
  filter: string
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const filtered = templates.filter((t) =>
    filter === 'standard' ? t.isMaster : !t.isMaster
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / size))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * size, safePage * size + size)

  useEffect(() => { setPage(0) }, [filter, size])

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">
        {filter === 'standard'
          ? 'Nenhum template padrão disponível.'
          : 'Nenhum template personalizado. Duplique um template padrão ou salve um relatório como template.'}
      </p>
    )
  }

  const pageObj: Page<ReportTemplate> = {
    content: paged,
    number: safePage,
    size,
    totalElements: filtered.length,
    totalPages,
    first: safePage === 0,
    last: safePage === totalPages - 1,
    empty: filtered.length === 0,
  }

  return (
    <>
      <div className="space-y-2">
        {paged.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onDuplicate={onDuplicate}
            onDelete={filter === 'custom' ? onDelete : undefined}
          />
        ))}
      </div>
      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex-1" />
          <Pagination page={pageObj} onPageChange={setPage} />
          <div className="flex-1 flex justify-end">
            <PageSizeSelector pageSize={size} onChange={setSize} />
          </div>
        </div>
      )}
    </>
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
            <span className="text-[10px] font-medium uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Padrão
            </span>
          )}
        </div>
        {template.description && (
          <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {template.blocks
            .filter((block) => block.type === 'section' || block.type === 'identification')
            .map((block, i) => (
              <span key={i} className="text-[10px] uppercase font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
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
