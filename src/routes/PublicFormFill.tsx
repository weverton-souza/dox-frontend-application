import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { PublicFormData, FormFieldAnswer, FormField } from '@/types'
import { createEmptyFormFieldAnswer } from '@/types'
import { getPublicForm, submitPublicForm } from '@/lib/api/public-form-api'
import { parseError } from '@/lib/api/error-handler'
import { useFormValidation, isFieldEmpty } from '@/lib/hooks/use-form-validation'
import { useFormDraft } from '@/lib/hooks/use-form-draft'
import { useSortedFields } from '@/lib/hooks/use-sorted-fields'
import FormSectionFields from '@/components/form-fill/FormSectionFields'

interface DraftPayload extends Record<string, unknown> {
  answers: FormFieldAnswer[]
  currentPage: number
}

function DraftIndicator({
  status,
  lastSavedAt,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: string | null
}) {
  if (status === 'idle' && !lastSavedAt) return null
  if (status === 'saving') {
    return <span className="hidden sm:inline text-xs text-gray-400">Salvando…</span>
  }
  if (status === 'error') {
    return <span className="hidden sm:inline text-xs text-amber-600">Erro ao salvar rascunho</span>
  }
  return (
    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 10l3 3 7-7" />
      </svg>
      Rascunho salvo
    </span>
  )
}

type PageState = 'loading' | 'form' | 'success' | 'error'

