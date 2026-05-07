import { useAuth } from '@/contexts/AuthContext'
import { getStoredCustomerLabel } from '@/lib/api/api-client'

const FALLBACK = 'Cliente'

export interface CustomerLabel {
  singular: string
  plural: string
}

export function useCustomerLabel(): CustomerLabel {
  const { user } = useAuth()
  const singular = user?.customerLabel || getStoredCustomerLabel() || FALLBACK
  return {
    singular,
    plural: pluralize(singular),
  }
}

export function customerLabelLowercase(label: string): string {
  return label.toLowerCase()
}

function pluralize(label: string): string {
  return `${label}s`
}
