import type { PaymentMethod } from '@/types'
import { formatPaymentMethod } from '@/lib/billing-format'
import { formatDate } from '@/lib/utils'

interface PaymentMethodSectionProps {
  methods: PaymentMethod[]
  onChangeRequest: () => void
}

export default function PaymentMethodSection({
  methods,
  onChangeRequest,
}: PaymentMethodSectionProps) {
  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Método de pagamento
          </h3>
          <p className="text-sm text-gray-600">
            Como cobramos sua assinatura.
          </p>
        </div>
        <button
          type="button"
          onClick={onChangeRequest}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Trocar método
        </button>
      </header>

      <div className="space-y-2">
        {methods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Nenhum método de pagamento cadastrado.
          </div>
        ) : (
          methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <CardIcon />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPaymentMethod(method)}
                  </p>
                  {method.holderName && (
                    <p className="text-xs text-gray-500">{method.holderName}</p>
                  )}
                  {method.expiresAt && (
                    <p className="text-xs text-gray-500">
                      Válido até {formatDate(method.expiresAt)}
                    </p>
                  )}
                </div>
              </div>
              {method.isDefault && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  Padrão
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function CardIcon() {
  return (
    <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gray-100">
      <svg
        className="h-5 w-5 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    </div>
  )
}
