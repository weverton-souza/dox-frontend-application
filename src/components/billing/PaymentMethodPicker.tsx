import type { BillingType } from '@/types'

type SelectableMethod = Extract<BillingType, 'PIX' | 'BOLETO' | 'CREDIT_CARD'>

interface PaymentMethodPickerProps {
  value: SelectableMethod
  onChange: (method: SelectableMethod) => void
}

interface MethodOption {
  id: SelectableMethod
  label: string
  description: string
}

const METHODS: MethodOption[] = [
  { id: 'PIX', label: 'PIX', description: 'Liquidação imediata, sem taxa extra' },
  { id: 'CREDIT_CARD', label: 'Cartão de crédito', description: 'Cobrança recorrente automática' },
  { id: 'BOLETO', label: 'Boleto', description: 'Compensação em até 2 dias úteis' },
]

export default function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-xs font-medium text-gray-700">
        Método de pagamento
      </legend>
      {METHODS.map((method) => {
        const selected = value === method.id
        return (
          <label
            key={method.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
              selected
                ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/10'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={selected}
              onChange={() => onChange(method.id)}
              className="mt-1 h-4 w-4 cursor-pointer accent-brand-500"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">{method.label}</span>
              <span className="text-xs text-gray-600">{method.description}</span>
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
