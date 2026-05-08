import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@/components/icons'
import type {
  Addon,
  ApiSubscription,
  Bundle,
  ModuleId,
  PriceBreakdown as PriceBreakdownData,
} from '@/types'
import {
  getAddon,
  getBundle,
  getSubscription,
  pricePreview,
} from '@/lib/api/billing-api'
import { useError } from '@/contexts/ErrorContext'
import CouponInput from '@/components/billing/CouponInput'
import PaymentMethodPicker from '@/components/billing/PaymentMethodPicker'
import PriceBreakdown from '@/components/billing/PriceBreakdown'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'

type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD'
type Cycle = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

const CYCLE_LABEL: Record<Cycle, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUALLY: 'Semestral',
  YEARLY: 'Anual',
}

export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { showError } = useError()

  const bundleId = params.get('bundle')
  const addonId = params.get('addon')
  const cycleParam = params.get('cycle') as Cycle | null
  const cycle: Cycle = cycleParam ?? 'MONTHLY'

  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [addon, setAddon] = useState<Addon | null>(null)
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null)
  const [breakdown, setBreakdown] = useState<PriceBreakdownData | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    description: string
  } | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('PIX')
  const [loading, setLoading] = useState(true)
  const [comingSoonAction, setComingSoonAction] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const loadBundle = bundleId ? getBundle(bundleId) : Promise.resolve(null)
    const loadAddon = addonId ? getAddon(addonId) : Promise.resolve(null)

    Promise.all([loadBundle, loadAddon, getSubscription().catch(() => null)])
      .then(async ([bundleData, addonData, sub]) => {
        if (cancelled) return
        setBundle(bundleData)
        setAddon(addonData)
        setSubscription(sub)

        if (bundleData) {
          const moduleIds = bundleData.modules.map((m) => m.id) as ModuleId[]
          const preview = await pricePreview(moduleIds, cycle, bundleData.id).catch(() => null)
          if (!cancelled && preview) setBreakdown(preview)
        }
      })
      .catch(showError)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bundleId, addonId, cycle, showError])

  const subscribingTo = useMemo(() => {
    if (bundle) {
      return {
        title: bundle.name,
        subtitle: `${bundle.modules.length} ${bundle.modules.length === 1 ? 'módulo' : 'módulos'} · ${CYCLE_LABEL[cycle].toLowerCase()}`,
      }
    }
    if (addon) {
      return {
        title: addon.name,
        subtitle: addon.description ?? 'Add-on avulso',
      }
    }
    return null
  }, [bundle, addon, cycle])

  function handleApplyCoupon(_code: string): Promise<void> {
    setComingSoonAction('Aplicar cupom')
    return Promise.resolve()
  }

  function handleConfirm() {
    setComingSoonAction('Confirmar assinatura')
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Spinner />
      </main>
    )
  }

  if (!subscribingTo) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Checkout indisponível</h1>
        <p className="text-sm text-gray-600">
          Não conseguimos identificar o plano ou add-on. Volte para a página
          de planos e tente novamente.
        </p>
        <button
          type="button"
          onClick={() => navigate('/pricing')}
          className="self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Ver planos
        </button>
      </main>
    )
  }

  const totalLabel = bundle && breakdown
    ? formatPrice(breakdown.finalPriceCents)
    : addon
      ? formatPrice(addon.priceMonthlyCents)
      : null

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-8">
      <header className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center gap-1.5 self-start text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeftIcon size={16} />
          Voltar para planos
        </button>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Checkout
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Você está assinando
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {subscribingTo.title}
            </span>
            <span className="text-sm text-gray-600">{subscribingTo.subtitle}</span>
            {subscription && (
              <span className="mt-2 text-xs text-warning">
                Você já tem uma assinatura ativa. Confirmar substituirá ou
                somará à assinatura atual.
              </span>
            )}
          </div>

          <CouponInput
            applied={appliedCoupon}
            onApply={handleApplyCoupon}
            onClear={() => setAppliedCoupon(null)}
          />

          <PaymentMethodPicker value={method} onChange={setMethod} />
        </section>

        <aside className="flex flex-col gap-4">
          {breakdown ? (
            <PriceBreakdown data={breakdown} />
          ) : addon ? (
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <span className="text-sm font-semibold text-gray-700">Resumo</span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-700">Total mensal</span>
                <span className="text-2xl font-semibold tracking-tight text-gray-900">
                  {totalLabel}
                </span>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Confirmar e pagar
          </button>
          <p className="text-center text-xs text-gray-500">
            Ao confirmar, você concorda com os termos de uso e a política de
            privacidade.
          </p>
        </aside>
      </div>

      {comingSoonAction && (
        <Modal
          isOpen={true}
          onClose={() => setComingSoonAction(null)}
          title={comingSoonAction}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Esta ação ainda não está disponível. Estamos trabalhando para
              liberá-la em breve.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setComingSoonAction(null)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Entendi
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}
