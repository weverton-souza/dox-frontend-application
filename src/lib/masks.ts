type MaskType = 'cpf' | 'phone' | 'cep'

const MASK_PATTERNS: Record<MaskType, { maxDigits: number; format: (digits: string) => string }> = {
  cpf: {
    maxDigits: 11,
    format: (d) => {
      if (d.length <= 3) return d
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    },
  },
  phone: {
    maxDigits: 11,
    format: (d) => {
      if (d.length <= 2) return d.length > 0 ? `(${d}` : ''
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    },
  },
  cep: {
    maxDigits: 8,
    format: (d) => {
      if (d.length <= 5) return d
      return `${d.slice(0, 5)}-${d.slice(5)}`
    },
  },
}

export function applyMask(value: string, mask: MaskType): string {
  const digits = value.replace(/\D/g, '')
  const { maxDigits, format } = MASK_PATTERNS[mask]
  return format(digits.slice(0, maxDigits))
}

export function unmask(value: string): string {
  return value.replace(/\D/g, '')
}
