import type { Form, FormField, FormResponse, FormFieldAnswer } from '@/types'
import { api } from '@/lib/api/api-client'

function normalizeField(field: FormField): FormField {
  return {
    ...field,
    options: field.options ?? [],
    reverseScored: field.reverseScored ?? false,
    likertScale: field.likertScale ?? [],
    likertRows: field.likertRows ?? [],
  }
}

function normalizeAnswer(answer: FormFieldAnswer): FormFieldAnswer {
  return {
    ...answer,
    selectedOptionIds: answer.selectedOptionIds ?? [],
    likertAnswers: answer.likertAnswers ?? {},
  }
}

function normalizeForm(form: Form): Form {
  return {
    ...form,
    fields: (form.fields ?? []).map(normalizeField),
    fieldMappings: form.fieldMappings ?? [],
    scoringConfig: form.scoringConfig ?? { formulas: [] },
  }
}

function normalizeResponse(response: FormResponse): FormResponse {
  return {
    ...response,
    answers: (response.answers ?? []).map(normalizeAnswer),
  }
}

// ========== Forms CRUD ==========

export async function getForms(): Promise<Form[]> {
  const { data } = await api.get<Form[]>('/forms')
  return data.map(normalizeForm)
}

export async function getFormById(id: string): Promise<Form> {
  const { data } = await api.get<Form>(`/forms/${id}`)
  return normalizeForm(data)
}

function buildFormPayload(form: Partial<Form>) {
  return {
    title: form.title,
    description: form.description,
    fields: form.fields ?? [],
    fieldMappings: form.fieldMappings ?? [],
    scoringConfig: form.scoringConfig ?? { formulas: [] },
  }
}

export async function createForm(form: Partial<Form>): Promise<Form> {
  const { data } = await api.post<Form>('/forms', buildFormPayload(form))
  return data
}

export async function updateForm(form: Form): Promise<Form> {
  const { data } = await api.put<Form>(`/forms/${form.id}`, buildFormPayload(form))
  return data
}

export async function deleteForm(id: string): Promise<void> {
  await api.delete(`/forms/${id}`)
}

// ========== Form Responses CRUD ==========

export async function listFormResponses(formId: string): Promise<FormResponse[]> {
  const { data } = await api.get<FormResponse[]>(`/forms/${formId}/responses`)
  return data.map(normalizeResponse)
}

export async function getFormResponseById(formId: string, responseId: string): Promise<FormResponse> {
  const { data } = await api.get<FormResponse>(`/forms/${formId}/responses/${responseId}`)
  return normalizeResponse(data)
}

export async function createFormResponse(
  formId: string,
  response: Partial<FormResponse>,
): Promise<FormResponse> {
  const { data } = await api.post<FormResponse>(`/forms/${formId}/responses`, response)
  return normalizeResponse(data)
}

export async function updateFormResponse(
  formId: string,
  response: FormResponse,
): Promise<FormResponse> {
  const { data } = await api.put<FormResponse>(
    `/forms/${formId}/responses/${response.id}`,
    response,
  )
  return normalizeResponse(data)
}

export async function deleteFormResponse(formId: string, responseId: string): Promise<void> {
  await api.delete(`/forms/${formId}/responses/${responseId}`)
}

// ========== Form Responses by Customer ==========

export async function getFormResponsesByCustomerId(customerId: string): Promise<FormResponse[]> {
  const { data } = await api.get<FormResponse[]>(`/forms/by-customer/${customerId}/responses`)
  return data.map(normalizeResponse)
}
