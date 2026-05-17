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
  getCustomerProfile,
  getSubscription,
  listActivePromotions,
  pricePreview,
  revokePromotion,
  subscribeBundle,
  subscribeModules,
  tokenizeCreditCard,
  type CustomerProfile,
} from '@/lib/api/billing-api'
import { useAuth } from '@/contexts/AuthContext'
import { useError } from '@/contexts/ErrorContext'
import BillingAddressModal from '@/components/billing/BillingAddressModal'
import BillingProfileForm, {
  EMPTY_BILLING_ADDRESS,
  isBillingAddressValid,
  isValidCpfCnpj,
  type BillingAddress,
} from '@/components/billing/BillingProfileForm'
import { digitsOnly, formatCep, formatPhoneBr } from '@/lib/validators'
import { isCustomerProfileComplete } from '@/lib/customer-profile'
import CouponInput from '@/components/billing/CouponInput'
import CreditCardForm, {
  EMPTY_CREDIT_CARD,
  isCreditCardFormValid,
  type CreditCardFormState,
} from '@/components/billing/CreditCardForm'
import PaymentMethodPicker from '@/components/billing/PaymentMethodPicker'
import PriceBreakdown from '@/components/billing/PriceBreakdown'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'

type PaymentMethod = 'PIX' | 'CREDIT_CARD'
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
  const [method, setMethod] = useState<PaymentMethod>(
    cycle === 'MONTHLY' ? 'CREDIT_CARD' : 'PIX',
  )
  const [billingName, setBillingName] = useState('')
  const [billingCpfCnpj, setBillingCpfCnpj] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [address, setAddress] = useState<BillingAddress>(EMPTY_BILLING_ADDRESS)
  const [card, setCard] = useState<CreditCardFormState>(EMPTY_CREDIT_CARD)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [comingSoonAction, setComingSoonAction] = useState<string | null>(null)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  const hasProfile = isCustomerProfileComplete(profile)

  function applyProfileToForm(p: CustomerProfile) {
    setBillingName(p.name)
    if (p.email) setBillingEmail(p.email)
    setBillingCpfCnpj(p.cpfCnpj)
    setAddress({
      mobilePhone: formatPhoneBr(p.mobilePhone ?? ''),
      postalCode: formatCep(p.postalCode ?? ''),
      street: p.address ?? '',
      number: p.addressNumber ?? '',
      complement: p.complement ?? '',
      neighborhood: p.province ?? '',
    })
  }

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
      getCustomerProfile().catch(() => null),
    ])
      .then(async ([bundleData, addonData, sub, promos, profileData]) => {
        if (cancelled) return
        setBundle(bundleData)
        setAddon(addonData)
        setSubscription(sub)
        setAppliedPromo(promos[0] ?? null)
        setProfile(profileData)
        if (isCustomerProfileComplete(profileData)) {
          applyProfileToForm(profileData as CustomerProfile)
        }

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

  const billingProfileInvalid =
    !billingName.trim() ||
    !isValidCpfCnpj(billingCpfCnpj) ||
    !billingEmail.includes('@') ||
    !isBillingAddressValid(address)
  const cardFormInvalid = method === 'CREDIT_CARD' && !isCreditCardFormValid(card)
  const formInvalid = billingProfileInvalid || cardFormInvalid

  async function handleConfirm() {
    if (formInvalid || submitting) return

    setSubmitting(true)
    try {
      let creditCardToken: string | undefined
      if (method === 'CREDIT_CARD') {
        const tokenized = await tokenizeCreditCard({
          cardHolderName: card.holderName.trim(),
          cardNumber: digitsOnly(card.number),
          cardExpiryMonth: card.expiryMonth.padStart(2, '0'),
          cardExpiryYear: card.expiryYear,
          cardCcv: digitsOnly(card.ccv),
          billingName: billingName.trim(),
          billingEmail: billingEmail.trim(),
          billingCpfCnpj: digitsOnly(billingCpfCnpj),
          billingPostalCode: digitsOnly(address.postalCode),
          billingAddressNumber: address.number.trim(),
          billingAddressComplement: address.complement.trim() || undefined,
          billingMobilePhone: digitsOnly(address.mobilePhone),
          makeDefault: card.makeDefault,
        })
        creditCardToken = tokenized.token
      }

      const customerPayload = {
        customerName: billingName.trim(),
        customerCpfCnpj: digitsOnly(billingCpfCnpj),
        customerEmail: billingEmail.trim(),
        customerMobilePhone: digitsOnly(address.mobilePhone),
        customerPostalCode: digitsOnly(address.postalCode),
        customerAddress: address.street.trim(),
        customerAddressNumber: address.number.trim(),
        customerAddressComplement: address.complement.trim() || undefined,
        customerProvince: address.neighborhood.trim(),
      }

      if (bundle) {
        await subscribeBundle({
          bundleId: bundle.id,
          cycle,
          billingType: method,
          ...customerPayload,
          creditCardToken,
        })
      } else if (addon?.targetModuleId) {
        await subscribeModules({
          moduleIds: [addon.targetModuleId as ModuleId],
          cycle: 'MONTHLY',
          billingType: method,
          ...customerPayload,
          creditCardToken,
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

          {hasProfile ? (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cobrança em
                </p>
                <p className="mt-1 font-medium text-gray-900">{billingName}</p>
                <p className="text-gray-600">
                  {address.street}, {address.number}
                  {address.complement ? ` · ${address.complement}` : ''}
                </p>
                <p className="text-gray-600">
                  {address.neighborhood} · CEP {address.postalCode}
                </p>
                <p className="mt-1 text-gray-500">{address.mobilePhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddressModalOpen(true)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Editar
              </button>
            </div>
          ) : (
            <BillingProfileForm
              name={billingName}
              cpfCnpj={billingCpfCnpj}
              email={billingEmail}
              address={address}
              onChangeName={setBillingName}
              onChangeCpfCnpj={setBillingCpfCnpj}
              onChangeEmail={setBillingEmail}
              onChangeAddress={setAddress}
            />
          )}

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

          <PaymentMethodPicker value={method} onChange={setMethod} cycle={cycle} />
          {method === 'CREDIT_CARD' && <CreditCardForm value={card} onChange={setCard} />}
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
            disabled={submitting || formInvalid}
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

      <BillingAddressModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSaved={(updated) => {
          setProfile(updated)
          applyProfileToForm(updated)
        }}
      />

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

