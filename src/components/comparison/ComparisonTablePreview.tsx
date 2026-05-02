import type { ComparisonResult, ComparisonRespondent, FormField, FormFieldAnswer } from '@/types'
import type { RespondentColor } from '@/lib/respondent-colors'

const DIVERGENCE_THRESHOLD = 5

interface RespondentVisual {
  respondent: ComparisonRespondent
  index: number
  color: RespondentColor
  initials: string
  label: string
}

interface ComparisonTablePreviewProps {
  data: ComparisonResult
  visuals: RespondentVisual[]
}

function findAnswer(answers: FormFieldAnswer[], fieldId: string): FormFieldAnswer | undefined {
  return answers.find((a) => a.fieldId === fieldId)
}

function renderAnswerValue(field: FormField, answer: FormFieldAnswer | undefined): string {
  if (!answer) return '—'
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
    case 'yes-no':
      return answer.value || '—'
    case 'scale':
      return answer.scaleValue !== null && answer.scaleValue !== undefined ? String(answer.scaleValue) : '—'
    case 'single-choice':
    case 'inventory-item': {
      const id = answer.selectedOptionIds[0]
      const opt = field.options.find((o) => o.id === id)
      if (!opt) return '—'
      return opt.value !== undefined ? `${opt.label} (${opt.value})` : opt.label
    }
    case 'multiple-choice':
      return answer.selectedOptionIds
        .map((id) => field.options.find((o) => o.id === id)?.label)
        .filter(Boolean)
        .join(', ') || '—'
    default:
      return '—'
  }
}

function renderLikertCell(field: FormField, rowId: string, answer: FormFieldAnswer | undefined): string {
  if (!answer) return '—'
  const v = answer.likertAnswers[rowId]
  if (v === undefined || v === null) return '—'
  const point = field.likertScale.find((p) => p.value === v)
  return point ? `${v} (${point.label})` : String(v)
}

export default function ComparisonTablePreview({ data, visuals }: ComparisonTablePreviewProps) {
  const flatFields = data.fields
  const likertFields = flatFields.filter((f) => f.type === 'likert-matrix')
  const nonLikertFields = flatFields.filter((f) => f.type !== 'likert-matrix' && f.type !== 'section-header')

  const answeredVisuals = visuals.filter((v) => v.respondent.status === 'answered')

  const divergenceByField = new Map<string, boolean>()
  for (const field of flatFields) {
    if (field.type !== 'inventory-item' && field.type !== 'scale') continue
    const values: number[] = []
    for (const v of answeredVisuals) {
      const answer = findAnswer(v.respondent.answers, field.id)
      if (!answer) continue
      if (field.type === 'scale' && answer.scaleValue !== null && answer.scaleValue !== undefined) {
        values.push(answer.scaleValue)
      } else if (field.type === 'inventory-item') {
        const opt = field.options.find((o) => o.id === answer.selectedOptionIds[0])
        if (opt?.value !== undefined && opt.value !== null) values.push(opt.value)
      }
    }
    if (values.length >= 2) {
      const diff = Math.max(...values) - Math.min(...values)
      if (diff >= DIVERGENCE_THRESHOLD) divergenceByField.set(field.id, true)
    }
  }

  const totalsRow = data.respondents.map((r) => {
    const total = r.scoreBreakdown[0]
    return total ? { value: total.value, classification: total.classification } : null
  })

  const hasSubscales = data.respondents[0]?.scoreBreakdown.length > 1

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[240px]">
                  Pergunta
                </th>
                {visuals.map((v) => (
                  <th key={v.respondent.linkId} className="text-left px-4 py-3 font-semibold min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 w-7 h-7 rounded-full ${v.color.bg} flex items-center justify-center text-xs font-semibold text-white`}
                      >
                        {v.initials}
                      </span>
                      <div className="min-w-0">
                        <p className={`${v.color.text} truncate`}>{v.respondent.respondentName || '(sem nome)'}</p>
                        <p className="text-xs text-gray-500 font-normal">{v.label}</p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nonLikertFields.map((field) => {
                const isDivergent = divergenceByField.get(field.id) ?? false
                return (
                  <tr key={field.id} className={`border-b border-gray-100 ${isDivergent ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-2.5 sticky left-0 bg-white">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-700">{field.label}</span>
                        {isDivergent && (
                          <span title={`Diferença ≥ ${DIVERGENCE_THRESHOLD} pontos`} className="text-amber-600 text-xs">⚠</span>
                        )}
                      </div>
                    </td>
                    {visuals.map((v) => {
                      const answer = findAnswer(v.respondent.answers, field.id)
                      const display = v.respondent.status === 'answered' ? renderAnswerValue(field, answer) : '⏳'
                      return (
                        <td key={v.respondent.linkId} className="px-4 py-2.5 text-gray-600">
                          {display}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {likertFields.flatMap((field) =>
                field.likertRows.map((row) => (
                  <tr key={`${field.id}:${row.id}`} className="border-b border-gray-100">
                    <td className="px-4 py-2.5 sticky left-0 bg-white">
                      <span className="text-gray-700">{row.label}</span>
                      {row.reverseScored && <span className="ml-1 text-xs text-gray-400">(reverso)</span>}
                    </td>
                    {visuals.map((v) => {
                      const answer = findAnswer(v.respondent.answers, field.id)
                      const display = v.respondent.status === 'answered' ? renderLikertCell(field, row.id, answer) : '⏳'
                      return (
                        <td key={v.respondent.linkId} className="px-4 py-2.5 text-gray-600">
                          {display}
                        </td>
                      )
                    })}
                  </tr>
                )),
              )}

              {totalsRow.some((t) => t !== null) && (
                <tr className="bg-brand-50/40 border-t-2 border-brand-200 font-semibold">
                  <td className="px-4 py-3 sticky left-0 bg-brand-50/40 text-gray-900">
                    {data.respondents[0]?.scoreBreakdown[0]?.name ?? 'Score Total'}
                  </td>
                  {totalsRow.map((cell, idx) => {
                    const v = visuals[idx]
                    return (
                      <td key={v.respondent.linkId} className="px-4 py-3 text-gray-900">
                        {cell?.value !== null && cell?.value !== undefined ? (
                          <span className="flex items-center gap-2">
                            <span className="text-base">{cell.value}</span>
                            {cell.classification && (
                              <span className="text-xs px-2 py-0.5 rounded bg-brand-100 text-brand-700">
                                {cell.classification}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasSubscales && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Subescalas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-medium text-gray-500 min-w-[180px]">Subescala</th>
                  {visuals.map((v) => (
                    <th key={v.respondent.linkId} className={`text-left px-3 py-2 font-medium min-w-[140px] ${v.color.text}`}>
                      {v.respondent.respondentName || '(sem nome)'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.respondents[0].scoreBreakdown.slice(1).map((firstScore, idx) => (
                  <tr key={firstScore.formulaId} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-gray-700">{firstScore.name}</td>
                    {data.respondents.map((r) => {
                      const score = r.scoreBreakdown[idx + 1]
                      return (
                        <td key={r.linkId} className="px-3 py-2">
                          {score?.value !== null && score?.value !== undefined ? (
                            <span className="flex items-center gap-2">
                              <span className="text-gray-900">{score.value}</span>
                              {score.classification && (
                                <span className="text-xs text-gray-500">({score.classification})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
