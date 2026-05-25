import type { Assessment, AssessmentEntry } from '@/types'

interface AssessmentCardProps {
  assessment: Assessment
  reapplications?: Assessment[]
  onEdit: () => void
  onDelete: () => void
}

const ENTRY_ICONS: Record<AssessmentEntry['entryType'], string> = {
  simple: '📝',
  table: '📊',
  chart: '📈',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

function entrySummary(entry: AssessmentEntry): string {
  if (entry.entryType === 'simple' && entry.scores.length > 0) {
    return entry.scores
      .slice(0, 3)
      .map(s => `${s.label || s.index}=${s.value}${s.classification ? ` (${s.classification})` : ''}`)
      .join(' · ')
  }
  if (entry.entryType === 'table') return 'Tabela preenchida'
  if (entry.entryType === 'chart') return 'Gráfico configurado'
  return entry.observations?.slice(0, 80) ?? 'Sem dados'
}

export default function AssessmentCard({
  assessment,
  reapplications = [],
  onEdit,
  onDelete,
}: AssessmentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold">{assessment.title}</h3>
              {assessment.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {assessment.category}
                </span>
              )}
              {reapplications.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                  Reaplicações: {reapplications.length}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatDate(assessment.appliedAt)} · <strong>{assessment.entries.length}</strong>{' '}
              {assessment.entries.length === 1 ? 'registro' : 'registros'}
            </div>
            {assessment.notes && (
              <div className="text-sm text-gray-600 italic mt-1">"{assessment.notes}"</div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0">
            <button onClick={onEdit} className="text-gray-500 hover:text-gray-900">Editar</button>
            <span className="text-gray-300">·</span>
            <button onClick={onDelete} className="text-gray-500 hover:text-red-600">Excluir</button>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-gray-100">
        {assessment.entries.map(entry => (
          <li key={entry.id ?? `${entry.instrumentName}-${entry.orderIndex}`} className="px-6 py-3 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-base shrink-0">{ENTRY_ICONS[entry.entryType]}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{entry.instrumentName || 'Sem nome'}</div>
                <div className="text-xs text-gray-500 truncate">{entrySummary(entry)}</div>
                {entry.observations && entry.entryType !== 'simple' && (
                  <div className="text-xs text-gray-500 italic mt-1 truncate">{entry.observations}</div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
