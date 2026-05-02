import type { Customer, CustomerNote, CustomerEvent, CustomerCalendarEvent, PatientContact, Page } from '@/types'
import { api } from '@/lib/api/api-client'

type PatientContactPayload = Omit<PatientContact, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>

// ========== Customer CRUD ==========

export async function getCustomers(
  page = 0,
  size = 25,
  search?: string,
): Promise<Page<Customer>> {
  const params = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(size),
  })
  if (search) params.set('search', search)
  const { data } = await api.get<Page<Customer>>(`/customers?${params}`)
  return data
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<Customer>(`/customers/${id}`)
  return data
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const { data } = await api.post<Customer>('/customers', customer)
  return data
}

export async function updateCustomer(customer: Customer): Promise<Customer> {
  const { data } = await api.put<Customer>(`/customers/${customer.id}`, customer)
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`)
}

// ========== Customer Notes ==========

export async function getCustomerNotes(customerId: string): Promise<CustomerNote[]> {
  const { data } = await api.get<CustomerNote[]>(`/customers/${customerId}/notes`)
  return data
}

export async function createCustomerNote(
  customerId: string,
  note: { content: string },
): Promise<CustomerNote> {
  const { data } = await api.post<CustomerNote>(`/customers/${customerId}/notes`, note)
  return data
}

export async function deleteCustomerNote(customerId: string, noteId: string): Promise<void> {
  await api.delete(`/customers/${customerId}/notes/${noteId}`)
}

// ========== Customer Events ==========

export async function getCustomerEvents(customerId: string): Promise<CustomerEvent[]> {
  const { data } = await api.get<CustomerEvent[]>(`/customers/${customerId}/events`)
  return data
}

export async function createCustomerEvent(
  customerId: string,
  event: Omit<CustomerEvent, 'id' | 'createdAt'>,
): Promise<CustomerEvent> {
  const { data } = await api.post<CustomerEvent>(`/customers/${customerId}/events`, event)
  return data
}

export async function updateCustomerEvent(
  customerId: string,
  eventId: string,
  event: Partial<CustomerEvent>,
): Promise<CustomerEvent> {
  const { data } = await api.put<CustomerEvent>(`/customers/${customerId}/events/${eventId}`, event)
  return data
}

export async function deleteCustomerEvent(customerId: string, eventId: string): Promise<void> {
  await api.delete(`/customers/${customerId}/events/${eventId}`)
}

// ========== Calendar (all customer events for global view) ==========

export async function getAllCustomerEvents(from: string, to: string): Promise<CustomerCalendarEvent[]> {
  const params = new URLSearchParams({ from, to })
  const { data } = await api.get<CustomerCalendarEvent[]>(`/events?${params}`)
  return data
}

// ========== Patient Contacts ==========

export async function getPatientContacts(customerId: string): Promise<PatientContact[]> {
  const { data } = await api.get<PatientContact[]>(`/customers/${customerId}/contacts`)
  return data
}

export async function createPatientContact(
  customerId: string,
  contact: PatientContactPayload,
): Promise<PatientContact> {
  const { data } = await api.post<PatientContact>(`/customers/${customerId}/contacts`, contact)
  return data
}

export async function updatePatientContact(
  customerId: string,
  contactId: string,
  contact: PatientContactPayload,
): Promise<PatientContact> {
  const { data } = await api.put<PatientContact>(`/customers/${customerId}/contacts/${contactId}`, contact)
  return data
}

export async function deletePatientContact(customerId: string, contactId: string): Promise<void> {
  await api.delete(`/customers/${customerId}/contacts/${contactId}`)
}
