import type {
  BillingType,
  PaymentStatus,
  SubscriptionStatus,
} from '@/types'

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatBillingType(type: BillingType): string {
  const labels: Record<BillingType, string> = {
    PIX: 'PIX',
    BOLETO: 'Boleto',
    CREDIT_CARD: 'Cartão',
  }
  return labels[type]
}

export function formatPaymentStatus(status: PaymentStatus): {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'neutral'
} {
  const map: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    PENDING: { label: 'Pendente', variant: 'warning' },
    RECEIVED: { label: 'Recebido', variant: 'success' },
    CONFIRMED: { label: 'Pago', variant: 'success' },
    OVERDUE: { label: 'Atrasado', variant: 'danger' },
    REFUNDED: { label: 'Estornado', variant: 'neutral' },
    CANCELED: { label: 'Cancelado', variant: 'neutral' },
  }
  return map[status]
}

export function formatSubscriptionStatus(status: SubscriptionStatus): {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
} {
  const map: Record<SubscriptionStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
    TRIAL: { label: 'Período de teste', variant: 'info' },
    TRIAL_GRACE: { label: 'Trial expirado', variant: 'warning' },
    ACTIVE: { label: 'Ativa', variant: 'success' },
    GRACE: { label: 'Pagamento atrasado', variant: 'warning' },
    SUSPENDED: { label: 'Suspensa', variant: 'danger' },
    CANCEL_PENDING: { label: 'Cancelamento agendado', variant: 'warning' },
    CANCELED: { label: 'Cancelada', variant: 'neutral' },
  }
  return map[status]
}

export function formatPaymentMethod(method: {
  type: BillingType
  brand?: string
  last4?: string
}): string {
  if (method.type === 'CREDIT_CARD' && method.brand && method.last4) {
    return `${method.brand} •••• ${method.last4}`
  }
  return formatBillingType(method.type)
}

export function daysBetween(isoDate: string, reference: Date = new Date()): number {
  const d = new Date(isoDate)
  const diffMs = d.getTime() - reference.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
