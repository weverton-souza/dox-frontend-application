import axios from 'axios'
import { API_BASE_URL } from './api-client'

export interface PublicVerifyResponse {
  valid: boolean
  verificationCode?: string
  reason?: 'not_found' | 'hash_mismatch' | string
}

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export async function verifyDocument(code: string): Promise<PublicVerifyResponse> {
  const sanitized = code.replace(/-/g, '').toUpperCase()
  const { data } = await publicApi.get<PublicVerifyResponse>(`/public/verify/${sanitized}`)
  return data
}

export function formatVerificationCode(code: string): string {
  const clean = code.replace(/-/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join('-') ?? clean
}
