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

function RespondentDot({ visual, size = 'md' }: { visual: RespondentVisual; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
  return (
    <span
      title={visual.respondent.respondentName || ''}
      className={`inline-flex items-center justify-center rounded-full ${visual.color.bg} ${dim} font-semibold text-white shadow-sm ring-2 ring-white`}
    >
      {visual.initials}
    </span>
  )
}

function MarkersForOption({ visualsForOption }: { visualsForOption: RespondentVisual[] }) {
  if (visualsForOption.length === 0) return null
  return (
    <div className="flex items-center -space-x-1.5">
      {visualsForOption.map((v) => (
        <RespondentDot key={v.respondent.linkId} visual={v} size="sm" />
      ))}
    </div>
  )
}

function renderField(field: FormField, visuals: RespondentVisual[]): React.ReactNode {
  switch (field.type) {
    case 'inventory-item':
    case 'single-choice':
      return (
        <div className="space-y-1.5">
          {field.options.map((opt) => {
            const visualsHere = visuals.filter((v) => {
              const ans = getAnswer(v, field.id)
              return ans?.selectedOptionIds[0] === opt.id
            })
            const isSelected = visualsHere.length > 0
            return (
              <div
                key={opt.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  isSelected ? 'bg-gray-50' : ''
                }`}
              >
                <span className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 shrink-0" />
                <span className="text-sm text-gray-700 flex-1">
                  {opt.label || 'Opção'}
                  {opt.value !== undefined && (
                    <span className="ml-2 text-xs text-gray-400">({opt.value})</span>
                  )}
                </span>
                <MarkersForOption visualsForOption={visualsHere} />
              </div>
            )
          })}
        </div>
      )

    case 'multiple-choice':
      return (
        <div className="space-y-1.5">
          {field.options.map((opt) => {
            const visualsHere = visuals.filter((v) => getAnswer(v, field.id)?.selectedOptionIds.includes(opt.id))
            const isSelected = visualsHere.length > 0
            return (
              <div
                key={opt.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  isSelected ? 'bg-gray-50' : ''
                }`}
              >
                <span className="w-[18px] h-[18px] rounded border-2 border-gray-300 shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{opt.label || 'Opção'}</span>
                <MarkersForOption visualsForOption={visualsHere} />
              </div>
            )
          })}
        </div>
      )

    case 'yes-no':
      return (
        <div className="flex gap-3">
          {(['sim', 'não'] as const).map((val) => {
            const visualsHere = visuals.filter((v) => getAnswer(v, field.id)?.value === val)
            return (
              <div key={val} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100">
                <span className="text-sm font-medium text-gray-700 capitalize">{val}</span>
                <MarkersForOption visualsForOption={visualsHere} />
              </div>
            )
          })}
        </div>
      )

    case 'scale': {
      const values = Array.from(
        { length: field.scaleMax - field.scaleMin + 1 },
        (_, i) => field.scaleMin + i,
      )
      return (
        <div className="flex items-center gap-3 flex-wrap">
          {field.scaleMinLabel && (
            <span className="text-xs text-gray-400 shrink-0">{field.scaleMinLabel}</span>
          )}
          <div className="flex items-center gap-2">
            {values.map((val) => {
              const visualsHere = visuals.filter((v) => getAnswer(v, field.id)?.scaleValue === val)
              return (
                <div key={val} className="flex flex-col items-center gap-1">
                  <span className="w-10 h-10 rounded-full text-sm font-medium text-gray-500 bg-gray-50 flex items-center justify-center">
                    {val}
                  </span>
                  <MarkersForOption visualsForOption={visualsHere} />
                </div>
              )
            })}
          </div>
          {field.scaleMaxLabel && (
            <span className="text-xs text-gray-400 shrink-0">{field.scaleMaxLabel}</span>
          )}
        </div>
      )
    }

    case 'likert-matrix':
      return (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs text-gray-500 font-normal py-2 px-3 w-1/3"></th>
                {field.likertScale.map((point) => (
                  <th key={point.value} className="text-center text-xs text-gray-500 font-normal py-2 px-2">
                    {point.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {field.likertRows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="text-sm text-gray-700 py-2.5 px-3">
                    {row.label || `Pergunta ${idx + 1}`}
                    {row.reverseScored && <span className="ml-1 text-xs text-gray-400">(reverso)</span>}
                  </td>
                  {field.likertScale.map((point) => {
                    const visualsHere = visuals.filter(
                      (v) => getAnswer(v, field.id)?.likertAnswers[row.id] === point.value,
                    )
                    return (
                      <td key={point.value} className="text-center py-2.5 px-2">
                        <div className="flex items-center justify-center min-h-[20px]">
                          {visualsHere.length > 0 ? (
                            <MarkersForOption visualsForOption={visualsHere} />
                          ) : (
                            <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-gray-200" />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'short-text':
    case 'long-text':
    case 'date':
      return (
        <div className="space-y-2">
          {visuals.map((v) => {
            const ans = getAnswer(v, field.id)
            const value = ans?.value || '—'
            return (
              <div key={v.respondent.linkId} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${v.color.light} border ${v.color.border}`}>
                <RespondentDot visual={v} size="sm" />
                <p className={`text-sm ${v.color.text} flex-1 whitespace-pre-wrap`}>{value}</p>
              </div>
            )
          })}
        </div>
      )

    default:
      return null
  }
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
      {sectionGroups.map((group) => (
        <div key={group.sectionFieldId}>
          {group.sectionField && (
            <div className="pt-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-1.5 bg-brand-400" />
                <div className="px-6 py-4">
                  <h2 className="text-base font-medium text-gray-800">
                    {group.sectionField.label || 'Seção sem título'}
                  </h2>
                  {group.sectionField.description && (
                    <p className="text-xs text-gray-400 mt-1">{group.sectionField.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {group.children.map((field) => (
            <div key={field.id} className="bg-white rounded-lg shadow-sm px-6 py-5 mt-3">
              <label className="block text-sm text-gray-900 mb-3">
                {field.label || '(pergunta não definida)'}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.description && (
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">{field.description}</p>
              )}
              {renderField(field, visuals)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
