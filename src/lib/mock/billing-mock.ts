import type {
  ActiveModule,
  ActivePromotion,
  Invoice,
  Payment,
  PaymentMethod,
  Subscription,
} from '@/types'

/**
 * Mock data para a tela de Assinatura.
 * Trocar por chamada real à API quando o backend de billing estiver pronto.
 *
 * Para testar diferentes estados, alterar `MOCK_SUBSCRIPTION.status`:
 *   - 'ACTIVE'         → estado padrão (cliente pago, tudo ok)
 *   - 'TRIAL'          → trial 14 dias em andamento
 *   - 'GRACE'          → pagamento atrasou (último cobrança falhou)
 *   - 'CANCEL_PENDING' → cancelamento agendado, ainda com acesso
 */

const NOW = new Date()
const isoFromNow = (days: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_001',
    type: 'CREDIT_CARD',
    brand: 'Visa',
    last4: '4242',
    holderName: 'WEVER DOS SANTOS',
    isDefault: true,
    expiresAt: '2028-12-01T00:00:00.000Z',
  },
]

const MOCK_ACTIVE_MODULES: ActiveModule[] = [
  {
    id: 'reports',
    name: 'Relatórios',
    status: 'ACTIVE',
    basePriceCents: 9900,
    finalPriceCents: 9900,
    priceLocked: true,
    activatedAt: isoFromNow(-92),
  },
  {
    id: 'customers',
    name: 'Pacientes',
    status: 'ACTIVE',
    basePriceCents: 5900,
    finalPriceCents: 5900,
    priceLocked: true,
    activatedAt: isoFromNow(-92),
  },
  {
    id: 'forms',
    name: 'Formulários',
    status: 'ACTIVE',
    basePriceCents: 5900,
    finalPriceCents: 5900,
    priceLocked: true,
    activatedAt: isoFromNow(-92),
  },
  {
    id: 'calendar',
    name: 'Calendário',
    status: 'ACTIVE',
    basePriceCents: 3900,
    finalPriceCents: 3900,
    priceLocked: true,
    activatedAt: isoFromNow(-92),
  },
  {
    id: 'ai_light',
    name: 'DOX IA',
    status: 'ACTIVE',
    basePriceCents: 9900,
    finalPriceCents: 9900,
    priceLocked: true,
    activatedAt: isoFromNow(-92),
  },
]

const MOCK_ACTIVE_PROMOTIONS: ActivePromotion[] = [
  {
    id: 'tp_001',
    code: 'FOUNDING100',
    name: 'Founding Member',
    type: 'COUPON',
    discountType: 'PERCENTAGE',
    discountValue: 30,
    durationType: 'FOREVER',
    appliedAt: isoFromNow(-92),
  },
]

const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay_006',
    amountCents: 20930,
    status: 'PENDING',
    billingType: 'CREDIT_CARD',
    dueDate: isoFromNow(8),
    description: 'Profissional + DOX IA · 30% off Founding',
  },
  {
    id: 'pay_005',
    amountCents: 20930,
    status: 'CONFIRMED',
    billingType: 'CREDIT_CARD',
    dueDate: isoFromNow(-22),
    paidAt: isoFromNow(-22),
    description: 'Profissional + DOX IA · 30% off Founding',
  },
  {
    id: 'pay_004',
    amountCents: 20930,
    status: 'CONFIRMED',
    billingType: 'CREDIT_CARD',
    dueDate: isoFromNow(-52),
    paidAt: isoFromNow(-52),
    description: 'Profissional + DOX IA · 30% off Founding',
  },
  {
    id: 'pay_003',
    amountCents: 20930,
    status: 'CONFIRMED',
    billingType: 'CREDIT_CARD',
    dueDate: isoFromNow(-82),
    paidAt: isoFromNow(-82),
    description: 'Profissional + DOX IA · 30% off Founding',
  },
]

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_005',
    paymentId: 'pay_005',
    status: 'ISSUED',
    amountCents: 20930,
    pdfUrl: '#',
    xmlUrl: '#',
    issuedAt: isoFromNow(-22),
  },
  {
    id: 'inv_004',
    paymentId: 'pay_004',
    status: 'ISSUED',
    amountCents: 20930,
    pdfUrl: '#',
    xmlUrl: '#',
    issuedAt: isoFromNow(-52),
  },
  {
    id: 'inv_003',
    paymentId: 'pay_003',
    status: 'ISSUED',
    amountCents: 20930,
    pdfUrl: '#',
    xmlUrl: '#',
    issuedAt: isoFromNow(-82),
  },
]

export const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub_001',
  status: 'ACTIVE',
  bundleSlug: 'profissional',
  bundleName: 'Profissional',
  billingCycle: 'MONTHLY',
  activeModules: MOCK_ACTIVE_MODULES,
  activePromotions: MOCK_ACTIVE_PROMOTIONS,
  defaultPaymentMethod: MOCK_PAYMENT_METHODS[0],
  paymentMethods: MOCK_PAYMENT_METHODS,
  currentValueCents: 20930,
  nextDueDate: isoFromNow(8),
  createdAt: isoFromNow(-92),
}

export const MOCK_PAYMENTS_HISTORY = MOCK_PAYMENTS
export const MOCK_INVOICES_LIST = MOCK_INVOICES
