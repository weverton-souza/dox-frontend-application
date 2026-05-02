import type {
  ComparisonResult,
  ComparisonRespondent,
  FormField,
  FormFieldAnswer,
  FormSectionGroup,
  ScoreResult,
} from '@/types'
import type { RespondentColor } from '@/lib/respondent-colors'

interface RespondentVisual {
  respondent: ComparisonRespondent
  index: number
  color: RespondentColor
  initials: string
  label: string
}

interface ComparisonFormViewProps {
  data: ComparisonResult
  sectionGroups: FormSectionGroup[]
  visuals: RespondentVisual[]
}

function getAnswer(visual: RespondentVisual, fieldId: string): FormFieldAnswer | undefined {
  return visual.respondent.answers.find((a) => a.fieldId === fieldId)
}

interface CellValue {
  label: string
  value?: number | null
}

function renderCellValue(field: FormField, answer: FormFieldAnswer | undefined): CellValue {
  if (!answer) return { label: '—' }
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
      return { label: answer.value || '—' }
    case 'yes-no':
      return { label: answer.value ? answer.value.charAt(0).toUpperCase() + answer.value.slice(1) : '—' }
    case 'scale':
      return {
        label: answer.scaleValue !== null && answer.scaleValue !== undefined ? String(answer.scaleValue) : '—',
        value: answer.scaleValue,
      }
    case 'single-choice':
    case 'inventory-item': {
      const id = answer.selectedOptionIds[0]
      const opt = field.options.find((o) => o.id === id)
      if (!opt) return { label: '—' }
      return { label: opt.label, value: opt.value ?? null }
    }
    case 'multiple-choice':
      return {
        label:
          answer.selectedOptionIds
            .map((id) => field.options.find((o) => o.id === id)?.label)
            .filter(Boolean)
            .join(', ') || '—',
      }
    default:
      return { label: '—' }
  }
}

function renderLikertCell(field: FormField, rowId: string, answer: FormFieldAnswer | undefined): CellValue {
  if (!answer) return { label: '—' }
  const v = answer.likertAnswers[rowId]
  if (v === undefined || v === null) return { label: '—' }
  const point = field.likertScale.find((p) => p.value === v)
  return { label: point ? point.label : String(v), value: v }
}

interface QuestionRow {
  id: string
  label: string
  reverseScored?: boolean
  cellRender: (visual: RespondentVisual) => CellValue
}

function buildRowsForField(field: FormField): QuestionRow[] {
  if (field.type === 'likert-matrix') {
    return field.likertRows.map((row) => ({
      id: `${field.id}:${row.id}`,
      label: row.label || 'Pergunta',
      reverseScored: row.reverseScored,
      cellRender: (v) => renderLikertCell(field, row.id, getAnswer(v, field.id)),
    }))
  }
  if (field.type === 'section-header') return []
  return [
    {
      id: field.id,
      label: field.label || '(pergunta sem título)',
      reverseScored: field.reverseScored,
      cellRender: (v) => renderCellValue(field, getAnswer(v, field.id)),
    },
  ]
}

function CellContent({ cell, color }: { cell: CellValue; color: RespondentColor }) {
  const hasValue = cell.value !== null && cell.value !== undefined && cell.label !== '—'
  return (
    <span className={`text-sm ${color.text} font-medium`}>
      {cell.label}
      {hasValue && <span className="ml-1.5 text-xs opacity-70">({cell.value})</span>}
    </span>
  )
}

function ScoreCell({ score, color }: { score: ScoreResult | undefined; color: RespondentColor }) {
  if (!score || score.value === null || score.value === undefined) {
    return <span className="text-gray-400">—</span>
  }
  return (
    <span className={`flex items-center gap-2 text-sm font-semibold ${color.text}`}>
      <span className="text-base">{score.value}</span>
      {score.classification && (
        <span className={`text-xs px-2 py-0.5 rounded ${color.light} ${color.text} font-medium`}>
          {score.classification}
        </span>
      )}
    </span>
  )
}

export default function ComparisonFormView({ data, sectionGroups, visuals }: ComparisonFormViewProps) {
  if (visuals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
        Aguardando respostas
      </div>
    )
  }

  const scoreFormulas = data.respondents[0]?.scoreBreakdown ?? []

  return (
    <div className="space-y-3">
      {sectionGroups.map((group) => {
        const rows = group.children.flatMap(buildRowsForField)
        if (rows.length === 0) return null
        return (
          <div key={group.sectionFieldId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {group.sectionField && (
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">
                  {group.sectionField.label || 'Seção'}
                </h2>
                {group.sectionField.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{group.sectionField.description}</p>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wide w-[44%] min-w-[220px]">
                      Pergunta
                    </th>
                    {visuals.map((v) => (
                      <th
                        key={v.respondent.linkId}
                        className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide min-w-[140px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`shrink-0 w-5 h-5 rounded-full ${v.color.bg} flex items-center justify-center text-[10px] font-semibold text-white`}
                          >
                            {v.initials}
                          </span>
                          <span className={`${v.color.text} normal-case truncate`} title={v.respondent.respondentName ?? ''}>
                            {v.respondent.respondentName?.split(' ')[0] ?? '—'}
                            <span className="text-gray-400 font-normal ml-1">({v.label})</span>
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 last:border-b-0">
                      <td className="px-4 py-2.5 text-gray-700 align-top">
                        {row.label}
                        {row.reverseScored && <span className="ml-1.5 text-xs text-gray-400">(reverso)</span>}
                      </td>
                      {visuals.map((v) => (
                        <td key={v.respondent.linkId} className={`px-3 py-2.5 align-top ${v.color.light}`}>
                          <CellContent cell={row.cellRender(v)} color={v.color} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {scoreFormulas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-50/40 border-b border-brand-100">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wide w-[44%] min-w-[220px]">
                    Pontuação
                  </th>
                  {visuals.map((v) => (
                    <th key={v.respondent.linkId} className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide min-w-[140px]">
                      <span className={v.color.text}>{v.respondent.respondentName?.split(' ')[0] ?? '—'}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scoreFormulas.map((firstScore, idx) => (
                  <tr key={firstScore.formulaId} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-4 py-3 font-semibold text-gray-900 align-top">
                      {firstScore.name}
                    </td>
                    {visuals.map((v) => (
                      <td key={v.respondent.linkId} className={`px-3 py-3 align-top ${v.color.light}`}>
                        <ScoreCell score={v.respondent.scoreBreakdown[idx]} color={v.color} />
                      </td>
                    ))}
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
