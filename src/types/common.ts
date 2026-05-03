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

export const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] =
  (Object.entries(CONTACT_TYPE_LABELS) as [ContactType, string][]).map(
    ([value, label]) => ({ value, label })
  )

export function createEmptyContactItem(type: ContactType = 'instagram'): ContactItem {
  return {
    id: crypto.randomUUID(),
    type,
    value: '',
  }
}

// ========== Calendar Event Tags ==========

export interface EventTag {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

// ========== Calendar Events (Google Calendar pattern) ==========

export interface EventDateTime {
  date?: string
  dateTime?: string
  timeZone?: string
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: EventDateTime
  end: EventDateTime
  allDay: boolean
  tagId?: string
  tagName?: string
  tagColor?: string
  customerId?: string
  customerName?: string
  status: 'confirmed' | 'tentative' | 'cancelled'
  recurrence?: string[]
  reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] }
  googleEventId?: string
  iCalUID?: string
  createdAt: string
  updatedAt: string
}

// ========== Customer Event (calendar global view — from prontuário) ==========

import type { CustomerEventType } from './customer'

export interface CustomerCalendarEvent {
  id: string
  customerId: string
  customerName: string
  type: CustomerEventType
  title: string
  description: string
  date: string
  createdAt: string
}

// ========== Pagination (Spring Boot Page model) ==========

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number        // página atual (0-indexed)
  size: number          // itens por página
  first: boolean
  last: boolean
  empty: boolean
}

// ========== Template Variables ==========

export type VariableMap = Record<string, string>

export interface VariableInfo {
  key: string
  label: string
  source: 'customer' | 'form' | 'backend'
}

// ========== API Error Types (RFC 7807 ProblemDetail) ==========

export type ApiErrorCode =
  | 'RESOURCE_NOT_FOUND'
  | 'DUPLICATE_RESOURCE'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'ACCESS_DENIED'
  | 'BUSINESS_RULE_VIOLATION'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export interface ValidationFieldError {
  field: string
  message: string
  rejectedValue: unknown
}

export interface ProblemDetailProperties {
  errorCode: ApiErrorCode
  timestamp: string
  resource?: string
  identifier?: string
  field?: string
  value?: string
  errors?: ValidationFieldError[]
  violations?: string[]
  traceId?: string
}

export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  properties: ProblemDetailProperties
}
