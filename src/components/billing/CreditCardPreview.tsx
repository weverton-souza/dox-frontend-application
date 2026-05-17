import CardBrandIcon from './CardBrandIcon'
import { brandTheme, detectCardBrand, type CardBrand } from '@/lib/card-brand'

interface CreditCardPreviewProps {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  flipped?: boolean
}

function groupsForBrand(brand: CardBrand): number[] {
  if (brand === 'amex') return [4, 6, 5]
  if (brand === 'diners') return [4, 6, 4]
  return [4, 4, 4, 4]
}

function formatNumberDisplay(raw: string, brand: CardBrand): string {
  const groups = groupsForBrand(brand)
  const total = groups.reduce((s, n) => s + n, 0)
  const padded = raw.replace(/\D/g, '').slice(0, total).padEnd(total, '•')
  let i = 0
  return groups
    .map((n) => {
      const slice = padded.slice(i, i + n)
      i += n
      return slice
    })
    .join(' ')
}

function formatExpiryDisplay(month: string, year: string): string {
  const m = month.replace(/\D/g, '').slice(0, 2)
  const y = year.replace(/\D/g, '').slice(0, 4)
  return `${m || 'MM'}/${y || 'AAAA'}`
}

export default function CreditCardPreview({
  holderName,
  number,
  expiryMonth,
  expiryYear,
  ccv,
  flipped = false,
}: CreditCardPreviewProps) {
  const brand = detectCardBrand(number)
  const theme = brandTheme(brand)
  const numberDisplay = formatNumberDisplay(number, brand)
  const expiryDisplay = formatExpiryDisplay(expiryMonth, expiryYear)
  const nameDisplay = holderName.trim() ? holderName.toUpperCase() : 'NOME DO TITULAR'
  const ccvDigits = ccv.replace(/\D/g, '')
  const ccvDisplay = ccvDigits.length > 0 ? ccvDigits : '•••'

  return (
    <div
      className="w-full"
      style={{ aspectRatio: '1.586 / 1', maxWidth: 380, perspective: 1200 }}
    >
      <div
        className="relative h-full w-full transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-gray-200/60 p-5 text-gray-900 shadow-card transition-colors duration-500"
          style={{ backfaceVisibility: 'hidden', background: theme.background }}
        >
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <ChipIcon />
              <div className="flex h-16 items-center">
                {brand === 'unknown' ? (
                  <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
                    Cartão
                  </span>
                ) : (
                  <CardBrandIcon brand={brand} width={110} variant="logo" />
                )}
              </div>
            </div>

            <p
              className="text-lg font-medium tracking-[0.18em] tabular-nums text-gray-900"
              style={{ fontFeatureSettings: '"tnum"' }}
            >
              {numberDisplay}
            </p>

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500">
                  Titular
                </p>
                <p className="mt-0.5 truncate text-xs font-medium tracking-wide text-gray-900">
                  {nameDisplay}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500">
                  Validade
                </p>
                <p className="mt-0.5 text-xs font-medium tracking-wide tabular-nums text-gray-900">
                  {expiryDisplay}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-gray-200/60 text-gray-900 shadow-card transition-colors duration-500"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: theme.background,
          }}
        >
          <div className="mt-6 h-10 w-full bg-gray-800" />
          <div className="px-5 pt-5">
            <div className="flex items-center gap-3">
              <div className="relative h-9 flex-1 overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,0.04) 4px 8px)',
                  }}
                />
              </div>
              <div className="flex h-9 items-center justify-center rounded-sm border border-gray-200 bg-white px-3">
                <span className="font-mono text-sm font-semibold tracking-widest text-gray-900">
                  {ccvDisplay}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[9px] font-medium uppercase tracking-widest text-gray-500">
              Código de segurança (CCV)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChipIcon() {
  return (
    <svg width="48" height="38" viewBox="0 0 40 32" aria-hidden="true">
      <defs>
        <linearGradient id="chip-base" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5dca0" />
          <stop offset="40%" stopColor="#d4a958" />
          <stop offset="100%" stopColor="#9d7424" />
        </linearGradient>
        <linearGradient id="chip-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <rect x="0.5" y="0.5" width="39" height="31" rx="5" fill="url(#chip-base)" />
      <rect x="0.5" y="0.5" width="39" height="31" rx="5" fill="url(#chip-sheen)" />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="31"
        rx="5"
        fill="none"
        stroke="#7a5818"
        strokeOpacity="0.35"
        strokeWidth="0.6"
      />

      <g stroke="#7a5818" strokeOpacity="0.55" strokeWidth="0.7" fill="none">
        <path d="M6 4 V12 H17 V20 H6 V28" />
        <path d="M34 4 V12 H23 V20 H34 V28" />
        <line x1="17" y1="16" x2="23" y2="16" />
        <rect x="14" y="13" width="12" height="6" rx="0.8" />
      </g>
    </svg>
  )
}
