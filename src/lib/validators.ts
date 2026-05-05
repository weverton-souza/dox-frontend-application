import type { FieldValidation } from '@/types'
import { api } from '@/lib/api/api-client'

export interface AddressLookup {
  street: string
  neighborhood: string
  city: string
  state: string
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function formatCpf(raw: string): string {
  const d = digitsOnly(raw).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function isValidCpf(raw: string): boolean {
  const d = digitsOnly(raw)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false

  const calcCheck = (slice: string, factor: number): number => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i], 10) * (factor - i)
    }
    const mod = (sum * 10) % 11
    return mod === 10 ? 0 : mod
  }

  const check1 = calcCheck(d.slice(0, 9), 10)
  if (check1 !== parseInt(d[9], 10)) return false
  const check2 = calcCheck(d.slice(0, 10), 11)
  if (check2 !== parseInt(d[10], 10)) return false

  return true
}

export function formatPhoneBr(raw: string): string {
  const d = digitsOnly(raw).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function isValidPhoneBr(raw: string): boolean {
  const d = digitsOnly(raw)
  if (d.length !== 10 && d.length !== 11) return false
  const ddd = parseInt(d.slice(0, 2), 10)
  if (ddd < 11 || ddd > 99) return false
  if (d.length === 11 && d[2] !== '9') return false
  return true
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(raw: string): boolean {
  return EMAIL_REGEX.test(raw.trim())
}

export function formatCep(raw: string): string {
  const d = digitsOnly(raw).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export function isValidCep(raw: string): boolean {
  const d = digitsOnly(raw)
  return d.length === 8
}

export function applyMask(validation: FieldValidation | undefined, raw: string): string {
  if (!validation) return raw
  switch (validation) {
    case 'cpf':
      return formatCpf(raw)
    case 'phone-br':
      return formatPhoneBr(raw)
    case 'cep':
      return formatCep(raw)
    case 'email':
      return raw.trim()
  }
}

export function validateInput(validation: FieldValidation | undefined, raw: string): string | null {
  if (!validation) return null
  if (!raw) return null
  switch (validation) {
    case 'cpf':
      return isValidCpf(raw) ? null : 'CPF inválido'
    case 'phone-br':
      return isValidPhoneBr(raw) ? null : 'Telefone inválido'
    case 'email':
      return isValidEmail(raw) ? null : 'Email inválido'
    case 'cep':
      return isValidCep(raw) ? null : 'CEP inválido'
  }
}

interface AddressLookupResponse {
  zipCode: string
  street: string
  neighborhood: string
  city: string
  state: string
}

export async function fetchAddressByCep(cep: string): Promise<AddressLookup | null> {
  const d = digitsOnly(cep)
  if (d.length !== 8) return null
  try {
    const { data } = await api.get<AddressLookupResponse>(`/public/address/lookup/${d}`)
    return {
      street: data.street ?? '',
      neighborhood: data.neighborhood ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
    }
  } catch {
    return null
  }
}
