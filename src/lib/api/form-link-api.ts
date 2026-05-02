import { api } from './api-client'
import type { FormLink, MultiSendRecipient } from '@/types'

export async function createFormLink(
  formId: string,
  customerId: string,
  expiresInHours: number = 72,
): Promise<FormLink> {
  const { data } = await api.post<FormLink>('/form-links', { formId, customerId, expiresInHours })
  return data
}

export async function multiSendFormLinks(
  formId: string,
  customerId: string,
  recipients: MultiSendRecipient[],
  expiresInHours: number = 168,
): Promise<FormLink[]> {
  const { data } = await api.post<FormLink[]>('/form-links/multi-send', {
    formId,
    customerId,
    expiresInHours,
    recipients,
  })
  return data
}

export async function getFormLinksByCustomer(customerId: string): Promise<FormLink[]> {
  const { data } = await api.get<FormLink[]>('/form-links', { params: { customerId } })
  return data
}

export async function revokeFormLink(id: string): Promise<void> {
  await api.delete(`/form-links/${id}`)
}
