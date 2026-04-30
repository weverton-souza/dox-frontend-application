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
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Plano atual
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {subscription.bundleName ?? 'Módulos avulsos'}
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

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Módulos ativos ({subscription.activeModules.length})
          </p>
          <ul className="space-y-2">
            {subscription.activeModules.map((module) => (
              <li
                key={module.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-gray-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {module.name}
                </span>
                <span className="text-gray-500">
                  {module.finalPriceCents > 0
                    ? formatCurrency(module.finalPriceCents)
                    : 'Grátis'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Próxima cobrança
          </p>
          {subscription.nextDueDate && daysUntilCharge !== null ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(subscription.currentValueCents)}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {daysUntilCharge > 0
                  ? `em ${daysUntilCharge} ${daysUntilCharge === 1 ? 'dia' : 'dias'}`
                  : daysUntilCharge === 0
                    ? 'hoje'
                    : `há ${Math.abs(daysUntilCharge)} ${Math.abs(daysUntilCharge) === 1 ? 'dia' : 'dias'}`}
              </p>
              {subscription.defaultPaymentMethod && (
                <p className="mt-2 text-sm text-gray-500">
                  Via {formatPaymentMethod(subscription.defaultPaymentMethod)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma cobrança agendada</p>
          )}
        </div>
      </div>
    </div>
  )
}
