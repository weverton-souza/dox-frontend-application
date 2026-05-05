import { useState, useCallback, useMemo } from 'react'
import type { FormField, FormFieldAnswer } from '@/types'
import { createEmptyFormFieldAnswer } from '@/types'
import { useSortedFields } from '@/lib/hooks/use-sorted-fields'
import { useFieldVisibility } from '@/lib/hooks/use-field-visibility'
import { useAutoCalculatedFields } from '@/lib/hooks/use-auto-calculated-fields'
import { useFormValidation, isFieldEmpty } from '@/lib/hooks/use-form-validation'
import FormSectionFields from '@/components/form-fill/FormSectionFields'

interface FormPreviewProps {
  title: string
  description: string
  fields: FormField[]
}

export default function FormPreview({ title, description, fields }: FormPreviewProps) {
  const [answers, setAnswers] = useState<FormFieldAnswer[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [pageErrors, setPageErrors] = useState<Set<string>>(new Set())

  const visibleFieldIds = useFieldVisibility(fields, answers)
  const visibleFields = useMemo(
    () => fields.filter((f) => visibleFieldIds.has(f.id)),
    [fields, visibleFieldIds],
  )

  useAutoCalculatedFields({
    fields,
    answers,
    onAnswerChange: (a) => {
      setAnswers((prev) => {
        const exists = prev.find((p) => p.fieldId === a.fieldId)
        if (exists) return prev.map((p) => (p.fieldId === a.fieldId ? a : p))
        return [...prev, a]
      })
    },
  })

  const { validationErrors, clearFieldError } = useFormValidation(
    useCallback(() => visibleFields, [visibleFields]),
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

  const { sectionGroups } = useSortedFields(visibleFields)

  const pages = useMemo(() => {
    if (sectionGroups.length === 0) return []
    return sectionGroups.filter((g) => g.children.length > 0 || g.sectionField)
  }, [sectionGroups])

  const totalPages = pages.length
  const hasPagination = totalPages > 1
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1))
  const isFirstPage = safePage === 0
  const isLastPage = safePage >= totalPages - 1
  const currentSection = pages[safePage]
  const currentSectionGroups = currentSection ? [currentSection] : []

  const validatePageFields = useCallback((pageFields: FormField[]): Set<string> => {
    const errors = new Set<string>()
    for (const field of pageFields) {
      if (!field.required || field.type === 'section-header') continue
      if (!visibleFieldIds.has(field.id)) continue
      const answer = answers.find((a) => a.fieldId === field.id)
      if (!answer || isFieldEmpty(field, answer)) errors.add(field.id)
    }
    return errors
  }, [answers, visibleFieldIds])

  const handleNext = useCallback(() => {
    if (!currentSection) return
    const errors = validatePageFields(currentSection.children)
    if (errors.size > 0) {
      setPageErrors(errors)
      return
    }
    setPageErrors(new Set())
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
  }, [currentSection, totalPages, validatePageFields])

  const handlePrev = useCallback(() => {
    setPageErrors(new Set())
    setCurrentPage((p) => Math.max(p - 1, 0))
  }, [])

  const handleRestart = useCallback(() => {
    setAnswers([])
    setCurrentPage(0)
    setPageErrors(new Set())
  }, [])

  const getAnswer = useCallback(
    (fieldId: string) => answers.find((a) => a.fieldId === fieldId) ?? createEmptyFormFieldAnswer(fieldId),
    [answers],
  )

  const combinedErrors = useMemo(() => {
    const merged = new Map(validationErrors)
    pageErrors.forEach((id) => {
      if (!merged.has(id)) merged.set(id, 'Este campo é obrigatório')
    })
    return merged
  }, [validationErrors, pageErrors])

  const progressPercent = hasPagination
    ? Math.round(((safePage + 1) / totalPages) * 100)
    : 100

  const hasFields = fields.length > 0

  return (
    <div className="bg-[#f0ebf8]/40 min-h-[calc(100vh-3rem-3.5rem)]">
      <div className="sticky top-[100px] lg:top-[104px] z-20">
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            Modo preview — respostas <strong>não são salvas</strong>. Use para testar perguntas com lógica condicional.
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60">
          <div className="max-w-[860px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-medium text-gray-700 truncate">
                {title || 'Formulário'}
              </h1>
            </div>
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
        </div>
      </div>

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 space-y-3">
        {safePage === 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-2 bg-brand-500" />
            <div className="px-6 py-5">
              <h1 className="text-2xl font-normal text-gray-900">
                {title || 'Formulário sem título'}
              </h1>
              {description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
              )}
            </div>
          </div>
        )}

        {!hasFields ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-sm text-gray-400">
              Nenhuma pergunta adicionada ainda
            </p>
          </div>
        ) : (
          <FormSectionFields
            sectionGroups={currentSectionGroups}
            getAnswer={getAnswer}
            onAnswerChange={handleAnswerChange}
            validationErrors={combinedErrors}
          />
        )}

        {hasFields && hasPagination && (
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
                onClick={handleRestart}
                className="px-8 py-2.5 rounded-full bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
              >
                Reiniciar preview
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
        )}

        {hasFields && !hasPagination && (
          <div className="flex items-center justify-center pt-6 pb-10">
            <button
              type="button"
              onClick={handleRestart}
              className="px-10 py-3 rounded-full bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
            >
              Reiniciar preview
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
