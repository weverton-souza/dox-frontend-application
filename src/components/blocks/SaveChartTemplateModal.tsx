import { useState, useEffect } from 'react'
import type { ChartData } from '@/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { createChartTemplate, getChartTemplates } from '@/lib/api/template-api'

interface SaveChartTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  chartData: ChartData
  onSaved: () => void
}

export default function SaveChartTemplateModal({
  isOpen,
  onClose,
  chartData,
  onSaved,
}: SaveChartTemplateModalProps) {
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateInstrument, setTemplateInstrument] = useState('')
  const [templateCategory, setTemplateCategory] = useState('')
  const [existingCategories, setExistingCategories] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen) return
    setTemplateName(chartData.title || '')
    setTemplateDescription('')
    setTemplateInstrument('')
    setTemplateCategory('')
  }, [isOpen, chartData.title])

  useEffect(() => {
    if (!isOpen) return
    getChartTemplates()
      .then(tpls => {
        const cats = [...new Set(tpls.map(t => t.category))]
        setExistingCategories(cats.sort())
      })
      .catch(() => {})
  }, [isOpen])

  const canSave = templateName.trim() && templateInstrument.trim() && templateCategory.trim()

  const handleSave = async () => {
    try {
      await createChartTemplate({
        name: templateName.trim(),
        description: templateDescription.trim(),
        instrumentName: templateInstrument.trim(),
        category: templateCategory.trim(),
        chartType: chartData.chartType,
        displayMode: chartData.displayMode,
        series: chartData.series.map(s => ({ ...s })),
        categories: chartData.categories.map(c => ({
          ...c,
          values: { ...c.values },
        })),
        referenceLines: chartData.referenceLines.map(r => ({ ...r })),
        referenceRegions: chartData.referenceRegions.map(r => ({ ...r })),
        yAxisLabel: chartData.yAxisLabel,
        showValues: chartData.showValues,
        showLegend: chartData.showLegend,
        showRegionLegend: chartData.showRegionLegend ?? true,
        isDefault: false,
      })
      onClose()
      onSaved()
    } catch {
      // error saving template
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Salvar como Template"
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Nome *"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Ex: WAIS-III — Perfil de Subtestes"
        />
        <Input
          label="Instrumento *"
          value={templateInstrument}
          onChange={(e) => setTemplateInstrument(e.target.value)}
          placeholder="Ex: WAIS-III, RAVLT"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria *
          </label>
          <input
            type="text"
            list="chart-template-categories"
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
            placeholder="Ex: Inteligência, Memória, Atenção"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <datalist id="chart-template-categories">
            {existingCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <Input
          label="Descrição"
          value={templateDescription}
          onChange={(e) => setTemplateDescription(e.target.value)}
          placeholder="Breve descrição do template (opcional)"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
          >
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
