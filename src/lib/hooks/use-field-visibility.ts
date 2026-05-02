import { useMemo } from 'react'
import type {
  ConditionalRule,
  FormField,
  FormFieldAnswer,
} from '@/types'

function answerIsEmpty(field: FormField, answer: FormFieldAnswer | undefined): boolean {
  if (!answer) return true
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
    case 'yes-no':
      return !answer.value
    case 'scale':
      return answer.scaleValue === null || answer.scaleValue === undefined
    case 'single-choice':
    case 'inventory-item':
    case 'multiple-choice':
      return answer.selectedOptionIds.length === 0
    case 'likert-matrix':
      return Object.keys(answer.likertAnswers).length === 0
    default:
      return true
  }
}

function valueToString(v: string | number | undefined): string {
  if (v === undefined || v === null) return ''
  return String(v)
}

function valueToNumber(v: string | number | undefined): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function evaluateRule(
  rule: ConditionalRule,
  field: FormField,
  answer: FormFieldAnswer | undefined,
): boolean {
  if (rule.operator === 'IS_EMPTY') {
    return answerIsEmpty(field, answer)
  }

  if (!answer) return false

  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
    case 'yes-no': {
      const left = answer.value || ''
      const right = valueToString(rule.value)
      switch (rule.operator) {
        case 'EQUALS': return left === right
        case 'NOT_EQUALS': return left !== right
        case 'CONTAINS': return left.toLowerCase().includes(right.toLowerCase())
        case 'GREATER':
          if (field.type === 'date') return left > right
          return false
        case 'LESS':
          if (field.type === 'date') return left < right
          return false
        default: return false
      }
    }
    case 'scale': {
      const left = answer.scaleValue
      const right = valueToNumber(rule.value)
      if (left === null || left === undefined || right === null) return false
      switch (rule.operator) {
        case 'EQUALS': return left === right
        case 'NOT_EQUALS': return left !== right
        case 'GREATER': return left > right
        case 'LESS': return left < right
        default: return false
      }
    }
    case 'single-choice':
    case 'inventory-item': {
      const selected = answer.selectedOptionIds[0]
      const right = valueToString(rule.value)
      switch (rule.operator) {
        case 'EQUALS': return selected === right
        case 'NOT_EQUALS': return selected !== right
        default: return false
      }
    }
    case 'multiple-choice': {
      const right = valueToString(rule.value)
      switch (rule.operator) {
        case 'CONTAINS': return answer.selectedOptionIds.includes(right)
        default: return false
      }
    }
    default:
      return false
  }
}

function evaluateRules(
  rules: ConditionalRule[],
  fields: FormField[],
  answers: FormFieldAnswer[],
): boolean {
  if (rules.length === 0) return true
  const fieldsById = new Map(fields.map((f) => [f.id, f]))
  const answersById = new Map(answers.map((a) => [a.fieldId, a]))
  const combinator = rules[0]?.combinator ?? 'AND'
  const results = rules.map((rule) => {
    const sourceField = fieldsById.get(rule.questionRef)
    if (!sourceField) return false
    return evaluateRule(rule, sourceField, answersById.get(rule.questionRef))
  })
  return combinator === 'OR' ? results.some(Boolean) : results.every(Boolean)
}

export function useFieldVisibility(
  fields: FormField[],
  answers: FormFieldAnswer[],
): Set<string> {
  return useMemo(() => {
    const visible = new Set<string>()
    for (const field of fields) {
      if (!field.showWhen || field.showWhen.length === 0) {
        visible.add(field.id)
        continue
      }
      if (evaluateRules(field.showWhen, fields, answers)) {
        visible.add(field.id)
      }
    }

    // Cascade: se section-header está invisível, todas as perguntas dela
    // (até a próxima section-header) também ficam invisíveis.
    const ordered = [...fields].sort((a, b) => a.order - b.order)
    let currentSectionVisible = true
    for (const field of ordered) {
      if (field.type === 'section-header') {
        currentSectionVisible = visible.has(field.id)
        continue
      }
      if (!currentSectionVisible) {
        visible.delete(field.id)
      }
    }

    return visible
  }, [fields, answers])
}

/**
 * Detecta referências circulares: A depende de B que depende de A.
 * Retorna lista de IDs envolvidos em ciclo.
 */
export function detectCircularReferences(fields: FormField[]): string[] {
  const adj = new Map<string, string[]>()
  for (const f of fields) {
    if (f.showWhen && f.showWhen.length > 0) {
      adj.set(f.id, f.showWhen.map((r) => r.questionRef))
    }
  }
  const inCycle = new Set<string>()
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function dfs(id: string): boolean {
    if (visiting.has(id)) {
      inCycle.add(id)
      return true
    }
    if (visited.has(id)) return false
    visiting.add(id)
    for (const next of adj.get(id) ?? []) {
      if (dfs(next)) inCycle.add(id)
    }
    visiting.delete(id)
    visited.add(id)
    return inCycle.has(id)
  }

  for (const id of adj.keys()) dfs(id)
  return Array.from(inCycle)
}
