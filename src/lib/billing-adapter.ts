import type {
  AccessibleModule,
  ActiveModule,
  ActivePromotion,
  ApiNfseInvoice,
  ApiPayment,
  ApiSubscription,
  BillingCycle,
  Invoice,
  ModuleStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Subscription,
} from '@/types'

const ACCEPTED_BILLING_CYCLES: BillingCycle[] = ['MONTHLY', 'YEARLY']

const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  RECEIVED_IN_CASH: 'RECEIVED',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
  CANCELED: 'CANCELED',
  DELETED: 'CANCELED',
}

export function adaptSubscription(
  apiSub: ApiSubscription | null,
  accessibleModules: AccessibleModule[],
  fallback: {
    promotions: ActivePromotion[]
    paymentMethods: PaymentMethod[]
  },
): Subscription | null {
  if (!apiSub) return null

  const activeModules: ActiveModule[] = accessibleModules
    .filter((m) => m.accessLevel !== 'BLOCKED')
    .map((m) => ({
      id: m.module.id,
      name: m.module.displayName,
      status: (m.status ?? 'ACTIVE') as ModuleStatus,
      basePriceCents: m.module.basePriceMonthlyCents,
      finalPriceCents: m.module.basePriceMonthlyCents,
      priceLocked: true,
      activatedAt: apiSub.currentPeriodStart ?? new Date().toISOString(),
    }))

  return {
    id: apiSub.id,
    status: apiSub.status,
    bundleSlug: undefined,
    bundleName: undefined,
    billingCycle: ACCEPTED_BILLING_CYCLES.includes(apiSub.billingCycle as BillingCycle)
      ? (apiSub.billingCycle as BillingCycle)
      : 'MONTHLY',
    activeModules,
    activePromotions: fallback.promotions,
    defaultPaymentMethod: fallback.paymentMethods.find((p) => p.isDefault),
    paymentMethods: fallback.paymentMethods,
    currentValueCents: apiSub.valueCents,
    nextDueDate: apiSub.nextDueDate,
    trialEnd: apiSub.trialEnd,
    cancelEffectiveAt: apiSub.cancelEffectiveAt,
    createdAt: apiSub.currentPeriodStart ?? new Date().toISOString(),
  }
}

export function adaptPayment(p: ApiPayment): Payment {
  return {
    id: p.id,
    amountCents: p.amountCents,
    status: PAYMENT_STATUS_MAP[p.status] ?? 'PENDING',
    billingType: p.billingType === 'UNDEFINED' ? 'PIX' : p.billingType,
    dueDate: p.dueDate,
    paidAt: p.paidAt,
    invoiceUrl: p.invoiceUrl,
    bankSlipUrl: p.bankSlipUrl,
    pixQrCode: p.pixQrCode,
    description: p.description ?? '',
  }
}

export function adaptInvoice(i: ApiNfseInvoice, payment?: Payment): Invoice {
  return {
    id: i.id,
    paymentId: i.paymentId,
    status:
      i.status === 'AUTHORIZED' || i.status === 'ISSUED'
        ? 'ISSUED'
        : i.status === 'ERROR'
          ? 'ERROR'
          : i.status === 'CANCELED'
            ? 'CANCELED'
            : 'PENDING',
    amountCents: payment?.amountCents ?? 0,
    pdfUrl: i.pdfUrl,
    xmlUrl: i.xmlUrl,
    issuedAt: i.issuedAt,
  }
}
