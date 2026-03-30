import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Form } from '@/types'
import { createEmptyForm } from '@/types'
import { getForms, createForm, deleteForm, listFormResponses } from '@/lib/api/form-api'
import { getAllTemplates } from '@/lib/default-templates'
import { getReportTemplates } from '@/lib/api/template-api'
import { formatDateTime } from '@/lib/utils'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import { usePagination } from '@/lib/hooks/use-pagination'
import { useError } from '@/contexts/ErrorContext'
import Pagination from '@/components/ui/Pagination'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import EmptyState from '@/components/ui/EmptyState'
import PageSizeSelector from '@/components/ui/PageSizeSelector'
import FilterBar from '@/components/ui/FilterBar'
import ListCard, { ListCardPill, ListCardAction } from '@/components/ui/ListCard'
import { CopyIcon, TrashIcon } from '@/components/icons'

export default function FormList() {
  const navigate = useNavigate()
  const { showError } = useError()

  const [forms, setForms] = useState<Form[]>([])
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({})
  const [templates, setTemplates] = useState(() => getAllTemplates([]))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [loadedForms, customTemplates] = await Promise.all([
        getForms(),
        getReportTemplates(),
      ])
      setForms(loadedForms)
      setTemplates(getAllTemplates(customTemplates))

      // Count responses per form
      const counts: Record<string, number> = {}
      const countResults = await Promise.all(
        loadedForms.map(async (f) => {
          const responses = await listFormResponses(f.id)
          return { formId: f.id, count: responses.length }
        })
      )
      for (const { formId, count } of countResults) {
        counts[formId] = count
      }
      setResponseCounts(counts)
    } catch (err) {
      showError(err)
    }
  }, [showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = useCallback(async () => {
    try {
      const form = createEmptyForm()
      form.title = 'Novo Formulário'
      const created = await createForm(form)
      navigate(`/forms/${created.id}/edit`)
    } catch (err) {
      showError(err)
    }
  }, [navigate, showError])

  const handleDeleteForm = useCallback(async (id: string) => {
    try {
      await deleteForm(id)
      await loadData()
    } catch (err) {
      showError(err)
    }
  }, [loadData, showError])

  const { confirmId: confirmDeleteId, requestDelete: setConfirmDeleteId, confirmDelete, cancelDelete } = useConfirmDelete(handleDeleteForm)

  const handleDuplicate = useCallback(async (form: Form) => {
    try {
      const dup = createEmptyForm()
      dup.title = `${form.title} (cópia)`
      dup.description = form.description
      dup.fields = form.fields.map(f => ({
        ...f,
        id: crypto.randomUUID(),
        options: f.options.map(o => ({ ...o, id: crypto.randomUUID() })),
      }))
      dup.linkedTemplateId = form.linkedTemplateId
      dup.fieldMappings = form.fieldMappings.map(m => ({ ...m }))
      await createForm(dup)
      await loadData()
    } catch (err) {
      showError(err)
    }
  }, [loadData, showError])

  const getTemplateName = (templateId: string | null): string | null => {
    if (!templateId) return null
    return templates.find(t => t.id === templateId)?.name ?? null
  }

  const filteredForms = forms.filter((form) => {
    if (startDate && form.updatedAt < startDate) return false
    if (endDate && form.updatedAt.slice(0, 10) > endDate) return false
    return true
  })

  const { page: paginatedPage, setCurrentPage, pageSize, changePageSize } = usePagination(filteredForms)

  return (
    <>
      <main className="page-container">
      <div className="flex items-center justify-between bg-white rounded-full px-5 py-1.5 shadow-card">
        <h2 className="text-xl font-bold text-gray-700">Formulários</h2>
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
            onClick={handleCreate}
            className="h-11 w-11 flex items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800 transition-colors shadow-sm shrink-0"
            title="Novo Formulário"
          >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="4" x2="10" y2="16" />
            <line x1="4" y1="10" x2="16" y2="10" />
          </svg>
          </button>
        </div>
      </div>

      {/* Espaço fixo + Filtros colapsáveis */}
      <div className="mt-6" />
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

        {filteredForms.length === 0 ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            }
            title="Nenhum formulário ainda"
            message="Crie seu primeiro formulário de anamnese"
            buttonLabel="+ Novo Formulário"
            onAction={handleCreate}
          />
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPage.content.map((form) => {
                const templateName = getTemplateName(form.linkedTemplateId)
                const responseCount = responseCounts[form.id] ?? 0
                const isDefault = !!form.isDefault

                const questionCount = form.fields.filter(f => f.type !== 'section-header').length

                return (
                  <ListCard
                    key={form.id}
                    onClick={() =>
                      isDefault
                        ? navigate(`/forms/${form.id}/responses`)
                        : navigate(`/forms/${form.id}/edit`)
                    }
                    title={form.title || 'Formulário sem título'}
                    subtitle={
                      isDefault ? (
                        <span className="text-[10px] font-medium uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          Padrão
                        </span>
                      ) : undefined
                    }
                    pills={
                      <>
                        {!isDefault && <ListCardPill>{formatDateTime(form.updatedAt)}</ListCardPill>}
                        <ListCardPill>{questionCount} {questionCount === 1 ? 'pergunta' : 'perguntas'}</ListCardPill>
                        {templateName && (
                          <span className="text-[10px] font-medium uppercase bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">
                            {templateName}
                          </span>
                        )}
                      </>
                    }
                    badges={
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full cursor-pointer ${
                          responseCount > 0
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        onClick={(e) => { e.stopPropagation(); navigate(`/forms/${form.id}/responses`) }}
                      >
                        {responseCount} {responseCount === 1 ? 'resposta' : 'respostas'}
                      </span>
                    }
                    actions={
                      <>
                        <ListCardAction onClick={() => handleDuplicate(form)} title="Duplicar" icon={<CopyIcon />} />
                        {!isDefault && (
                          <ListCardAction onClick={() => setConfirmDeleteId(form.id)} title="Excluir" icon={<TrashIcon />} variant="danger" />
                        )}
                      </>
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
        message="Tem certeza de que deseja excluir este formulário e todas as suas respostas? Esta ação não pode ser desfeita."
      />
    </>
  )
}
