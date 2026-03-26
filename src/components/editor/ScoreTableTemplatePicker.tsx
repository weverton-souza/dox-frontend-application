import { useCallback } from 'react'
import type { ScoreTableTemplate } from '@/types'
import { getScoreTableTemplates } from '@/lib/api/template-api'
import TemplatePicker from '@/components/editor/TemplatePicker'

interface ScoreTableTemplatePickerProps {
  onSelectTemplate: (templateId: string) => void
  onSelectEmpty: () => void
  onBack: () => void
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
}: ScoreTableTemplatePickerProps) {
  const fetchTemplates = useCallback(() => getScoreTableTemplates(), [])

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
    />
  )
}
