import { api as apiClient } from './api-client'

export interface ReferenceEntry {
  id: string
  text: string
  instrument: string | null
  authors: string | null
  year: number | null
  createdAt: string
  updatedAt: string
}

export interface ReferenceEntryRequest {
  text: string
  instrument?: string | null
  authors?: string | null
  year?: number | null
}

export async function getReferenceEntries(query?: string): Promise<ReferenceEntry[]> {
  const params = query ? { params: { query } } : {}
  const { data } = await apiClient.get<ReferenceEntry[]>('/reference-entries', params)
  return data
}

export async function createReferenceEntry(request: ReferenceEntryRequest): Promise<ReferenceEntry> {
  const { data } = await apiClient.post<ReferenceEntry>('/reference-entries', request)
  return data
}

export async function updateReferenceEntry(id: string, request: ReferenceEntryRequest): Promise<ReferenceEntry> {
  const { data } = await apiClient.put<ReferenceEntry>(`/reference-entries/${id}`, request)
  return data
}

export async function deleteReferenceEntry(id: string): Promise<void> {
  await apiClient.delete(`/reference-entries/${id}`)
}
