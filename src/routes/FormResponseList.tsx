import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Form, FormResponse, ReportTemplate } from '@/types'
import { FORM_RESPONSE_STATUS_LABELS, FORM_RESPONSE_STATUS_COLORS } from '@/types'
import { getFormById, listFormResponses, deleteFormResponse } from '@/lib/api/form-api'
import { getAllTemplates } from '@/lib/default-templates'
import { getReportTemplates } from '@/lib/api/template-api'
import { useError } from '@/contexts/ErrorContext'
import { formatDateTime } from '@/lib/utils'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import { usePagination } from '@/lib/hooks/use-pagination'
import Pagination from '@/components/ui/Pagination'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import EmptyState from '@/components/ui/EmptyState'
import PageSizeSelector from '@/components/ui/PageSizeSelector'
import FilterBar from '@/components/ui/FilterBar'
import Spinner from '@/components/ui/Spinner'
import ListCard, { ListCardPill, ListCardAction } from '@/components/ui/ListCard'
import { TrashIcon } from '@/components/icons'
import GenerateReportModal from '@/components/form-builder/GenerateReportModal'
import GenerateFormLinkModal from '@/components/form-builder/GenerateFormLinkModal'

export default function FormResponseList() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showError } = useError()

  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [generateForResponse, setGenerateForResponse] = useState<FormResponse | null>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [searchResponses, setSearchResponses] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [allTemplates, setAllTemplates] = useState(() => getAllTemplates([]))

  const linkedTemplate = useMemo((): ReportTemplate | null => {
    if (!form?.linkedTemplateId) return null
    return allTemplates.find((t) => t.id === form.linkedTemplateId) ?? null
  }, [form, allTemplates])

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const [loadedForm, loadedResponses, customTemplates] = await Promise.all([
        getFormById(id),
        listFormResponses(id),
        getReportTemplates(),
      ])
      if (!loadedForm) {
        navigate('/forms')
        return
      }
      setForm(loadedForm)
      setResponses(loadedResponses)
      setAllTemplates(getAllTemplates(customTemplates))
    } catch (err) {
      showError(err)
    }
  }, [id, navigate, showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDeleteResponse = useCallback(async (responseId: string) => {
    try {
      if (!id) return
      await deleteFormResponse(id, responseId)
      await loadData()
    } catch (err) {
      showError(err)
    }
  }, [id, loadData, showError])

  const { confirmId: confirmDeleteId, requestDelete: setConfirmDeleteId, confirmDelete, cancelDelete } = useConfirmDelete(handleDeleteResponse)

  const filteredResponses = responses.filter((resp) => {
    if (searchResponses && !(resp.customerName || '').toLowerCase().includes(searchResponses.toLowerCase())) return false
    if (startDate && resp.updatedAt < startDate) return false
    if (endDate && resp.updatedAt.slice(0, 10) > endDate) return false
    return true
  })

  const { page: paginatedPage, setCurrentPage, pageSize, changePageSize } = usePagination(filteredResponses)

  const handleOpenResponse = useCallback((resp: FormResponse) => {
    if (!resp.customerId) return
    navigate(`/customers/${resp.customerId}/forms/${resp.formId}/comparison?versionId=${resp.formVersionId}`)
  }, [navigate])

  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <main className="page-container">
      <div className="flex items-center justify-between bg-white rounded-full px-5 py-1.5 shadow-card">
        <h2 className="text-xl font-bold text-gray-700">Respostas</h2>
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            onClick={() => navigate(`/forms/${id}/edit`)}
            className="h-11 w-11 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors shadow-sm shrink-0"
            title="Editar Formulário"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="h-11 w-11 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors shadow-sm shrink-0"
            title="Gerar Link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>
      </div>

      {/* Espaço fixo + Filtros colapsáveis */}
      <div className="mt-6" />
      <FilterBar
        open={filtersOpen}
        search={{ value: searchResponses, onChange: setSearchResponses, placeholder: 'Buscar por cliente...' }}
        date={{
          startDate,
          endDate,
          onStartDateChange: setStartDate,
          onEndDateChange: setEndDate,
          onClear: () => { setStartDate(''); setEndDate('') },
        }}
      />

        {filteredResponses.length === 0 ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            }
            title="Nenhuma resposta ainda"
            message="As respostas chegam quando os destinatários preenchem o link público"
          />
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPage.content.map((resp) => {
                const answeredCount = resp.answers.filter(a => a.value || a.selectedOptionIds.length > 0 || a.scaleValue !== null).length
                const totalQuestions = form.fields.filter(f => f.type !== 'section-header').length

                return (
                  <ListCard
                    key={resp.id}
                    onClick={resp.customerId ? () => handleOpenResponse(resp) : undefined}
                    title={resp.customerName || 'Cliente sem nome'}
                    pills={
                      <>
                        <ListCardPill>{formatDateTime(resp.updatedAt)}</ListCardPill>
                        <ListCardPill>{answeredCount} de {totalQuestions} respondidas</ListCardPill>
                      </>
                    }
                    badges={
                      <>
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                          FORM_RESPONSE_STATUS_COLORS[resp.status].bg
                        } ${FORM_RESPONSE_STATUS_COLORS[resp.status].text}`}>
                          {FORM_RESPONSE_STATUS_LABELS[resp.status]}
                        </span>
                        {resp.generatedReportId ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); navigate(`/reports/${resp.generatedReportId}`) }}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Ver Relatório
                          </button>
                        ) : resp.status === 'concluido' ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setGenerateForResponse(resp) }}
                            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            Gerar Relatório
                          </button>
                        ) : null}
                      </>
                    }
                    actions={
                      <ListCardAction
                        onClick={() => setConfirmDeleteId(resp.id)}
                        title="Excluir resposta"
                        icon={<TrashIcon />}
                        variant="danger"
                      />
                    }
                  />
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-center">
              <div className="flex-1" />
              <Pagination page={paginatedPage} onPageChange={setCurrentPage} />
              <div className="flex-1 flex justify-end">
                <PageSizeSelector pageSize={pageSize} onChange={changePageSize} />
              </div>
            </div>
          </>
        )}
      </main>

      <ConfirmDeleteModal
        isOpen={!!confirmDeleteId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message="Tem certeza de que deseja excluir esta resposta? Esta ação não pode ser desfeita."
      />

      {/* Generate Form Link Modal */}
      {id && (
        <GenerateFormLinkModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          formId={id}
        />
      )}

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={!!generateForResponse}
        onClose={() => setGenerateForResponse(null)}
        form={form}
        response={generateForResponse}
        template={linkedTemplate}
        onReportGenerated={(reportId) => {
          setGenerateForResponse(null)
          navigate(`/reports/${reportId}`)
        }}
      />
    </>
  )
}
