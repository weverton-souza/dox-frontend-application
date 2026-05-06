import { api } from './api-client'
import type { FormLink, FormLinkEmailHistoryItem, MultiSendRecipient } from '@/types'

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
  sendEmail: boolean = false,
): Promise<FormLink[]> {
  const { data } = await api.post<FormLink[]>('/form-links/multi-send', {
    formId,
    customerId,
    expiresInHours,
    recipients,
    sendEmail,
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

export async function resendFormLinkInvite(id: string): Promise<FormLink> {
  const { data } = await api.post<FormLink>(`/form-links/${id}/resend-invite`)
  return data
}

export async function getFormLinkEmailHistory(id: string): Promise<FormLinkEmailHistoryItem[]> {
  const { data } = await api.get<FormLinkEmailHistoryItem[]>(`/form-links/${id}/email-history`)
  return data
}
