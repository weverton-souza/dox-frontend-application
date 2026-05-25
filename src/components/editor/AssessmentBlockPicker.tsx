import { useEffect, useState } from 'react'
import type { Assessment, ChartData, ScoreTableData } from '@/types'
import { getAssessments } from '@/lib/api/assessment-api'
import Spinner from '@/components/ui/Spinner'

interface AssessmentBlockPickerProps {
  customerId: string
  filterKind?: 'score-table' | 'chart'
  onSelect: (kind: 'score-table' | 'chart', presetData: ScoreTableData | ChartData, sourceAssessmentId: string) => void
  onBack: () => void
}

interface PickableBlock {
  assessmentId: string
  assessmentTitle: string
  appliedAt: string
  entryId: string
  instrumentName: string
  kind: 'score-table' | 'chart'
  preview: string
  data: ScoreTableData | ChartData
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

function buildPreview(kind: 'score-table' | 'chart', data: ScoreTableData | ChartData): string {
  if (kind === 'score-table') {
    const table = data as ScoreTableData
    return `${table.columns.length} colunas · ${table.rows.length} linhas`
  }
  const chart = data as ChartData
  return `${chart.categories.length} categorias · ${chart.series.length} séries`
}

function flattenAssessments(assessments: Assessment[]): PickableBlock[] {
  const result: PickableBlock[] = []
  for (const a of assessments) {
    for (const entry of a.entries) {
      if ((entry.entryType === 'table' || entry.entryType === 'chart') && entry.block) {
        const kind = entry.entryType === 'table' ? 'score-table' : 'chart'
        const data = entry.block as ScoreTableData | ChartData
        result.push({
          assessmentId: a.id,
          assessmentTitle: a.title,
          appliedAt: a.appliedAt,
          entryId: entry.id ?? `${a.id}-${entry.orderIndex}`,
          instrumentName: entry.instrumentName,
          kind,
          preview: buildPreview(kind, data),
          data,
        })
      }
    }
  }
  return result
}

export default function AssessmentBlockPicker({
  customerId,
  filterKind,
  onSelect,
  onBack,
}: AssessmentBlockPickerProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAssessments(customerId, 0, 50)
      .then(page => {
        if (cancelled) return
        setAssessments(page.content)
      })
      .catch(() => {
        if (cancelled) return
        setAssessments([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [customerId])

  const allBlocks = flattenAssessments(assessments)
  const blocks = filterKind ? allBlocks.filter(b => b.kind === filterKind) : allBlocks
  const byAssessment = new Map<string, PickableBlock[]>()
  for (const b of blocks) {
    const list = byAssessment.get(b.assessmentId) ?? []
    list.push(b)
    byAssessment.set(b.assessmentId, list)
  }
  const emptyMessage = filterKind === 'score-table'
    ? 'Nenhuma tabela registrada em avaliações deste paciente.'
    : filterKind === 'chart'
      ? 'Nenhum gráfico registrado em avaliações deste paciente.'
      : 'Nenhuma tabela ou gráfico registrado em avaliações deste paciente.'

  return (
    <div className="space-y-3 max-h-[60vh] overflow-auto">
      <div className="flex items-center gap-2 text-sm px-4 pt-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700">‹</button>
        <span className="font-medium">Avaliação do paciente</span>
      </div>
      <p className="text-xs text-gray-500 px-4">
        Tabelas e gráficos preenchidos nas avaliações deste paciente. Ao inserir, o bloco é copiado pro relatório (snapshot).
      </p>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!loading && blocks.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 mx-4 text-center text-sm text-gray-500">
          {emptyMessage}
        </div>
      )}

      {!loading && blocks.length > 0 && (
        <div className="px-4 pb-4 space-y-3">
          {Array.from(byAssessment.entries()).map(([assessmentId, items]) => (
            <div key={assessmentId} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <div className="text-sm font-medium">{items[0].assessmentTitle}</div>
                <div className="text-xs text-gray-500">{formatDate(items[0].appliedAt)} · {items.length} {items.length === 1 ? 'bloco' : 'blocos'}</div>
              </div>
              <ul className="divide-y divide-gray-100">
                {items.map(b => (
                  <li key={b.entryId}>
                    <button
                      type="button"
                      onClick={() => onSelect(b.kind, b.data, b.assessmentId)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-brand-50 transition-colors"
                    >
                      <span className="text-base">{b.kind === 'score-table' ? '📊' : '📈'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{b.instrumentName || 'Sem nome'}</div>
                        <div className="text-xs text-gray-500">{b.preview}</div>
                      </div>
                      <span className="text-gray-400 text-sm">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
