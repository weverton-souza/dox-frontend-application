import axios from 'axios'
import { API_BASE_URL } from './api-client'
import type { PublicFormData, FormField, FormFieldAnswer } from '@/types'

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

function normalizeField(field: FormField): FormField {
  return {
    ...field,
    options: field.options ?? [],
    reverseScored: field.reverseScored ?? false,
    likertScale: field.likertScale ?? [],
    likertRows: field.likertRows ?? [],
  }
}

export async function getPublicForm(token: string): Promise<PublicFormData> {
  const { data } = await publicApi.get<PublicFormData>(`/public/forms/${token}`)
  return { ...data, fields: (data.fields ?? []).map(normalizeField) }
}

export async function submitPublicForm(
  token: string,
  answers: FormFieldAnswer[],
): Promise<void> {
  await publicApi.post(`/public/forms/${token}/submit`, { answers })
}

export interface PublicFormDraft {
  partialResponse: Record<string, unknown>
  savedAt: string
}

export async function getPublicFormDraft(token: string): Promise<PublicFormDraft | null> {
  try {
    const { data } = await publicApi.get<PublicFormDraft>(`/public/forms/${token}/draft`)
    return data
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 404) return null
    }
    throw err
  }
}

export async function savePublicFormDraft(
  token: string,
  partialResponse: Record<string, unknown>,
): Promise<PublicFormDraft> {
  const { data } = await publicApi.put<PublicFormDraft>(
    `/public/forms/${token}/draft`,
    { partialResponse },
  )
  return data
}
