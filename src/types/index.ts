// ========== Contact / Social ==========

export type ContactType = 'instagram' | 'linkedin' | 'facebook' | 'website' | 'phone' | 'email'

export interface ContactItem {
  id: string
  type: ContactType
  value: string
}

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  website: 'Website',
  phone: 'Telefone',
  email: 'E-mail',
}

export const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
]

export function createEmptyContactItem(type: ContactType = 'instagram'): ContactItem {
  return {
    id: crypto.randomUUID(),
    type,
    value: '',
  }
}

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

// ========== Patient ==========

export interface PatientData {
  name: string
  cpf: string
  birthDate: string // ISO date string
  age: string // editável — ex: "32 anos e 4 meses"
  education: string
  profession: string
  motherName: string
  fatherName: string
  guardianName?: string         // Nome do responsável legal
  guardianRelationship?: string // Grau de parentesco (Avó, Tio, etc.)
}

// ========== Block Data Types ==========

export interface IdentificationData {
  professional: Professional
  solicitor?: Solicitor
  patient: PatientData
  date: string // data do laudo
  location: string // ex: "Belo Horizonte - MG"
}

export interface LabeledItem {
  id: string
  label: string
  text: string
}

export interface TextBlockData {
  title: string
  subtitle: string
  content: string
  labeledItems: LabeledItem[]
  useLabeledItems: boolean
}

export interface ScoreTableColumn {
  id: string
  label: string
}

// Cada row guarda valores por column id
export interface ScoreTableRow {
  id: string
  values: Record<string, string> // chave = column.id, valor = conteúdo da célula
}

export interface ScoreTableData {
  title: string
  columns: ScoreTableColumn[]
  rows: ScoreTableRow[]
  footnote: string
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

export type BlockType = 'identification' | 'text' | 'score-table' | 'info-box' | 'chart' | 'references' | 'closing-page'

export type BlockData = IdentificationData | TextBlockData | ScoreTableData | InfoBoxData | ChartData | ReferencesData | ClosingPageData

export interface Block {
  id: string
  type: BlockType
  order: number
  data: BlockData
  collapsed: boolean
}

// ========== Laudo ==========

export type LaudoStatus = 'rascunho' | 'finalizado'

export interface Laudo {
  id: string
  createdAt: string
  updatedAt: string
  status: LaudoStatus
  patientName: string
  blocks: Block[]
}

// ========== Templates ==========

export interface TemplateBlock {
  type: BlockType
  order: number
  data: BlockData
}

export interface LaudoTemplate {
  id: string
  name: string
  description: string
  blocks: TemplateBlock[]
  isDefault: boolean
}

// ========== Block Type Labels ==========

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  'identification': 'Identificação',
  'text': 'Texto',
  'score-table': 'Tabela de Escores',
  'info-box': 'Info Box',
  'chart': 'Gráfico',
  'references': 'Referências',
  'closing-page': 'Termo de Entrega',
}

export const BLOCK_TYPE_DESCRIPTIONS: Record<BlockType, string> = {
  'identification': 'Dados do profissional, solicitante e paciente',
  'text': 'Seção de texto com título e conteúdo',
  'score-table': 'Tabela com instrumentos e escores',
  'info-box': 'Caixa de destaque (impressão diagnóstica, nota clínica)',
  'chart': 'Gráfico de barras ou linha para visualização de escores',
  'references': 'Referências bibliográficas com formatação ABNT',
  'closing-page': 'Termo de entrega e ciência com assinaturas',
}

// ========== Default Score Table Columns ==========

export const DEFAULT_SCORE_COLUMNS: ScoreTableColumn[] = [
  { id: 'col-instrumento', label: 'Instrumento/Subteste' },
  { id: 'col-valor-obtido', label: 'Valor Obtido' },
  { id: 'col-percentil', label: 'Percentil' },
  { id: 'col-classificacao', label: 'Classificação' },
]

// ========== Factory Functions ==========

export function createEmptyPatient(): PatientData {
  return {
    name: '',
    cpf: '',
    birthDate: '',
    age: '',
    education: '',
    profession: '',
    motherName: '',
    fatherName: '',
  }
}

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
    patient: createEmptyPatient(),
    date: new Date().toISOString().split('T')[0],
    location: '',
  }
}

export function createEmptyTextBlockData(): TextBlockData {
  return {
    title: '',
    subtitle: '',
    content: '',
    labeledItems: [],
    useLabeledItems: false,
  }
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
    series: [{ id: seriesId, label: 'Série 1', color: '#2E86C1' }],
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
  'Declaro que recebi o presente documento, contendo os resultados da avaliação neuropsicológica realizada, e que fui orientado(a) sobre o conteúdo do mesmo. Estou ciente de que este relatório é de caráter confidencial e que as informações aqui contidas são de uso exclusivo para os fins a que se destina.'

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
