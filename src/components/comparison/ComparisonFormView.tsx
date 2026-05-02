import type { ComparisonRespondent, FormField, FormFieldAnswer, FormSectionGroup } from '@/types'
import type { RespondentColor } from '@/lib/respondent-colors'

interface RespondentVisual {
  respondent: ComparisonRespondent
  index: number
  color: RespondentColor
  initials: string
  label: string
}

interface ComparisonFormViewProps {
  sectionGroups: FormSectionGroup[]
  visuals: RespondentVisual[]
}

function getAnswer(visual: RespondentVisual, fieldId: string): FormFieldAnswer | undefined {
  return visual.respondent.answers.find((a) => a.fieldId === fieldId)
}

function renderCellValue(field: FormField, answer: FormFieldAnswer | undefined): string {
  if (!answer) return '—'
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
      return answer.value || '—'
    case 'yes-no':
      return answer.value ? answer.value.charAt(0).toUpperCase() + answer.value.slice(1) : '—'
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
      return (
        answer.selectedOptionIds
          .map((id) => field.options.find((o) => o.id === id)?.label)
          .filter(Boolean)
          .join(', ') || '—'
      )
    default:
      return '—'
  }
}

function renderLikertCell(field: FormField, rowId: string, answer: FormFieldAnswer | undefined): string {
  if (!answer) return '—'
  const v = answer.likertAnswers[rowId]
  if (v === undefined || v === null) return '—'
  const point = field.likertScale.find((p) => p.value === v)
  return point ? point.label : String(v)
}

interface QuestionRow {
  id: string
  label: string
  reverseScored?: boolean
  cellRender: (visual: RespondentVisual) => string
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

export default function ComparisonFormView({ sectionGroups, visuals }: ComparisonFormViewProps) {
  if (visuals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
        Aguardando respostas
      </div>
    )
  }

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
                        className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide min-w-[120px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`shrink-0 w-5 h-5 rounded-full ${v.color.bg} flex items-center justify-center text-[10px] font-semibold text-white`}
                          >
                            {v.initials}
                          </span>
                          <span className={`${v.color.text} normal-case truncate`} title={v.respondent.respondentName ?? ''}>
                            {v.respondent.respondentName?.split(' ')[0] ?? '—'}
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
                          <span className={`text-sm ${v.color.text} font-medium`}>
                            {row.cellRender(v)}
                          </span>
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
    </div>
  )
}
