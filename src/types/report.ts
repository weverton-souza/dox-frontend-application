import type { ContactItem } from './common'
import type { CustomerData } from './customer'
import type { SlateContent } from './slate'

// ========== Professional & Solicitor ==========

export interface Professional {
  name: string
  crp: string
  specialization: string
  phone?: string
  instagram?: string
  email?: string
  logo?: string                 // base64 data URL
  contactItems?: ContactItem[]  // footer contacts/social
}

export interface Solicitor {
  name: string
  crm?: string
  rqe?: string
  specialty?: string
}

// ========== Block Data Types ==========

export interface IdentificationData {
  professional: Professional
  solicitor?: Solicitor
  customer: CustomerData
  date: string // data do relatório
  location: string // ex: "Belo Horizonte - MG"
}

export interface LabeledItem {
  id: string
  label: string
  text: string
}

export interface TextBlockData {
  content: string | SlateContent
  labeledItems: LabeledItem[]
  useLabeledItems: boolean
}

// ========== Score Table ==========

export interface ScoreTableColumn {
  id: string
  label: string
  formula?: string  // fórmula de texto, ex: "CLASSIFICAR([Percentil];>=98;\"Muito Superior\";...)"
  alignment?: 'left' | 'center' | 'right'
}

// Cada row guarda valores por column id
export interface ScoreTableRow {
  id: string
  values: Record<string, string> // chave = column.id, valor = conteúdo da célula (pode ser fórmula)
}

export interface ScoreTableData {
  title: string
  columns: ScoreTableColumn[]
  rows: ScoreTableRow[]
  footnote: string
  templateId?: string | null
}

// ========== Base Template ==========

export interface BaseTemplate {
  id: string
  name: string
  description: string
  instrumentName: string
  category: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// ========== Score Table Templates ==========

export interface ScoreTableTemplateColumn {
  id: string
  label: string
  formula: string | null  // fórmula de texto ou null para input manual
}

export interface ScoreTableTemplateRow {
  id: string
  defaultValues: Record<string, string>  // inclui fórmulas como valores
}

export interface ScoreTableTemplate extends BaseTemplate {
  columns: ScoreTableTemplateColumn[]
  rows: ScoreTableTemplateRow[]
}

// ========== Chart Templates ==========

export interface ChartTemplate extends BaseTemplate {
  chartType: ChartType
  displayMode: ChartDisplayMode
  series: ChartSeries[]
  categories: ChartCategory[]
  referenceLines: ChartReferenceLine[]
  referenceRegions: ChartReferenceRegion[]
  yAxisLabel: string
  showValues: boolean
  showLegend: boolean
  showRegionLegend: boolean
}

export interface InfoBoxData {
  label: string
  content: string
}

// ========== Chart ==========

export interface ChartSeries {
  id: string
  label: string
  color: string
}

export interface ChartCategory {
  id: string
  label: string
  values: Record<string, number> // key = series.id, value = valor numérico
}

export interface ChartReferenceLine {
  id: string
  label: string
  value: number
  color: string
}

export interface ChartReferenceRegion {
  id: string
  label: string
  yMin: number
  yMax: number
  color: string       // cor de fundo (com opacidade, ex: "#27AE6033")
  borderColor: string
}

export type ChartType = 'bar' | 'line'
export type ChartDisplayMode = 'grouped' | 'separated'

export interface ChartData {
  title: string
  chartType: ChartType
  displayMode: ChartDisplayMode
  categories: ChartCategory[]
  series: ChartSeries[]
  referenceLines: ChartReferenceLine[]
  referenceRegions: ChartReferenceRegion[]
  yAxisLabel: string
  showValues: boolean
  showLegend: boolean
  showRegionLegend: boolean
  description: string
}

// ========== References ==========

export interface ReferencesData {
  title: string
  references: string[]
}

// ========== Closing Page ==========

export interface ClosingPageData {
  title: string
  bodyText: string
  // Assinaturas (profissional sempre aparece)
  showPatientSignature: boolean
  showMotherSignature: boolean
  showFatherSignature: boolean
  showGuardianSignature: boolean
  // Campo de escrita abaixo das assinaturas
  footerNote: string
  // backward compat — campo antigo, se existir
  showSignatureLines?: boolean
}

// ========== Block ==========

export type BlockType = 'identification' | 'section' | 'text' | 'score-table' | 'info-box' | 'chart' | 'references' | 'closing-page'

export interface SectionData {
  title: string
  description?: string
  icon?: string
  color?: string
}

export type BlockData = IdentificationData | SectionData | TextBlockData | ScoreTableData | InfoBoxData | ChartData | ReferencesData | ClosingPageData

export interface Block {
  id: string
  type: BlockType
  parentId: string | null
  order: number
  data: BlockData
  collapsed: boolean
  generatedByAi?: boolean
  generationId?: string
  skippedByAi?: boolean
}

// ========== Block Hierarchy Helpers ==========

const CONTAINER_TYPES: BlockType[] = ['identification', 'section', 'closing-page']

export function isContainerBlock(type: BlockType): boolean {
  return CONTAINER_TYPES.includes(type)
}

export function isLockedBlock(type: BlockType): boolean {
  return type === 'identification' || type === 'closing-page'
}

// ========== Report Theme ==========

export interface ReportTheme {
  primaryColor?: string
  headingFont?: string
  bodyFont?: string
}

export const DEFAULT_REPORT_THEME: Required<ReportTheme> = {
  primaryColor: '#007AFF',
  headingFont: 'Inter',
  bodyFont: 'Inter',
}

// ========== Report ==========

export type ReportStatus = 'rascunho' | 'em_revisao' | 'finalizado'

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em Revisão',
  finalizado: 'Finalizado',
}

