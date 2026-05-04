import { useState, useEffect } from 'react'
import type {
  FormField,
  ScoringConfig,
  ScoringFormula,
  ScoringClassificationRange,
  ScoringOperation,
} from '@/types'
import {
  SCORING_OPERATION_LABELS,
  createEmptyScoringFormula,
  isScorableFieldType,
} from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { CloseIcon, TrashIcon } from '@/components/icons'

interface ScoringTabProps {
  fields: FormField[]
  scoringConfig: ScoringConfig
  onChange: (config: ScoringConfig) => void
}

export default function ScoringTab({ fields, scoringConfig, onChange }: ScoringTabProps) {
  const scorableFields = fields.filter((f) => isScorableFieldType(f.type))
  const fieldsById = new Map(fields.map((f) => [f.id, f]))

  const updateFormula = (id: string, patch: Partial<ScoringFormula>) => {
    onChange({
      formulas: scoringConfig.formulas.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })
  }

  const addFormula = () => {
    onChange({ formulas: [...scoringConfig.formulas, createEmptyScoringFormula()] })
  }

  const removeFormula = (id: string) => {
    onChange({ formulas: scoringConfig.formulas.filter((f) => f.id !== id) })
  }

  if (scorableFields.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500 mb-2">Nenhuma pergunta pontuável neste formulário.</p>
        <p className="text-xs text-gray-400">
          Adicione perguntas do tipo Inventário, Matriz Likert ou Escala linear para configurar pontuação.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Helper card */}
      <div className="bg-brand-50/50 border border-brand-100 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
        <p className="font-medium mb-1">Como funciona</p>
        <p className="text-xs text-gray-600">
          Uma <strong>fórmula</strong> soma (ou faz média) das pontuações das perguntas selecionadas e produz um número.
          As <strong>faixas</strong> traduzem esse número em uma classificação clínica (ex: 0–13 = Mínima, 14–19 = Leve).
          Exemplo: BDI-II soma 21 perguntas e classifica em Mínima/Leve/Moderada/Grave conforme o total.
        </p>
      </div>

      {scoringConfig.formulas.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500 mb-3">Nenhuma fórmula configurada.</p>
          <Button onClick={addFormula} variant="primary" size="sm">
            Adicionar fórmula
          </Button>
        </div>
      ) : (
        <>
          {scoringConfig.formulas.map((formula) => (
            <FormulaCard
              key={formula.id}
              formula={formula}
              scorableFields={scorableFields}
              fieldsById={fieldsById}
              onUpdate={(patch) => updateFormula(formula.id, patch)}
              onRemove={() => removeFormula(formula.id)}
            />
          ))}
          <button
            type="button"
            onClick={addFormula}
            className="w-full py-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            + Adicionar fórmula
          </button>
        </>
      )}
    </div>
  )
}

interface FormulaCardProps {
  formula: ScoringFormula
  scorableFields: FormField[]
  fieldsById: Map<string, FormField>
  onUpdate: (patch: Partial<ScoringFormula>) => void
  onRemove: () => void
}

