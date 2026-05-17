import { useLayoutEffect, useRef, useState } from 'react'
import type { PaymentMethod } from '@/types'
import { formatPaymentMethod } from '@/lib/billing-format'
import { useError } from '@/contexts/ErrorContext'
import { deletePaymentMethod, setDefaultPaymentMethod } from '@/lib/api/billing-api'
import { TrashIcon } from '@/components/icons'
import CardBrandIcon from './CardBrandIcon'

function formatExpiry(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
}

interface PaymentMethodSectionProps {
  methods: PaymentMethod[]
  onChangeRequest: () => void
  onChanged: () => void
}

export default function PaymentMethodSection({
  methods,
  onChangeRequest,
  onChanged,
}: PaymentMethodSectionProps) {
  const { showError } = useError()
  const [busyId, setBusyId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevTopsRef = useRef<Map<string, number>>(new Map())

  useLayoutEffect(() => {
    const container = listRef.current
    if (!container) return
    const containerTop = container.getBoundingClientRect().top
    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-flip-key]'))
    const newTops = new Map<string, number>()
    items.forEach((el) => {
      const k = el.dataset.flipKey
      if (k) newTops.set(k, el.getBoundingClientRect().top - containerTop)
    })
    items.forEach((el) => {
      const k = el.dataset.flipKey
      if (!k) return
      const oldTop = prevTopsRef.current.get(k)
      const newTop = newTops.get(k)
      if (oldTop === undefined || newTop === undefined) return
      const delta = oldTop - newTop
      if (Math.abs(delta) < 1) return
      el.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
        { duration: 500, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      )
    })
    prevTopsRef.current = newTops
  }, [methods])

  async function handleSetDefault(id: string) {
    if (busyId) return
    setBusyId(id)
    try {
      await setDefaultPaymentMethod(id)
      onChanged()
    } catch (err) {
      showError(err)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(method: PaymentMethod) {
    if (busyId) return
    const label = `${method.brand ?? 'cartão'} ****${method.last4 ?? ''}`.trim()
    const confirmMsg = method.isDefault
      ? `Remover ${label}? Por ser o cartão padrão, outro cartão será promovido automaticamente (se houver).`
      : `Remover ${label}?`
    if (!window.confirm(confirmMsg)) return
    setBusyId(method.id)
    try {
      await deletePaymentMethod(method.id)
      onChanged()
    } catch (err) {
      showError(err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Método de pagamento
          </h3>
          <p className="text-sm text-gray-600">Como cobramos sua assinatura.</p>
        </div>
        <button
          type="button"
          onClick={onChangeRequest}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Adicionar cartão
        </button>
      </header>

      <div ref={listRef} className="space-y-2">
        {methods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Nenhum método de pagamento cadastrado.
          </div>
        ) : (
          methods.map((method) => {
            const busy = busyId === method.id
            return (
              <div
                key={method.id}
                data-flip-key={method.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <CardBrandIcon brand={method.brand ?? ''} width={48} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPaymentMethod(method)}
                    </p>
                    {method.holderName && (
                      <p className="text-xs text-gray-500">{method.holderName}</p>
                    )}
                    {method.expiresAt && formatExpiry(method.expiresAt) && (
                      <p className="text-xs text-gray-500">
                        Válido até {formatExpiry(method.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.isDefault ? (
                    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      Padrão
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={busy}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Tornar padrão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(method)}
                    disabled={busy}
                    title="Remover cartão"
                    aria-label="Remover cartão"
                    className="rounded-md p-1.5 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
