import type { ScoreTableData, ChartData } from './report'

export type AssessmentEntryType = 'simple' | 'table' | 'chart'

export interface AssessmentScore {
  index: string
  label: string
  value: string
  classification?: string | null
}

export interface AssessmentEntry {
  id?: string
  instrumentName: string
  entryType: AssessmentEntryType
  orderIndex: number
  scores: AssessmentScore[]
  block: ScoreTableData | ChartData | null
  observations?: string | null
  attachmentFileId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface Assessment {
  id: string
  customerId: string
  appointmentId?: string | null
  applierId: string
  title: string
  category?: string | null
  appliedAt: string
  notes?: string | null
  parentAssessmentId?: string | null
  professionalDeclarationAcceptedAt: string
  professionalDeclarationRevision: number
  entries: AssessmentEntry[]
  createdAt?: string | null
  updatedAt?: string | null
}

export interface AssessmentRequestPayload {
  title: string
  category?: string | null
  appliedAt: string
  appointmentId?: string | null
  parentAssessmentId?: string | null
  notes?: string | null
  entries: AssessmentEntry[]
}

export interface RelatedTemplate {
  id: string
  name: string
  type: 'SCORE_TABLE' | 'CHART'
  instrumentName?: string | null
  category?: string | null
}

export const ASSESSMENT_ENTRY_TYPE_LABELS: Record<AssessmentEntryType, string> = {
  simple: 'Simples',
  table: 'Tabela',
  chart: 'Gráfico',
}

export function createEmptyAssessmentScore(): AssessmentScore {
  return { index: '', label: '', value: '', classification: '' }
}

export function createEmptyAssessmentEntry(entryType: AssessmentEntryType = 'simple'): AssessmentEntry {
  return {
    instrumentName: '',
    entryType,
    orderIndex: 0,
    scores: entryType === 'simple' ? [createEmptyAssessmentScore()] : [],
    block: null,
    observations: '',
    attachmentFileId: null,
  }
}
