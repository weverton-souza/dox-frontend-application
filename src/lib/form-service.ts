import type { AnamnesisForm, FormResponse } from '@/types'
import { DEFAULT_FORMS } from '@/lib/default-forms'
import { readFromStorage, writeToStorage } from '@/lib/storage-utils'

// ========== Storage Keys ==========

const FORMS_KEY = 'neurohub_forms'
const FORM_RESPONSES_KEY = 'neurohub_form_responses'

// ========== Helpers (localStorage) ==========

function readForms(): AnamnesisForm[] {
  return readFromStorage<AnamnesisForm>(FORMS_KEY)
}

function writeForms(forms: AnamnesisForm[]): void {
  writeToStorage(FORMS_KEY, forms)
}

function readAllResponses(): FormResponse[] {
  return readFromStorage<FormResponse>(FORM_RESPONSES_KEY)
}

function writeAllResponses(responses: FormResponse[]): void {
  writeToStorage(FORM_RESPONSES_KEY, responses)
}

// ========== Formulários (CRUD) ==========
// Todas as funções são async para facilitar migração para API REST

export async function listForms(): Promise<AnamnesisForm[]> {
  const custom = readForms().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  // Defaults always first, then custom sorted by updatedAt
  const defaultIds = new Set(DEFAULT_FORMS.map((f) => f.id))
  const filtered = custom.filter((f) => !defaultIds.has(f.id))
  return [...DEFAULT_FORMS, ...filtered]
}

export async function getFormById(id: string): Promise<AnamnesisForm | null> {
  // Check defaults first, then localStorage
  const defaultForm = DEFAULT_FORMS.find((f) => f.id === id)
  if (defaultForm) return defaultForm
  return readForms().find((f) => f.id === id) ?? null
}

export function isDefaultForm(formId: string): boolean {
  return DEFAULT_FORMS.some((f) => f.id === formId)
}

export async function createForm(form: AnamnesisForm): Promise<AnamnesisForm> {
  const forms = readForms()
  const now = new Date().toISOString()
  const created = { ...form, createdAt: now, updatedAt: now }
  forms.push(created)
  writeForms(forms)
  return created
}

export async function updateForm(form: AnamnesisForm): Promise<AnamnesisForm> {
  const forms = readForms()
  const index = forms.findIndex((f) => f.id === form.id)
  const updated = { ...form, updatedAt: new Date().toISOString() }

  if (index >= 0) {
    forms[index] = updated
  } else {
    forms.push(updated)
  }

  writeForms(forms)
  return updated
}

export async function deleteForm(id: string): Promise<void> {
  const forms = readForms().filter((f) => f.id !== id)
  writeForms(forms)
  // Cascade: deletar todas as respostas deste formulário
  await deleteFormResponses(id)
}

// ========== Respostas (CRUD) ==========

export async function listFormResponses(formId: string): Promise<FormResponse[]> {
  return readAllResponses()
    .filter((r) => r.formId === formId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getFormResponseById(id: string): Promise<FormResponse | null> {
  return readAllResponses().find((r) => r.id === id) ?? null
}

export async function createFormResponse(response: FormResponse): Promise<FormResponse> {
  const all = readAllResponses()
  const now = new Date().toISOString()
  const created = { ...response, createdAt: now, updatedAt: now }
  all.push(created)
  writeAllResponses(all)
  return created
}

export async function updateFormResponse(response: FormResponse): Promise<FormResponse> {
  const all = readAllResponses()
  const index = all.findIndex((r) => r.id === response.id)
  const updated = { ...response, updatedAt: new Date().toISOString() }

  if (index >= 0) {
    all[index] = updated
  } else {
    all.push(updated)
  }

  writeAllResponses(all)
  return updated
}

export async function deleteFormResponse(id: string): Promise<void> {
  const all = readAllResponses().filter((r) => r.id !== id)
  writeAllResponses(all)
}

export async function deleteFormResponses(formId: string): Promise<void> {
  const all = readAllResponses().filter((r) => r.formId !== formId)
  writeAllResponses(all)
}

// ========== Contagem (utilitário para listagens) ==========

export async function countAllFormResponses(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const r of readAllResponses()) {
    counts[r.formId] = (counts[r.formId] ?? 0) + 1
  }
  return counts
}
