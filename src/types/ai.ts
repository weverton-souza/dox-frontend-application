// ========== AI Types ==========

export interface AiGenerationRequest {
  sectionType: string
  formResponseId?: string
  previousSections?: PreviousSectionInput[]
  quantitativeData?: QuantitativeDataPayload
}

export interface PreviousSectionInput {
  sectionType: string
  summary: string
}

export interface AiRegenerationRequest {
  sectionType: string
  generationId: string
}

export interface AiGenerationResponse {
  text: string
  tokensUsed: number
  model: string
  generationId: string
  cached: boolean
}

export interface GenerateFullReportRequest {
  formResponseId?: string
  formResponseIds?: string[]
  quantitativeData?: QuantitativeDataPayload
  selectedSections?: string[]
}

export interface QuantitativeDataPayload {
  tables: ComputedTableData[]
  charts: ComputedChartData[]
}

export interface ComputedTableData {
  blockId: string
  title: string
  category: string
  dataStatus: 'complete' | 'partial' | 'empty'
  rows: ComputedTableRow[]
}

export interface ComputedTableRow {
  label: string
  values: Record<string, string>
}

export interface ComputedChartData {
  blockId: string
  title: string
  dataStatus: 'complete' | 'partial' | 'empty'
  series: ComputedChartSeries[]
}

export interface ComputedChartSeries {
  label: string
  values: Record<string, number>
}

export interface SectionProgressEvent {
  sectionType: string
  index: number
  total: number
  status: 'completed' | 'error' | 'done' | 'skipped'
  text?: string
  generationId?: string
  tokensUsed?: number
  message?: string
  warning?: string
}

export interface GenerationCompleteEvent {
  completedCount: number
  failedCount: number
  totalTokens: number
  totalCostBrl: string
}

export interface AiStatusResponse {
  available: boolean
  tierName?: string
  model?: string
}

export interface AiUsageSummaryResponse {
  used: number
  limit: number
  overage: number
  overageCostCents: number
  tierName?: string
  alertLevel?: string
  alertMessage?: string
}

export interface AiUsageDetailResponse {
  id: string
  reportId?: string
  generationId: string
  sectionType: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCostBrl: number
  status: string
  durationMs: number
  isRegeneration: boolean
  createdAt?: string
}

export interface AiQuotaResponse {
  tier: string
  model: string
  monthlyLimit: number
  overagePriceCents: number
  enabled: boolean
}

export interface AiGenerationSource {
  id: string
  reportId: string
  generationId: string
  sourceType: 'form_response' | 'customer_file'
  sourceId: string
  sourceLabel: string | null
  included: boolean
  displayOrder: number
  createdAt: string
}

export type ReviewAction = 'corrigir' | 'melhorar' | 'resumir' | 'expandir'

export interface ReviewTextRequest {
  text: string
  action: ReviewAction
  sectionType?: string
  instruction?: string
  formResponseIds?: string[]
}

export interface ReviewTextResponse {
  original: string
  revised: string
  generationId: string
  tokensUsed: number
  model: string
}

export type AiGenerationStatus = 'idle' | 'loading' | 'success' | 'error' | 'quota-exceeded'

export interface AiGenerationProgress {
  currentSection: string
  currentIndex: number
  total: number
  completedSections: Map<string, { text: string; generationId: string }>
  failedSections: Map<string, string>
  skippedSections: Map<string, string>
}