export const REPORT_STATUS_COLORS: Record<ReportStatus, { bg: string; text: string }> = {
  rascunho: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  em_revisao: { bg: 'bg-blue-100', text: 'text-blue-700' },
  finalizado: { bg: 'bg-green-100', text: 'text-green-700' },
}

export const REPORT_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  rascunho: ['em_revisao', 'finalizado'],
  em_revisao: ['rascunho', 'finalizado'],
  finalizado: ['em_revisao'],
}

export interface Report {
  id: string
  createdAt: string
  updatedAt: string
  status: ReportStatus
  customerName: string
  customerId?: string
  formId?: string
  formResponseId?: string
  templateId?: string
  isStructureLocked: boolean
  blocks: Block[]
  theme?: ReportTheme
}

// ========== Report Versioning ==========

export interface ReportVersion {
  id: string
  reportId: string
  createdAt: string
  status: ReportStatus
  description: string
  customerName: string
  blocks: Block[]
}

// ========== Templates ==========

export interface TemplateBlock {
  id?: string
  type: BlockType
  parentId?: string | null
  order: number
  data: BlockData
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  blocks: TemplateBlock[]
  isDefault: boolean
  isLocked: boolean
  isMaster: boolean
}

// Re-export block constants so existing imports from '@/types' still work
export { BLOCK_TYPE_LABELS, BLOCK_TYPE_DESCRIPTIONS } from '@/lib/block-constants'

// ========== Default Score Table Columns ==========

export const DEFAULT_SCORE_COLUMNS: ScoreTableColumn[] = [
  { id: 'col-instrumento', label: 'Instrumento/Subteste' },
  { id: 'col-valor-obtido', label: 'Valor Obtido' },
  { id: 'col-percentil', label: 'Percentil' },
  { id: 'col-classificacao', label: 'Classificação' },
]

// ========== Factory Functions ==========

import { createEmptyCustomerData } from './customer'

export function createEmptyProfessional(): Professional {
  return {
    name: '',
    crp: '',
    specialization: '',
  }
}

export function createEmptyIdentificationData(professional?: Professional): IdentificationData {
  return {
    professional: professional ?? createEmptyProfessional(),
    customer: createEmptyCustomerData(),
    date: new Date().toISOString().split('T')[0],
    location: '',
  }
}

export function createEmptyTextBlockData(): TextBlockData {
  return {
    content: '',
    labeledItems: [],
    useLabeledItems: false,
  }
}

