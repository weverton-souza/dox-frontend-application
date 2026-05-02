import type { ComparisonRespondent } from '@/types'
import type { RespondentColor } from '@/lib/respondent-colors'

interface RespondentVisual {
  respondent: ComparisonRespondent
  index: number
  color: RespondentColor
  initials: string
  label: string
}

interface ComparisonLegendProps {
  visuals: RespondentVisual[]
}

export default function ComparisonLegend({ visuals }: ComparisonLegendProps) {
  if (visuals.length === 0) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Respondentes</p>
      <div className="flex flex-wrap gap-3">
        {visuals.map((v) => (
          <div
            key={v.respondent.linkId}
            className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border ${v.color.border} ${v.color.light}`}
          >
            <span
              className={`shrink-0 w-7 h-7 rounded-full ${v.color.bg} flex items-center justify-center text-xs font-semibold text-white`}
            >
              {v.initials}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${v.color.text} truncate`}>
                {v.respondent.respondentName || '(sem nome)'}
              </p>
              <p className="text-xs text-gray-500">
                {v.label}
                {v.respondent.status !== 'answered' && ' · pendente'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
