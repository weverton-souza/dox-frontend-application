import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@/components/icons'
import type {
  Addon,
  ApiSubscription,
  Bundle,
  ModuleId,
  PriceBreakdown as PriceBreakdownData,
  TenantPromotion,
} from '@/types'
import {
  applyCoupon,
  getAddon,
  getBundle,
  getSubscription,
  listActivePromotions,
  pricePreview,
  revokePromotion,
  subscribeBundle,
  subscribeModules,
} from '@/lib/api/billing-api'
import { useAuth } from '@/contexts/AuthContext'
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

function describePromotion(p: TenantPromotion): string {
  const promo = p.promotion
  if (promo.discountType === 'PERCENTAGE') {
    return `${promo.discountValue}% off · ${promo.name}`
  }
  if (promo.discountType === 'FIXED_AMOUNT') {
    return `${formatPrice(promo.discountValue)} off · ${promo.name}`
  }
  if (promo.discountType === 'FREE_MONTHS') {
    const m = promo.discountValue
    return `${m} ${m === 1 ? 'mês grátis' : 'meses grátis'} · ${promo.name}`
  }
  return promo.name
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function isValidCpfCnpj(raw: string): boolean {
  const d = digitsOnly(raw)
  return d.length === 11 || d.length === 14
}

export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { showError } = useError()
  const { user } = useAuth()

  const bundleId = params.get('bundle')
  const addonId = params.get('addon')
  const cycleParam = params.get('cycle') as Cycle | null
  const cycle: Cycle = cycleParam ?? 'MONTHLY'

  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [addon, setAddon] = useState<Addon | null>(null)
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null)
  const [breakdown, setBreakdown] = useState<PriceBreakdownData | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<TenantPromotion | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('PIX')
  const [billingName, setBillingName] = useState('')
  const [billingCpfCnpj, setBillingCpfCnpj] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [comingSoonAction, setComingSoonAction] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setBillingName((prev) => prev || user.name)
      setBillingEmail((prev) => prev || user.email)
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const loadBundle = bundleId ? getBundle(bundleId) : Promise.resolve(null)
    const loadAddon = addonId ? getAddon(addonId) : Promise.resolve(null)

    Promise.all([
      loadBundle,
      loadAddon,
      getSubscription().catch(() => null),
      listActivePromotions().catch(() => [] as TenantPromotion[]),
    ])
      .then(async ([bundleData, addonData, sub, promos]) => {
        if (cancelled) return
        setBundle(bundleData)
        setAddon(addonData)
        setSubscription(sub)
        setAppliedPromo(promos[0] ?? null)

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

  async function handleApplyCoupon(code: string) {
    const promo = await applyCoupon(code)
    setAppliedPromo(promo)
  }

  async function handleClearCoupon() {
    if (!appliedPromo) return
    const previous = appliedPromo
    setAppliedPromo(null)
    try {
      await revokePromotion(previous.id)
    } catch (err) {
      setAppliedPromo(previous)
      showError(err)
    }
  }

  const formInvalid =
    !billingName.trim() || !isValidCpfCnpj(billingCpfCnpj) || !billingEmail.includes('@')

  async function handleConfirm() {
    if (method === 'CREDIT_CARD') {
      setComingSoonAction('Pagamento com cartão')
      return
    }
    if (formInvalid || submitting) return

    setSubmitting(true)
    try {
      if (bundle) {
        await subscribeBundle({
          bundleId: bundle.id,
          cycle,
          billingType: method,
          customerName: billingName.trim(),
          customerCpfCnpj: digitsOnly(billingCpfCnpj),
          customerEmail: billingEmail.trim(),
        })
      } else if (addon?.targetModuleId) {
        await subscribeModules({
          moduleIds: [addon.targetModuleId as ModuleId],
          cycle: 'MONTHLY',
          billingType: method,
          customerName: billingName.trim(),
          customerCpfCnpj: digitsOnly(billingCpfCnpj),
          customerEmail: billingEmail.trim(),
        })
      } else {
        setComingSoonAction('Assinatura desse add-on')
        return
      }
      navigate('/settings/billing?subscribed=1')
    } catch (err) {
      showError(err)
    } finally {
      setSubmitting(false)
    }
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

  const totalLabel =
    bundle && breakdown
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
                Você já tem uma assinatura ativa. O sistema irá impedir uma
                nova assinatura sobre a atual — cancele antes se quiser trocar.
              </span>
            )}
          </div>

          <BillingProfileForm
            name={billingName}
            cpfCnpj={billingCpfCnpj}
            email={billingEmail}
            onChangeName={setBillingName}
            onChangeCpfCnpj={setBillingCpfCnpj}
            onChangeEmail={setBillingEmail}
          />

          <CouponInput
            applied={
              appliedPromo
                ? {
                    code: appliedPromo.promotion.code ?? appliedPromo.promotion.name,
                    description: describePromotion(appliedPromo),
                  }
                : null
            }
            onApply={handleApplyCoupon}
            onClear={handleClearCoupon}
          />

          <PaymentMethodPicker value={method} onChange={setMethod} />
          {method === 'CREDIT_CARD' && (
            <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
              Pagamento por cartão chega na próxima atualização. Por enquanto
              use PIX ou Boleto.
            </p>
          )}
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
            disabled={submitting || formInvalid || method === 'CREDIT_CARD'}
            className="rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Processando…' : 'Confirmar e pagar'}
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

interface BillingProfileFormProps {
  name: string
  cpfCnpj: string
  email: string
  onChangeName: (v: string) => void
  onChangeCpfCnpj: (v: string) => void
  onChangeEmail: (v: string) => void
}

function BillingProfileForm({
  name,
  cpfCnpj,
  email,
  onChangeName,
  onChangeCpfCnpj,
  onChangeEmail,
}: BillingProfileFormProps) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <legend className="text-sm font-semibold text-gray-700">Dados de cobrança</legend>
      <Field label="Nome completo ou razão social" id="billing-name">
        <input
          id="billing-name"
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>
      <Field label="CPF ou CNPJ" id="billing-cpfcnpj">
        <input
          id="billing-cpfcnpj"
          type="text"
          inputMode="numeric"
          value={cpfCnpj}
          onChange={(e) => onChangeCpfCnpj(e.target.value)}
          placeholder="Apenas números"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>
      <Field label="E-mail" id="billing-email">
        <input
          id="billing-email"
          type="email"
          value={email}
          onChange={(e) => onChangeEmail(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>
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