export function createEmptySectionData(title: string = 'Nova Seção'): SectionData {
  return { title }
}

export function createEmptyScoreTableData(): ScoreTableData {
  return {
    title: '',
    columns: DEFAULT_SCORE_COLUMNS.map(c => ({ ...c })),
    rows: [],
    footnote: '',
  }
}

export function createEmptyInfoBoxData(): InfoBoxData {
  return {
    label: '',
    content: '',
  }
}

export function createEmptyChartData(): ChartData {
  const seriesId = crypto.randomUUID()
  return {
    title: '',
    chartType: 'bar',
    displayMode: 'grouped',
    series: [{ id: seriesId, label: 'Série 1', color: '#007AFF' }],
    categories: [],
    referenceLines: [],
    referenceRegions: [],
    yAxisLabel: '',
    showValues: true,
    showLegend: false,
    showRegionLegend: true,
    description: '',
  }
}

export const DEFAULT_CLOSING_PAGE_TEXT =
  'Declaro que recebi o presente documento, contendo os resultados da avaliação realizada, e que fui orientado(a) sobre o conteúdo do mesmo. Estou ciente de que este relatório é de caráter confidencial e que as informações aqui contidas são de uso exclusivo para os fins a que se destina.'

export function createEmptyReferencesData(): ReferencesData {
  return {
    title: 'REFERÊNCIAS BIBLIOGRÁFICAS',
    references: [''],
  }
}

export function createEmptyClosingPageData(): ClosingPageData {
  return {
    title: 'TERMO DE ENTREGA E CIÊNCIA',
    bodyText: DEFAULT_CLOSING_PAGE_TEXT,
    showPatientSignature: true,
    showMotherSignature: false,
    showFatherSignature: false,
    showGuardianSignature: false,
    footerNote: '',
  }
}

export function createScoreTableColumn(label: string = ''): ScoreTableColumn {
  return {
    id: `col-${crypto.randomUUID()}`,
    label,
  }
}

export function createEmptyScoreTableRow(columns: ScoreTableColumn[]): ScoreTableRow {
  const values: Record<string, string> = {}
  for (const col of columns) {
    values[col.id] = ''
  }
  return {
    id: crypto.randomUUID(),
    values,
  }
}

// ========== Formula Factory Functions ==========

export function createScoreTableFromTemplate(template: ScoreTableTemplate): ScoreTableData {
  const columns: ScoreTableColumn[] = template.columns.map(c => ({
    id: c.id,
    label: c.label,
    formula: c.formula ?? undefined,
  }))

  const rows: ScoreTableRow[] = template.rows.map(r => ({
    id: crypto.randomUUID(),
    values: { ...r.defaultValues },
  }))

  return {
    title: template.name,
    columns,
    rows,
    footnote: '',
    templateId: template.id,
  }
}

export function createChartFromTemplate(template: ChartTemplate): ChartData {
  // Gerar novos UUIDs para as séries e mapear old→new
  const seriesIdMap = new Map<string, string>()
  const newSeries = template.series.map(s => {
    const newId = crypto.randomUUID()
    seriesIdMap.set(s.id, newId)
    return { ...s, id: newId }
  })

  const newCategories = template.categories.map(c => {
    const newValues: Record<string, number> = {}
    for (const [oldSeriesId, value] of Object.entries(c.values)) {
      const newSeriesId = seriesIdMap.get(oldSeriesId) ?? oldSeriesId
      newValues[newSeriesId] = value
    }
    return { id: crypto.randomUUID(), label: c.label, values: newValues }
  })

  return {
    title: template.name,
    chartType: template.chartType,
    displayMode: template.displayMode,
    series: newSeries,
    categories: newCategories,
    referenceLines: template.referenceLines.map(r => ({ ...r, id: crypto.randomUUID() })),
    referenceRegions: template.referenceRegions.map(r => ({ ...r, id: crypto.randomUUID() })),
    yAxisLabel: template.yAxisLabel,
    showValues: template.showValues,
    showLegend: template.showLegend,
    showRegionLegend: template.showRegionLegend,
    description: '',
  }
}
