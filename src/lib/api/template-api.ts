import type { ReportTemplate, ScoreTableTemplate, ChartTemplate } from '@/types'
import { api } from '@/lib/api/api-client'

// ========== Report Templates ==========

export async function getReportTemplates(): Promise<ReportTemplate[]> {
  const { data } = await api.get<ReportTemplate[]>('/templates/reports')
  return data
}

export async function createReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
  const { data } = await api.post<ReportTemplate>('/templates/reports', template)
  return data
}

export async function deleteReportTemplate(id: string): Promise<void> {
  await api.delete(`/templates/reports/${id}`)
}

export async function duplicateReportTemplate(id: string): Promise<ReportTemplate> {
  const { data } = await api.post<ReportTemplate>(`/templates/reports/${id}/duplicate`)
  return data
}

// ========== Score Table Templates ==========

export async function getScoreTableTemplates(): Promise<ScoreTableTemplate[]> {
  const { data } = await api.get<ScoreTableTemplate[]>('/templates/score-tables')
  return data
}

export async function createScoreTableTemplate(
  template: Partial<ScoreTableTemplate>,
): Promise<ScoreTableTemplate> {
  const { data } = await api.post<ScoreTableTemplate>('/templates/score-tables', template)
  return data
}

export async function deleteScoreTableTemplate(id: string): Promise<void> {
  await api.delete(`/templates/score-tables/${id}`)
}

// ========== Chart Templates ==========

interface ChartTemplateResponse {
  id: string
  name: string
  description: string
  instrumentName: string
  category: string
  data: Record<string, unknown>
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export async function getChartTemplates(): Promise<ChartTemplate[]> {
  const { data } = await api.get<ChartTemplateResponse[]>('/templates/charts')
  return data.map((t) => ({
    ...t.data,
    id: t.id,
    name: t.name,
    description: t.description ?? '',
    instrumentName: t.instrumentName ?? '',
    category: t.category ?? '',
    isDefault: t.isDefault,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  } as ChartTemplate))
}

export async function createChartTemplate(template: Partial<ChartTemplate>): Promise<ChartTemplate> {
  const { name, description, instrumentName, category, ...chartData } = template
  const payload = {
    name,
    description,
    instrumentName,
    category,
    data: chartData,
  }
  const { data } = await api.post<ChartTemplateResponse>('/templates/charts', payload)
  return {
    ...data.data,
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    instrumentName: data.instrumentName ?? '',
    category: data.category ?? '',
    isDefault: data.isDefault,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } as ChartTemplate
}

export async function deleteChartTemplate(id: string): Promise<void> {
  await api.delete(`/templates/charts/${id}`)
}
