export interface CreditCardFormState {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  postalCode: string
  addressNumber: string
  addressComplement: string
  makeDefault: boolean
}

export const EMPTY_CREDIT_CARD: CreditCardFormState = {
  holderName: '',
  number: '',
  expiryMonth: '',
  expiryYear: '',
  ccv: '',
  postalCode: '',
  addressNumber: '',
  addressComplement: '',
  makeDefault: true,
}

function digits(value: string): string {
  return value.replace(/\D/g, '')
}

function formatCardNumber(raw: string): string {
  return digits(raw).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatCep(raw: string): string {
  const d = digits(raw).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function isCreditCardFormValid(state: CreditCardFormState): boolean {
  const cardDigits = digits(state.number)
  const cep = digits(state.postalCode)
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
    digits(state.ccv).length >= 3 &&
    cep.length === 8 &&
    state.addressNumber.trim().length > 0
  )
}

interface CreditCardFormProps {
  value: CreditCardFormState
  onChange: (next: CreditCardFormState) => void
}

export default function CreditCardForm({ value, onChange }: CreditCardFormProps) {
  function update<K extends keyof CreditCardFormState>(key: K, v: CreditCardFormState[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <legend className="text-sm font-semibold text-gray-700">Dados do cartão</legend>

      <Field label="Nome impresso no cartão" id="card-holder">
        <input
          id="card-holder"
          type="text"
          autoComplete="cc-name"
          value={value.holderName}
          onChange={(e) => update('holderName', e.target.value)}
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

      <div className="grid grid-cols-3 gap-3">
        <Field label="Mês" id="card-month">
          <input
            id="card-month"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            value={value.expiryMonth}
            onChange={(e) => update('expiryMonth', digits(e.target.value).slice(0, 2))}
            placeholder="MM"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
        <Field label="Ano" id="card-year">
          <input
            id="card-year"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            value={value.expiryYear}
            onChange={(e) => update('expiryYear', digits(e.target.value).slice(0, 4))}
            placeholder="AAAA"
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
            placeholder="000"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-3">
        <Field label="CEP" id="card-cep">
          <input
            id="card-cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={value.postalCode}
            onChange={(e) => update('postalCode', formatCep(e.target.value))}
            placeholder="00000-000"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
        <Field label="Número" id="card-addr-num">
          <input
            id="card-addr-num"
            type="text"
            value={value.addressNumber}
            onChange={(e) => update('addressNumber', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
      </div>

      <Field label="Complemento (opcional)" id="card-addr-comp">
        <input
          id="card-addr-comp"
          type="text"
          value={value.addressComplement}
          onChange={(e) => update('addressComplement', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={value.makeDefault}
          onChange={(e) => update('makeDefault', e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-brand-500"
        />
        Definir como método de pagamento padrão
      </label>
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

export { digits as digitsOnly, formatCep, formatCardNumber }
