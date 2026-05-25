import { useCallback, useState } from 'react'
import type { ChartData, ChartTemplate } from '@/types'
import { getChartTemplates } from '@/lib/api/template-api'
import TemplatePicker from '@/components/editor/TemplatePicker'
import AssessmentBlockPicker from '@/components/editor/AssessmentBlockPicker'

interface ChartTemplatePickerProps {
  onSelectTemplate: (templateId: string) => void
  onSelectEmpty: () => void
  onBack: () => void
  customerId?: string | null
  onSelectFromAssessment?: (presetData: ChartData, sourceAssessmentId: string) => void
}

const chartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

function chartDetail(tpl: ChartTemplate): string {
  const type = tpl.chartType === 'bar' ? 'Barras' : 'Linhas'
  const cats = `${tpl.categories.length} ${tpl.categories.length === 1 ? 'categoria' : 'categorias'}`
  const regions = tpl.referenceRegions.length > 0 ? ' · com regiões de referência' : ''
  return `${type} · ${cats}${regions}`
}

export default function ChartTemplatePicker({
  onSelectTemplate,
  onSelectEmpty,
  onBack,
  customerId,
  onSelectFromAssessment,
}: ChartTemplatePickerProps) {
  const fetchTemplates = useCallback(() => getChartTemplates(), [])
  const [showAssessment, setShowAssessment] = useState(false)
  const assessmentEnabled = Boolean(customerId && onSelectFromAssessment)

  if (showAssessment && customerId) {
    return (
      <AssessmentBlockPicker
        customerId={customerId}
        filterKind="chart"
        onSelect={(_, data, sourceId) => {
          onSelectFromAssessment?.(data as ChartData, sourceId)
        }}
        onBack={() => setShowAssessment(false)}
      />
    )
  }

  return (
    <TemplatePicker<ChartTemplate>
      title="Escolha um template de gráfico"
      emptyLabel="Gráfico Vazio"
      emptyDescription="Criar gráfico em branco sem template"
      fetchTemplates={fetchTemplates}
      onSelectTemplate={onSelectTemplate}
      onSelectEmpty={onSelectEmpty}
      onBack={onBack}
      renderIcon={chartIcon}
      renderDetail={chartDetail}
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
                Reaproveitar gráfico já preenchido em uma avaliação registrada
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        ) : null
      }
    />
  )
}
