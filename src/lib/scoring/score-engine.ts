import type {
  FormField,
  FormFieldAnswer,
  ScoringClassificationRange,
  ScoringConfig,
  ScoringFormula,
  ScoringOperation,
} from '@/types'

export interface ScoreResult {
  formulaId: string
  name: string
  operation: ScoringOperation
  value: number | null
  classification: string | null
  contributionsCount: number
}

function maxValueOfField(field: FormField): number {
  if (field.type === 'inventory-item') {
    return field.options.reduce((max, o) => Math.max(max, o.value ?? 0), 0)
  }
  if (field.type === 'likert-matrix') {
    return field.likertScale.reduce((max, p) => Math.max(max, p.value), 0)
  }
  if (field.type === 'scale') {
    return field.scaleMax
  }
  return 0
}

function answerValuesForField(field: FormField, answer: FormFieldAnswer | undefined): number[] {
  if (!answer) return []

  if (field.type === 'inventory-item') {
    const selectedId = answer.selectedOptionIds[0]
    if (!selectedId) return []
    const opt = field.options.find((o) => o.id === selectedId)
    if (!opt || opt.value === undefined || opt.value === null) return []
    const value = field.reverseScored ? maxValueOfField(field) - opt.value : opt.value
    return [value]
  }

  if (field.type === 'likert-matrix') {
    const max = maxValueOfField(field)
    const values: number[] = []
    for (const row of field.likertRows) {
      const v = answer.likertAnswers[row.id]
      if (v === undefined || v === null) continue
      values.push(row.reverseScored ? max - v : v)
    }
    return values
  }

  if (field.type === 'scale') {
    return answer.scaleValue !== null ? [answer.scaleValue] : []
  }

  return []
}

function applyOperation(operation: ScoringOperation, values: number[]): number | null {
  if (values.length === 0) return operation === 'count' ? 0 : null

  switch (operation) {
    case 'sum':
      return values.reduce((acc, v) => acc + v, 0)
    case 'mean':
      return values.reduce((acc, v) => acc + v, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    case 'count':
      return values.length
  }
}

function classifyValue(value: number, ranges: ScoringClassificationRange[]): string | null {
  for (const r of ranges) {
    if (value >= r.min && value <= r.max) return r.label
  }
  return null
}

export function calculateScore(
  formula: ScoringFormula,
  fields: FormField[],
  answers: FormFieldAnswer[],
): ScoreResult {
  const fieldsById = new Map(fields.map((f) => [f.id, f]))
  const answersByField = new Map(answers.map((a) => [a.fieldId, a]))

  const collected: number[] = []
  for (const fid of formula.fieldIds) {
    const field = fieldsById.get(fid)
    if (!field) continue
    collected.push(...answerValuesForField(field, answersByField.get(fid)))
  }

  const value = applyOperation(formula.operation, collected)
  const classification =
    value !== null && formula.classification.length > 0
      ? classifyValue(value, formula.classification)
      : null

  return {
    formulaId: formula.id,
    name: formula.name,
    operation: formula.operation,
    value,
    classification,
    contributionsCount: collected.length,
  }
}

export function calculateAllScores(
  config: ScoringConfig,
  fields: FormField[],
  answers: FormFieldAnswer[],
): ScoreResult[] {
  return config.formulas.map((f) => calculateScore(f, fields, answers))
}
