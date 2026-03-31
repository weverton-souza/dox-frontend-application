import { api as apiClient } from './api-client'

export interface ContentLibraryEntry {
  id: string
  title: string
  content: unknown[]
  type: string
  category: string
  instrument: string | null
  authors: string | null
  year: number | null
  tags: string | null
  createdAt: string
  updatedAt: string
}

export interface ContentLibraryRequest {
  title: string
  content: unknown[]
  type?: string
  category?: string
  instrument?: string | null
  authors?: string | null
  year?: number | null
  tags?: string | null
}

export async function getContentLibrary(query?: string, type?: string): Promise<ContentLibraryEntry[]> {
  const params: Record<string, string> = {}
  if (query) params.query = query
  if (type) params.type = type
  const { data } = await apiClient.get<ContentLibraryEntry[]>('/content-library', { params })
  return data
}

export async function createContentLibraryEntry(request: ContentLibraryRequest): Promise<ContentLibraryEntry> {
  const { data } = await apiClient.post<ContentLibraryEntry>('/content-library', request)
  return data
}

export async function updateContentLibraryEntry(id: string, request: ContentLibraryRequest): Promise<ContentLibraryEntry> {
  const { data } = await apiClient.put<ContentLibraryEntry>(`/content-library/${id}`, request)
  return data
}

export async function deleteContentLibraryEntry(id: string): Promise<void> {
  await apiClient.delete(`/content-library/${id}`)
}
