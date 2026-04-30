// ========== Billing Types ==========

export type SubscriptionStatus =
  | 'TRIAL'
  | 'TRIAL_GRACE'
  | 'ACTIVE'
  | 'GRACE'
  | 'SUSPENDED'
  | 'CANCEL_PENDING'
  | 'CANCELED'

export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD'
export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type ModuleId =
  | 'reports'
  | 'customers'
  | 'forms'
  | 'calendar'
  | 'ai_light'
  | 'ai_pro'
  | 'payments'
  | 'financial'
  | 'files_ocr'

export type ModuleStatus = 'TRIAL' | 'ACTIVE' | 'GRACE' | 'SUSPENDED' | 'CANCELED' | 'GRANTED'

export interface ActiveModule {
  id: ModuleId
  name: string
  status: ModuleStatus
  basePriceCents: number
  finalPriceCents: number
  priceLocked: boolean
  activatedAt: string
  graceUntil?: string
}

export type PromotionType =
  | 'COUPON'
  | 'BUNDLE'
  | 'GRANT'
  | 'REFERRAL'
  | 'LOYALTY'
  | 'WINBACK'
  | 'CAMPAIGN'
  | 'PARTNER'
  | 'TRIAL_EXTENSION'
  | 'VOLUME_DISCOUNT'
  | 'CROSS_SELL'
  | 'ANNIVERSARY'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_MONTHS' | 'TRIAL_EXTENSION_DAYS'
export type DurationType = 'ONCE' | 'FOREVER' | 'FIXED_MONTHS'

export interface ActivePromotion {
  id: string
  code: string
  name: string
  type: PromotionType
  discountType: DiscountType
  discountValue: number
  durationType: DurationType
  appliedAt: string
  expiresAt?: string
}

export interface PaymentMethod {
  id: string
  type: BillingType
  brand?: string
  last4?: string
  holderName?: string
  isDefault: boolean
  expiresAt?: string
}

export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'CANCELED'

export interface Payment {
  id: string
  amountCents: number
  status: PaymentStatus
  billingType: BillingType
  dueDate: string
  paidAt?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCode?: string
  description: string
}

export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'CANCELED' | 'ERROR'

export interface Invoice {
  id: string
  paymentId: string
  status: InvoiceStatus
  amountCents: number
  pdfUrl?: string
  xmlUrl?: string
  issuedAt?: string
}

export interface Subscription {
  id: string
  status: SubscriptionStatus
  bundleSlug?: string
  bundleName?: string
  billingCycle: BillingCycle
  activeModules: ActiveModule[]
  activePromotions: ActivePromotion[]
  defaultPaymentMethod?: PaymentMethod
  paymentMethods: PaymentMethod[]
  currentValueCents: number
  nextDueDate?: string
  trialEnd?: string
  graceUntil?: string
  cancelEffectiveAt?: string
  createdAt: string
}
