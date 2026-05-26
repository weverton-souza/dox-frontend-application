import { useCallback, useState } from 'react'
import type { ScoreTableData, ScoreTableTemplate } from '@/types'
import { getScoreTableTemplates } from '@/lib/api/template-api'
import TemplatePicker from '@/components/editor/TemplatePicker'
import AssessmentBlockPicker from '@/components/editor/AssessmentBlockPicker'

interface ScoreTableTemplatePickerProps {
  onSelectTemplate: (templateId: string) => void
  onSelectEmpty: () => void
  onBack: () => void
  customerId?: string | null
  onSelectFromAssessment?: (presetData: ScoreTableData, sourceAssessmentId: string) => void
}

const tableIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

function tableDetail(tpl: ScoreTableTemplate): string {
  const cols = `${tpl.columns.length} colunas`
  const rows = `${tpl.rows.length} linhas`
  const formulas = tpl.columns.some(c => c.formula) ? ' · com fórmulas' : ''
  return `${cols} · ${rows}${formulas}`
}

export default function ScoreTableTemplatePicker({
  onSelectTemplate,
  onSelectEmpty,
  onBack,
  customerId,
  onSelectFromAssessment,
}: ScoreTableTemplatePickerProps) {
  const fetchTemplates = useCallback(() => getScoreTableTemplates(), [])
  const [showAssessment, setShowAssessment] = useState(false)
  const assessmentEnabled = Boolean(customerId && onSelectFromAssessment)

  if (showAssessment && customerId) {
    return (
      <AssessmentBlockPicker
        customerId={customerId}
        filterKind="score-table"
        onSelect={(_, data, sourceId) => {
          onSelectFromAssessment?.(data as ScoreTableData, sourceId)
        }}
        onBack={() => setShowAssessment(false)}
      />
    )
  }

  return (
    <TemplatePicker<ScoreTableTemplate>
      title="Escolha um template de tabela"
      emptyLabel="Tabela Vazia"
      emptyDescription="Criar tabela em branco sem template"
      fetchTemplates={fetchTemplates}
      onSelectTemplate={onSelectTemplate}
      onSelectEmpty={onSelectEmpty}
      onBack={onBack}
      renderIcon={tableIcon}
      renderDetail={tableDetail}
      extraOptionBelowEmpty={
        assessmentEnabled ? (
          <button
            type="button"
            onClick={() => setShowAssessment(true)}
            className="w-full flex items-start gap-3 p-3 rounded-xl border-2 border-brand-200 bg-brand-50/60 hover:bg-brand-50 transition-all text-left"
          >
            <div className="w-9 h-9 bg-brand-500 text-white rounded-lg flex items-center justify-center text-base shrink-0">
              📋
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">Avaliação do paciente</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Reaproveitar tabela já preenchida em uma avaliação registrada
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        ) : null
      }
    />
  )
}
