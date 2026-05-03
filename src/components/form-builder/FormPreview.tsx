import { useMemo, useState, useCallback } from 'react'
import type { FormField, FormFieldAnswer } from '@/types'
import { createEmptyFormFieldAnswer } from '@/types'
import { buildFormSectionGroups } from '@/lib/utils'
import { useFieldVisibility } from '@/lib/hooks/use-field-visibility'
import { useAutoCalculatedFields } from '@/lib/hooks/use-auto-calculated-fields'
import FormSectionFields from '@/components/form-fill/FormSectionFields'

interface FormPreviewProps {
  title: string
  description: string
  fields: FormField[]
}

export default function FormPreview({ title, description, fields }: FormPreviewProps) {
  const sortedFields = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields])
  const [answers, setAnswers] = useState<Map<string, FormFieldAnswer>>(new Map())

  const answersList = useMemo(() => Array.from(answers.values()), [answers])
  const visibleFieldIds = useFieldVisibility(sortedFields, answersList)
  const visibleFields = useMemo(
    () => sortedFields.filter((f) => visibleFieldIds.has(f.id)),
    [sortedFields, visibleFieldIds],
  )
  const sectionGroups = useMemo(() => buildFormSectionGroups(visibleFields), [visibleFields])

  const getAnswer = useCallback(
    (fieldId: string) => answers.get(fieldId) ?? createEmptyFormFieldAnswer(fieldId),
    [answers],
  )

  const handleAnswerChange = useCallback((answer: FormFieldAnswer) => {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(answer.fieldId, answer)
      return next
    })
  }, [])

  useAutoCalculatedFields({
    fields: sortedFields,
    answers: answersList,
    onAnswerChange: handleAnswerChange,
  })

  return (
    <div className="max-w-[860px] mx-auto space-y-3 py-2">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Modo preview — você pode interagir, mas as respostas <strong>não são salvas</strong>.</span>
      </div>

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

      {sortedFields.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">
            Nenhuma pergunta adicionada ainda
          </p>
        </div>
      ) : (
        <FormSectionFields
          sectionGroups={sectionGroups}
          getAnswer={getAnswer}
          onAnswerChange={handleAnswerChange}
          validationErrors={new Set()}
        />
      )}
    </div>
  )
}
