import type { Subscription } from '@/types'
import {
  formatCurrency,
  formatPaymentMethod,
  formatSubscriptionStatus,
  daysBetween,
} from '@/lib/billing-format'
import StatusBadge from './StatusBadge'

interface SubscriptionOverviewProps {
  subscription: Subscription
}

export default function SubscriptionOverview({
  subscription,
}: SubscriptionOverviewProps) {
  const status = formatSubscriptionStatus(subscription.status)
  const daysUntilCharge = subscription.nextDueDate
    ? daysBetween(subscription.nextDueDate)
    : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Plano atual
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {subscription.bundleName ?? 'Assinatura DOX'}
            </h2>
            <StatusBadge label={status.label} variant={status.variant} />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {subscription.billingCycle === 'MONTHLY' ? 'Cobrança mensal' : 'Cobrança anual'}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Valor da assinatura
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(subscription.currentValueCents)}
            <span className="text-sm font-normal text-gray-500">
              /{subscription.billingCycle === 'MONTHLY' ? 'mês' : 'ano'}
            </span>
          </p>
        </div>
      </div>

      {subscription.nextDueDate && daysUntilCharge !== null && (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-gray-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Próxima cobrança
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {daysUntilCharge > 0
                ? `em ${daysUntilCharge} ${daysUntilCharge === 1 ? 'dia' : 'dias'}`
                : daysUntilCharge === 0
                  ? 'hoje'
                  : `há ${Math.abs(daysUntilCharge)} ${Math.abs(daysUntilCharge) === 1 ? 'dia' : 'dias'}`}
              {subscription.defaultPaymentMethod && (
                <> · via {formatPaymentMethod(subscription.defaultPaymentMethod)}</>
              )}
            </p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(subscription.currentValueCents)}
          </p>
        </div>
      )}
    </div>
  )
}
