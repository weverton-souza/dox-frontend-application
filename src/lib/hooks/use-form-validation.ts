import { useState, useCallback } from 'react'
import type { FormField, FormFieldAnswer } from '@/types'

function isFieldEmpty(field: FormField, answer: FormFieldAnswer): boolean {
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
    case 'yes-no':
      return !answer.value.trim()
    case 'single-choice':
    case 'multiple-choice':
      return answer.selectedOptionIds.length === 0
    case 'scale':
      return answer.scaleValue === null
    default:
      return false
  }
}

export function useFormValidation(
  getFields: () => FormField[],
  getAnswers: () => FormFieldAnswer[],
) {
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

  const validate = useCallback((): boolean => {
    const fields = getFields()
    const answers = getAnswers()
    const errors = new Set<string>()

    for (const field of fields) {
      if (!field.required || field.type === 'section-header') continue

      const answer = answers.find((a) => a.fieldId === field.id)
      if (!answer) {
        errors.add(field.id)
        continue
      }

      if (isFieldEmpty(field, answer)) errors.add(field.id)
    }

    setValidationErrors(errors)
    return errors.size === 0
  }, [getFields, getAnswers])

  const clearFieldError = useCallback((fieldId: string) => {
    if (validationErrors.has(fieldId)) {
      setValidationErrors((prev) => {
        const next = new Set(prev)
        next.delete(fieldId)
        return next
      })
    }
  }, [validationErrors])

  return { validationErrors, validate, clearFieldError }
}
