import type { Assessment, AssessmentRequestPayload, Page, RelatedTemplate } from '@/types'
import { api } from '@/lib/api/api-client'

export async function getAssessments(
  customerId: string,
  page = 0,
  size = 15,
): Promise<Page<Assessment>> {
  const params = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(size),
  })
  const { data } = await api.get<Page<Assessment>>(`/customers/${customerId}/assessments?${params}`)
  return data
}

export async function getAssessment(customerId: string, id: string): Promise<Assessment> {
  const { data } = await api.get<Assessment>(`/customers/${customerId}/assessments/${id}`)
  return data
}

export async function createAssessment(
  customerId: string,
  payload: AssessmentRequestPayload,
): Promise<Assessment> {
  const { data } = await api.post<Assessment>(`/customers/${customerId}/assessments`, payload)
  return data
}

export async function updateAssessment(
  customerId: string,
  id: string,
  payload: AssessmentRequestPayload,
): Promise<Assessment> {
  const { data } = await api.put<Assessment>(`/customers/${customerId}/assessments/${id}`, payload)
  return data
}

export async function deleteAssessment(customerId: string, id: string): Promise<void> {
  await api.delete(`/customers/${customerId}/assessments/${id}`)
}

export async function autocompleteInstruments(query: string): Promise<string[]> {
  if (query.trim().length < 2) return []
  const params = new URLSearchParams({ q: query.trim() })
  const { data } = await api.get<string[]>(`/assessments/instruments/autocomplete?${params}`)
  return data
}

export async function getRelatedTemplates(
  customerId: string,
  assessmentId: string,
): Promise<RelatedTemplate[]> {
  const { data } = await api.get<RelatedTemplate[]>(
    `/customers/${customerId}/assessments/${assessmentId}/related-templates`,
  )
  return data
}
