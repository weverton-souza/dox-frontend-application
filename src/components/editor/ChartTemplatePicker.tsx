import { useCallback } from 'react'
import type { ChartTemplate } from '@/types'
import { getChartTemplates } from '@/lib/api/template-api'
import TemplatePicker from '@/components/editor/TemplatePicker'

interface ChartTemplatePickerProps {
  onSelectTemplate: (templateId: string) => void
  onSelectEmpty: () => void
  onBack: () => void
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
}: ChartTemplatePickerProps) {
  const fetchTemplates = useCallback(() => getChartTemplates(), [])

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
    />
  )
}