export default function PublicFormFill() {
  const { token } = useParams<{ token: string }>()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [formData, setFormData] = useState<PublicFormData | null>(null)
  const [answers, setAnswers] = useState<FormFieldAnswer[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageErrors, setPageErrors] = useState<Set<string>>(new Set())

  const draftPayload = useMemo<DraftPayload | null>(
    () => (formData ? { answers, currentPage } : null),
    [formData, answers, currentPage],
  )

  const { initialDraft, draftLoaded, status: draftStatus, lastSavedAt } =
    useFormDraft<DraftPayload>(token, draftPayload, pageState === 'form')

  useEffect(() => {
    if (!token) return

    getPublicForm(token)
      .then((data) => {
        setFormData(data)
        setPageState('form')
      })
      .catch((err: unknown) => {
        const parsed = parseError(err)
        setErrorMessage(parsed.message || 'Este link não é válido ou já expirou.')
        setPageState('error')
      })
  }, [token])

  useEffect(() => {
    if (!formData || !draftLoaded) return
    const baseAnswers = formData.fields
      .filter((f) => f.type !== 'section-header')
      .map((f) => createEmptyFormFieldAnswer(f.id))
    if (initialDraft && Array.isArray(initialDraft.answers)) {
      const draftMap = new Map(
        (initialDraft.answers as FormFieldAnswer[]).map((a) => [a.fieldId, a]),
      )
      setAnswers(baseAnswers.map((a) => draftMap.get(a.fieldId) ?? a))
      if (typeof initialDraft.currentPage === 'number') {
        setCurrentPage(initialDraft.currentPage)
      }
    } else {
      setAnswers(baseAnswers)
    }
  }, [formData, draftLoaded, initialDraft])

  const { validationErrors, validate, clearFieldError } = useFormValidation(
    useCallback(() => formData?.fields ?? [], [formData]),
    useCallback(() => answers, [answers]),
  )

  const handleAnswerChange = useCallback((answer: FormFieldAnswer) => {
    setAnswers((prev) => {
      const exists = prev.find((a) => a.fieldId === answer.fieldId)
      if (exists) return prev.map((a) => (a.fieldId === answer.fieldId ? answer : a))
      return [...prev, answer]
    })
    clearFieldError(answer.fieldId)
    setPageErrors((prev) => {
      if (!prev.has(answer.fieldId)) return prev
      const next = new Set(prev)
      next.delete(answer.fieldId)
      return next
    })
  }, [clearFieldError])

  const { sectionGroups } = useSortedFields(formData?.fields)

  const pages = useMemo(() => {
    if (sectionGroups.length === 0) return []
    return sectionGroups.filter((g) => g.children.length > 0 || g.sectionField)
  }, [sectionGroups])

  const totalPages = pages.length
  const isLastPage = currentPage >= totalPages - 1
  const isFirstPage = currentPage === 0
  const hasPagination = totalPages > 1
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1))
  const currentSection = pages[safePage]
  const currentSectionGroups = currentSection ? [currentSection] : []

  const validatePageFields = useCallback((fields: FormField[]): Set<string> => {
    const errors = new Set<string>()
    for (const field of fields) {
      if (!field.required || field.type === 'section-header') continue
      const answer = answers.find((a) => a.fieldId === field.id)
      if (!answer || isFieldEmpty(field, answer)) errors.add(field.id)
    }
    return errors
  }, [answers])

  const handleNext = useCallback(() => {
    if (!currentSection) return
    const errors = validatePageFields(currentSection.children)
    if (errors.size > 0) {
      setPageErrors(errors)
      return
    }
    setPageErrors(new Set())
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentSection, totalPages, validatePageFields])

  const handlePrev = useCallback(() => {
    setPageErrors(new Set())
    setCurrentPage((p) => Math.max(p - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!validate() || !token || !formData || submitting) return

    setSubmitting(true)
    try {
      await submitPublicForm(token, answers)
      setPageState('success')
    } catch (err: unknown) {
      const parsed = parseError(err)
      setErrorMessage(parsed.message || 'Erro ao enviar respostas. Tente novamente.')
      setPageState('error')
    } finally {
      setSubmitting(false)
    }
  }, [validate, token, formData, answers, submitting])

  const getAnswer = useCallback((fieldId: string): FormFieldAnswer => {
    return answers.find((a) => a.fieldId === fieldId)
      ?? createEmptyFormFieldAnswer(fieldId)
  }, [answers])

  const combinedErrors = useMemo(() => {
    const merged = new Set(validationErrors)
    pageErrors.forEach((id) => merged.add(id))
    return merged
  }, [validationErrors, pageErrors])

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#f0ebf8]/40 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-[#f0ebf8]/40 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <path d="M10 6v4m0 4h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="10" r="8" stroke="#EF4444" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Link indisponível</h1>
          <p className="text-sm text-gray-500 leading-relaxed">{errorMessage}</p>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-[#f0ebf8]/40 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <path d="M6 10l3 3 5-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="10" r="8" stroke="#22C55E" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Respostas enviadas!</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Obrigado por preencher o formulário. Suas respostas foram registradas com sucesso.
          </p>
        </div>
      </div>
    )
  }

  const progressPercent = hasPagination
    ? Math.round(((safePage + 1) / totalPages) * 100)
    : 100

  return (
    <div className="min-h-screen bg-[#f0ebf8]/40">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-700 truncate">
              {formData?.formTitle || 'Formulário'}
            </h1>
            {formData?.customerName && (
              <p className="text-xs text-gray-400 truncate">{formData.customerName}</p>
            )}
          </div>
          <DraftIndicator status={draftStatus} lastSavedAt={lastSavedAt} />
          {hasPagination && (
            <div className="hidden sm:block text-xs text-gray-500 shrink-0">
              Página {safePage + 1} de {totalPages}
            </div>
          )}
        </div>
        {hasPagination && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 space-y-3">
        {safePage === 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-2 bg-brand-500" />
            <div className="px-6 py-5">
              <h1 className="text-2xl font-normal text-gray-900">
                {formData?.formTitle || 'Formulário'}
              </h1>
              {formData?.formDescription && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{formData.formDescription}</p>
              )}
              {formData?.customerName && (
                <p className="text-sm text-gray-400 mt-3">
                  Paciente: <span className="text-gray-600 font-medium">{formData.customerName}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <FormSectionFields
          sectionGroups={currentSectionGroups}
          getAnswer={getAnswer}
          onAnswerChange={handleAnswerChange}
          validationErrors={combinedErrors}
        />

        {hasPagination ? (
          <div className="flex items-center justify-between gap-3 pt-6 pb-10">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirstPage}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>

            <span className="sm:hidden text-xs text-gray-500">
              {safePage + 1} / {totalPages}
            </span>

            {isLastPage ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-2.5 rounded-full bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : 'Enviar Respostas'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-2.5 rounded-full bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 shadow-sm hover:shadow-md transition-all"
              >
                Próximo →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center pt-6 pb-10">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-10 py-3 rounded-full bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Enviar Respostas'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
