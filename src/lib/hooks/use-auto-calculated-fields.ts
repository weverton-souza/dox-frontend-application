import { useEffect, useMemo } from 'react'
import type { FormField, FormFieldAnswer } from '@/types'
import { calculateAge } from '@/lib/utils'

interface UseAutoCalculatedFieldsArgs {
  fields: FormField[]
  answers: FormFieldAnswer[]
  onAnswerChange: (answer: FormFieldAnswer) => void
}

export function useAutoCalculatedFields({
  fields,
  answers,
  onAnswerChange,
}: UseAutoCalculatedFieldsArgs) {
  const birthField = useMemo(
    () => fields.find((f) => f.variableKey === 'data_de_nascimento'),
    [fields],
  )
  const ageField = useMemo(
    () => fields.find((f) => f.variableKey === 'idade'),
    [fields],
  )
  const birthAnswer = useMemo(
    () => answers.find((a) => a.fieldId === birthField?.id),
    [answers, birthField?.id],
  )
  const ageAnswer = useMemo(
    () => answers.find((a) => a.fieldId === ageField?.id),
    [answers, ageField?.id],
  )

  useEffect(() => {
    if (!birthField || !ageField) return
    const birthValue = birthAnswer?.value ?? ''
    if (!birthValue) return
    const calculated = calculateAge(birthValue)
    if (!calculated) return
    if (calculated === ageAnswer?.value) return
    onAnswerChange({
      fieldId: ageField.id,
      value: calculated,
      selectedOptionIds: [],
      scaleValue: null,
      likertAnswers: {},
    })
  }, [birthField, ageField, birthAnswer?.value, ageAnswer?.value, onAnswerChange])

  return {
    isAgeAutoCalculated: Boolean(birthField && ageField),
    ageFieldId: ageField?.id ?? null,
  }
}
