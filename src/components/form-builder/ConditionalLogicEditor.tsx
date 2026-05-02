import { useMemo } from 'react'
import type { ConditionalOperator, ConditionalRule, FormField } from '@/types'
import { CONDITIONAL_OPERATOR_LABELS } from '@/types'
import { TrashIcon } from '@/components/icons'

interface ConditionalLogicEditorProps {
  field: FormField
  allFields: FormField[]
  onUpdate: (rules: ConditionalRule[] | undefined) => void
}

const ALL_OPERATORS: ConditionalOperator[] = [
  'EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER', 'LESS', 'IS_EMPTY',
]

function operatorsForFieldType(type: FormField['type']): ConditionalOperator[] {
  switch (type) {
    case 'short-text':
    case 'long-text':
      return ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'IS_EMPTY']
    case 'date':
      return ['EQUALS', 'NOT_EQUALS', 'GREATER', 'LESS', 'IS_EMPTY']
    case 'yes-no':
      return ['EQUALS', 'NOT_EQUALS', 'IS_EMPTY']
    case 'scale':
      return ['EQUALS', 'NOT_EQUALS', 'GREATER', 'LESS', 'IS_EMPTY']
    case 'single-choice':
    case 'inventory-item':
      return ['EQUALS', 'NOT_EQUALS', 'IS_EMPTY']
    case 'multiple-choice':
      return ['CONTAINS', 'IS_EMPTY']
    default:
      return []
  }
}

function ValueEditor({
  sourceField,
  operator,
  value,
  onChange,
}: {
  sourceField: FormField
  operator: ConditionalOperator
  value: string | number | undefined
  onChange: (value: string | number) => void
}) {
  if (operator === 'IS_EMPTY') return null

  const cls = 'flex-1 min-w-0 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none'

  switch (sourceField.type) {
    case 'yes-no':
      return (
        <select className={cls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          <option value="sim">Sim</option>
          <option value="não">Não</option>
        </select>
      )
    case 'single-choice':
    case 'inventory-item':
    case 'multiple-choice':
      return (
        <select className={cls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {sourceField.options.map((o) => (
            <option key={o.id} value={o.id}>{o.label || '(sem texto)'}</option>
          ))}
        </select>
      )
    case 'scale':
      return (
        <input
          type="number"
          className={cls}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          min={sourceField.scaleMin}
          max={sourceField.scaleMax}
        />
      )
    case 'date':
      return (
        <input
          type="date"
          className={cls}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    default:
      return (
        <input
          type="text"
          className={cls}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder="valor"
        />
      )
  }
}

export default function ConditionalLogicEditor({
  field,
  allFields,
  onUpdate,
}: ConditionalLogicEditorProps) {
  const rules = field.showWhen ?? []

  const sourceOptions = useMemo(
    () =>
      allFields.filter(
        (f) =>
          f.id !== field.id &&
          f.type !== 'section-header' &&
          f.type !== 'likert-matrix',
      ),
    [allFields, field.id],
  )

  const addRule = () => {
    if (sourceOptions.length === 0) return
    const next: ConditionalRule = {
      questionRef: sourceOptions[0].id,
      operator: 'EQUALS',
      value: '',
      combinator: rules[0]?.combinator ?? 'AND',
    }
    onUpdate([...rules, next])
  }

  const updateRule = (idx: number, patch: Partial<ConditionalRule>) => {
    onUpdate(rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const removeRule = (idx: number) => {
    const next = rules.filter((_, i) => i !== idx)
    onUpdate(next.length === 0 ? undefined : next)
  }

  const setCombinator = (combinator: 'AND' | 'OR') => {
    onUpdate(rules.map((r) => ({ ...r, combinator })))
  }

  const combinator = rules[0]?.combinator ?? 'AND'

  if (sourceOptions.length === 0) {
    return (
      <div className="bg-amber-50/60 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
        Crie outra pergunta antes para usar como fonte da condição.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Mostrar esta pergunta quando:
        </p>
        {rules.length >= 2 && (
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-md p-0.5">
            {(['AND', 'OR'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCombinator(c)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  combinator === c ? 'bg-brand-500 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {c === 'AND' ? 'todas' : 'qualquer'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {rules.map((rule, idx) => {
          const sourceField = allFields.find((f) => f.id === rule.questionRef)
          const operators = sourceField ? operatorsForFieldType(sourceField.type) : ALL_OPERATORS
          return (
            <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
              <select
                className="flex-1 min-w-0 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                value={rule.questionRef}
                onChange={(e) => {
                  const newSource = allFields.find((f) => f.id === e.target.value)
                  const validOps = newSource ? operatorsForFieldType(newSource.type) : []
                  const newOp = validOps.includes(rule.operator) ? rule.operator : (validOps[0] ?? 'EQUALS')
                  updateRule(idx, { questionRef: e.target.value, operator: newOp, value: '' })
                }}
              >
                {sourceOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label || '(sem texto)'}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                value={rule.operator}
                onChange={(e) => updateRule(idx, { operator: e.target.value as ConditionalOperator })}
              >
                {operators.map((op) => (
                  <option key={op} value={op}>{CONDITIONAL_OPERATOR_LABELS[op]}</option>
                ))}
              </select>
              {sourceField && (
                <ValueEditor
                  sourceField={sourceField}
                  operator={rule.operator}
                  value={rule.value}
                  onChange={(v) => updateRule(idx, { value: v })}
                />
              )}
              <button
                type="button"
                onClick={() => removeRule(idx)}
                className="shrink-0 p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                title="Remover regra"
              >
                <TrashIcon />
              </button>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addRule}
        className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        + Adicionar regra
      </button>
    </div>
  )
}