function FormulaCard({ formula, scorableFields, fieldsById, onUpdate, onRemove }: FormulaCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const removeField = (fieldId: string) => {
    onUpdate({ fieldIds: formula.fieldIds.filter((id) => id !== fieldId) })
  }

  const addClassification = () => {
    const ranges = formula.classification
    const lastMax = ranges.length > 0 ? ranges[ranges.length - 1].max : 0
    onUpdate({
      classification: [...ranges, { min: lastMax + 1, max: lastMax + 10, label: '' }],
    })
  }

  const updateClassification = (index: number, patch: Partial<ScoringClassificationRange>) => {
    onUpdate({
      classification: formula.classification.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    })
  }

  const removeClassification = (index: number) => {
    onUpdate({ classification: formula.classification.filter((_, i) => i !== index) })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-gray-100">
        <input
          type="text"
          value={formula.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nome da fórmula (ex: Score Total)"
          className="flex-1 text-base text-gray-900 bg-gray-50 border-b border-gray-300 px-2 py-2 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
        />
        <select
          value={formula.operation}
          onChange={(e) => onUpdate({ operation: e.target.value as ScoringOperation })}
          className="shrink-0 text-sm bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none cursor-pointer"
        >
          {(Object.keys(SCORING_OPERATION_LABELS) as ScoringOperation[]).map((op) => (
            <option key={op} value={op}>{SCORING_OPERATION_LABELS[op]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
          title="Remover fórmula"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Perguntas incluídas ({formula.fieldIds.length})
          </span>
          <Button onClick={() => setPickerOpen(true)} variant="ghost" size="sm">
            + Adicionar perguntas
          </Button>
        </div>

        {formula.fieldIds.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">Nenhuma pergunta selecionada.</p>
        ) : (
          <ul className="space-y-1.5">
            {formula.fieldIds.map((fid) => {
              const f = fieldsById.get(fid)
              return (
                <li key={fid} className="flex items-center gap-2 group/f bg-gray-50 rounded px-3 py-2">
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {f ? (f.label || `(${f.type})`) : `[campo removido: ${fid}]`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeField(fid)}
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-400 opacity-0 group-hover/f:opacity-100 transition-opacity"
                    title="Remover desta fórmula"
                  >
                    <CloseIcon />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Classification ranges */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500">Faixas de classificação</span>
            <p className="text-xs text-gray-400 mt-0.5">
              Traduzem o valor calculado em um rótulo. Ex: 0 a 13 → Mínima.
            </p>
          </div>
          <Button onClick={addClassification} variant="ghost" size="sm">
            + Faixa
          </Button>
        </div>

        {formula.classification.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-1">
            Sem faixas. O resultado mostra apenas o valor numérico.
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="grid grid-cols-[64px_auto_64px_auto_1fr_auto] gap-2 text-[10px] uppercase tracking-wide text-gray-400 px-1">
              <span>De</span>
              <span></span>
              <span>Até</span>
              <span></span>
              <span>Rótulo</span>
              <span></span>
            </div>
            {formula.classification.map((range, index) => (
              <div key={`range-${index}-${range.label}`} className="grid grid-cols-[64px_auto_64px_auto_1fr_auto] gap-2 items-center group/r">
                <input
                  type="number"
                  value={range.min}
                  onChange={(e) => updateClassification(index, { min: Number(e.target.value) })}
                  className="text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-center focus:border-brand-500 focus:outline-none"
                />
                <span className="text-xs text-gray-400">a</span>
                <input
                  type="number"
                  value={range.max}
                  onChange={(e) => updateClassification(index, { max: Number(e.target.value) })}
                  className="text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-center focus:border-brand-500 focus:outline-none"
                />
                <span className="text-xs text-gray-400">→</span>
                <input
                  type="text"
                  value={range.label}
                  onChange={(e) => updateClassification(index, { label: e.target.value })}
                  placeholder="ex: Mínima"
                  className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => removeClassification(index)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-400 opacity-0 group-hover/r:opacity-100 transition-opacity"
                  title="Remover faixa"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picker modal */}
      <FieldPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        scorableFields={scorableFields}
        selectedIds={formula.fieldIds}
        onConfirm={(ids) => {
          onUpdate({ fieldIds: ids })
          setPickerOpen(false)
        }}
      />
    </div>
  )
}

interface FieldPickerProps {
  isOpen: boolean
  onClose: () => void
  scorableFields: FormField[]
  selectedIds: string[]
  onConfirm: (ids: string[]) => void
}

function FieldPickerModal({ isOpen, onClose, scorableFields, selectedIds, onConfirm }: FieldPickerProps) {
  const [draft, setDraft] = useState<string[]>(selectedIds)

  useEffect(() => {
    if (isOpen) setDraft(selectedIds)
  }, [isOpen, selectedIds])

  const toggle = (id: string) => {
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecionar perguntas pontuáveis"
      size="md"
    >
      <div className="p-4 space-y-3">
        <p className="text-xs text-gray-500">
          Apenas perguntas dos tipos Inventário, Matriz Likert e Escala linear aparecem aqui.
        </p>
        {scorableFields.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Nenhuma pergunta pontuável disponível.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {scorableFields.map((f) => {
              const checked = draft.includes(f.id)
              return (
                <label
                  key={f.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    checked ? 'bg-brand-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(f.id)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {f.label || `(${f.type})`}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{f.type}</span>
                </label>
              )
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(draft)}>Confirmar</Button>
        </div>
      </div>
    </Modal>
  )
}
