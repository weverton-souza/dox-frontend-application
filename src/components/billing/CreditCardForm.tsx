import { useState } from 'react'
import CardBrandIcon from './CardBrandIcon'
import CreditCardPreview from './CreditCardPreview'
import { detectCardBrand } from '@/lib/card-brand'

const ACCEPTED_BRANDS = ['visa', 'mastercard', 'elo', 'amex', 'diners', 'discover'] as const

export interface CreditCardFormState {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  makeDefault: boolean
}

export const EMPTY_CREDIT_CARD: CreditCardFormState = {
  holderName: '',
  number: '',
  expiryMonth: '',
  expiryYear: '',
  ccv: '',
  makeDefault: true,
}

function digits(value: string): string {
  return value.replace(/\D/g, '')
}

function formatCardNumber(raw: string): string {
  const d = digits(raw)
  const brand = detectCardBrand(d)
  const groups = brand === 'amex' ? [4, 6, 5] : brand === 'diners' ? [4, 6, 4] : [4, 4, 4, 4]
  const max = groups.reduce((s, n) => s + n, 0)
  const trimmed = d.slice(0, max)
  let i = 0
  return groups
    .map((n) => {
      const slice = trimmed.slice(i, i + n)
      i += n
      return slice
    })
    .filter(Boolean)
    .join(' ')
}

function formatExpiry(month: string, year: string): string {
  const m = digits(month).slice(0, 2)
  const y = digits(year).slice(0, 4)
  if (!m && !y) return ''
  if (m && !y) return m
  return `${m}/${y}`
}

function parseExpiryInput(raw: string): { month: string; year: string } {
  const d = digits(raw).slice(0, 6)
  return { month: d.slice(0, 2), year: d.slice(2, 6) }
}

export function isCreditCardFormValid(state: CreditCardFormState): boolean {
  const cardDigits = digits(state.number)
  const month = Number(state.expiryMonth)
  const year = Number(state.expiryYear)
  return (
    state.holderName.trim().length >= 3 &&
    cardDigits.length >= 13 &&
    cardDigits.length <= 19 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year) &&
    year >= 2026 &&
    year <= 2050 &&
    digits(state.ccv).length >= 3
  )
}

interface CreditCardFormProps {
  value: CreditCardFormState
  onChange: (next: CreditCardFormState) => void
}

export default function CreditCardForm({ value, onChange }: CreditCardFormProps) {
  const [flipped, setFlipped] = useState(false)

  function update<K extends keyof CreditCardFormState>(key: K, v: CreditCardFormState[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <legend className="text-sm font-semibold text-gray-700">Dados do cartão</legend>

      <div className="flex justify-center pt-1 pb-2">
        <CreditCardPreview
          holderName={value.holderName}
          number={value.number}
          expiryMonth={value.expiryMonth}
          expiryYear={value.expiryYear}
          ccv={value.ccv}
          flipped={flipped}
        />
      </div>

      <Field label="Nome impresso no cartão" id="card-holder">
        <input
          id="card-holder"
          type="text"
          autoComplete="cc-name"
          value={value.holderName}
          onChange={(e) => update('holderName', e.target.value.toUpperCase())}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>

      <Field label="Número do cartão" id="card-number">
        <input
          id="card-number"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={value.number}
          onChange={(e) => update('number', formatCardNumber(e.target.value))}
          placeholder="0000 0000 0000 0000"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label="Validade" id="card-expiry">
          <input
            id="card-expiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={formatExpiry(value.expiryMonth, value.expiryYear)}
            onChange={(e) => {
              const { month, year } = parseExpiryInput(e.target.value)
              onChange({ ...value, expiryMonth: month, expiryYear: year })
            }}
            placeholder="MM/AAAA"
            maxLength={7}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
        <Field label="CCV" id="card-ccv">
          <input
            id="card-ccv"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={value.ccv}
            onChange={(e) => update('ccv', digits(e.target.value).slice(0, 4))}
            onFocus={() => setFlipped(true)}
            onBlur={() => setFlipped(false)}
            placeholder="000"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={value.makeDefault}
          onChange={(e) => update('makeDefault', e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-brand-500"
        />
        Definir como método de pagamento padrão
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 pt-3">
        <span className="text-[11px] font-medium text-gray-500">Bandeiras aceitas</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {ACCEPTED_BRANDS.map((b) => (
            <CardBrandIcon key={b} brand={b} width={32} variant="flat" />
          ))}
        </div>
      </div>
    </fieldset>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  )
}

