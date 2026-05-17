export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'elo'
  | 'hipercard'
  | 'diners'
  | 'discover'
  | 'unknown'

interface BrandRule {
  brand: CardBrand
  pattern: RegExp
}

const RULES: BrandRule[] = [
  { brand: 'amex', pattern: /^3[47]/ },
  { brand: 'hipercard', pattern: /^(6062|3841)/ },
  {
    brand: 'elo',
    pattern: /^(4011|4312|4389|4514|4576|5041|5066|5067|509|627780|636297|636368|6500|6504|6505|6507|6509|6516|6550)/,
  },
  { brand: 'diners', pattern: /^(30[0-5]|36|38)/ },
  { brand: 'discover', pattern: /^(6011|65|64[4-9])/ },
  { brand: 'mastercard', pattern: /^(5[1-5]|2[2-7])/ },
  { brand: 'visa', pattern: /^4/ },
]

export function detectCardBrand(rawNumber: string): CardBrand {
  const digits = rawNumber.replace(/\D/g, '')
  if (digits.length < 2) return 'unknown'
  for (const rule of RULES) {
    if (rule.pattern.test(digits)) return rule.brand
  }
  return 'unknown'
}

export interface BrandTheme {
  background: string
}

const FALLBACK_BACKGROUND = 'linear-gradient(135deg, #ffffff 0%, #f0f0f3 100%)'

const BRAND_THEMES: Record<CardBrand, BrandTheme> = {
  amex: { background: FALLBACK_BACKGROUND },
  visa: { background: FALLBACK_BACKGROUND },
  mastercard: { background: FALLBACK_BACKGROUND },
  elo: { background: FALLBACK_BACKGROUND },
  hipercard: { background: FALLBACK_BACKGROUND },
  diners: { background: FALLBACK_BACKGROUND },
  discover: { background: FALLBACK_BACKGROUND },
  unknown: { background: FALLBACK_BACKGROUND },
}

export function brandTheme(brand: CardBrand): BrandTheme {
  return BRAND_THEMES[brand]
}
