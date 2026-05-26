import type { AssessmentEntry, AssessmentScore } from '@/types'
import { createEmptyAssessmentScore } from '@/types'

interface AssessmentEntrySimpleProps {
  entry: AssessmentEntry
  onChange: (entry: AssessmentEntry) => void
}

export default function AssessmentEntrySimple({ entry, onChange }: AssessmentEntrySimpleProps) {
  const updateScore = (idx: number, patch: Partial<AssessmentScore>) => {
    const next = entry.scores.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    onChange({ ...entry, scores: next })
  }

  const addScore = () => {
    onChange({ ...entry, scores: [...entry.scores, createEmptyAssessmentScore()] })
  }

  const removeScore = (idx: number) => {
    onChange({ ...entry, scores: entry.scores.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Escores</label>
        <div className="grid grid-cols-12 gap-2 mb-1 px-1 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          <div className="col-span-2">Índice</div>
          <div className="col-span-5">Nome do escore</div>
          <div className="col-span-2">Valor</div>
          <div className="col-span-2">Classificação</div>
          <div className="col-span-1" />
        </div>
        <div className="space-y-1.5">
          {entry.scores.map((score, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-start">
              <input
                value={score.index}
                onChange={e => updateScore(idx, { index: e.target.value })}
                placeholder="QIT"
                className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                value={score.label}
                onChange={e => updateScore(idx, { label: e.target.value })}
                placeholder="QI Total"
                className="col-span-5 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                value={score.value}
                onChange={e => updateScore(idx, { value: e.target.value })}
                placeholder="95"
                className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                value={score.classification ?? ''}
                onChange={e => updateScore(idx, { classification: e.target.value })}
                placeholder="Médio"
                className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => removeScore(idx)}
                className="col-span-1 text-gray-400 hover:text-red-600 text-lg justify-self-end"
                aria-label="Remover escore"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addScore}
          className="text-xs text-brand-500 hover:underline mt-1"
        >
          + Adicionar escore
        </button>
        {entry.scores.length === 0 && (
          <p className="text-xs text-gray-500 italic mt-1">
            Nenhum escore. Pode salvar só com observação clínica abaixo.
          </p>
        )}
      </div>
    </div>
  )
}
