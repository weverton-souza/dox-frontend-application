import { useState, useCallback } from 'react'
import type { AddressAnswer, AddressSubfieldKey, FormField, FormFieldAnswer } from '@/types'
import { ADDRESS_SUBFIELD_KEYS } from '@/types'
import { isValidCep, validateInput } from '@/lib/validators'

function addressRequiredKeys(field: FormField): AddressSubfieldKey[] {
  const cfg = field.addressSubfields
  if (!cfg) return []
  return ADDRESS_SUBFIELD_KEYS.filter((k) => cfg[k]?.enabled && cfg[k]?.required)
}

function emptyAddressSubfield(answer: AddressAnswer | undefined, key: AddressSubfieldKey): boolean {
  return !answer?.[key]?.trim()
}

export function isFieldEmpty(field: FormField, answer: FormFieldAnswer): boolean {
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
    case 'yes-no':
      return !answer.value.trim()
    case 'single-choice':
    case 'multiple-choice':
    case 'inventory-item':
      return answer.selectedOptionIds.length === 0
    case 'scale':
      return answer.scaleValue === null
    case 'likert-matrix':
      return field.likertRows.some((row) => answer.likertAnswers[row.id] === undefined)
    case 'address':
      return addressRequiredKeys(field).some((k) => emptyAddressSubfield(answer.addressAnswer, k))
    default:
      return false
  }
}

export function getFieldError(field: FormField, answer: FormFieldAnswer | undefined): string | null {
  if (field.type === 'section-header') return null

  if (field.type === 'address') {
    const requiredKeys = addressRequiredKeys(field)
    const missing = requiredKeys.filter((k) => emptyAddressSubfield(answer?.addressAnswer, k))
    if (missing.length > 0) return 'Preencha os campos obrigatórios do endereço'
    const zipCodeValue = answer?.addressAnswer?.zipCode ?? ''
    const cfg = field.addressSubfields
    if (cfg?.zipCode?.enabled && zipCodeValue && !isValidCep(zipCodeValue)) return 'CEP inválido'
    return null
  }

  if (!answer || isFieldEmpty(field, answer)) {
    return field.required ? 'Este campo é obrigatório' : null
  }
  if (field.type === 'short-text' && field.validation) {
    return validateInput(field.validation, answer.value)
  }
  return null
}

export function useFormValidation(
  getFields: () => FormField[],
  getAnswers: () => FormFieldAnswer[],
) {
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map())

  const validate = useCallback((): boolean => {
    const fields = getFields()
    const answers = getAnswers()
    const errors = new Map<string, string>()

    for (const field of fields) {
      const answer = answers.find((a) => a.fieldId === field.id)
      const message = getFieldError(field, answer)
      if (message) errors.set(field.id, message)
    }

    setValidationErrors(errors)
    return errors.size === 0
  }, [getFields, getAnswers])

  const clearFieldError = useCallback((fieldId: string) => {
    setValidationErrors((prev) => {
      if (!prev.has(fieldId)) return prev
      const next = new Map(prev)
      next.delete(fieldId)
      return next
    })
  }, [])

  return { validationErrors, validate, clearFieldError }
}
