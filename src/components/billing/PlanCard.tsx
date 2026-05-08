import { CheckIcon } from '@/components/icons'
import type { Bundle } from '@/types'
import type { PricingCycle } from './CycleToggle'

interface PlanCardProps {
  bundle: Bundle
  cycle: PricingCycle
  current: boolean
  onSelect: (bundle: Bundle, cycle: PricingCycle) => void
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

export default function PlanCard({ bundle, cycle, current, onSelect }: PlanCardProps) {
  const monthlyForDisplay =
    cycle === 'YEARLY' ? Math.round(bundle.priceYearlyCents / 12) : bundle.priceMonthlyCents
  const yearlyTotalLabel =
    cycle === 'YEARLY' ? `${formatPrice(bundle.priceYearlyCents)} cobrados anualmente` : null

  return (
    <div
      className={`relative flex flex-col gap-5 rounded-2xl border bg-white p-6 transition-shadow ${
        bundle.highlighted
          ? 'border-brand-500 shadow-card ring-1 ring-brand-500/10'
          : 'border-gray-200 shadow-xs hover:shadow-card'
      }`}
    >
      {bundle.highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
          Mais escolhido
        </span>
      )}

      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900">{bundle.name}</h3>
        <p className="text-sm text-gray-600">
          {bundle.modules.length} {bundle.modules.length === 1 ? 'módulo incluso' : 'módulos inclusos'}
        </p>
      </header>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-gray-900">
            {formatPrice(monthlyForDisplay)}
          </span>
          <span className="text-sm text-gray-500">/mês</span>
        </div>
        {yearlyTotalLabel && (
          <span className="text-xs text-gray-500">{yearlyTotalLabel}</span>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {bundle.modules.map((mod) => (
          <li key={mod.id} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckIcon size={16} className="mt-0.5 shrink-0 text-success" />
            <span>{mod.displayName}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(bundle, cycle)}
        disabled={current}
        className={`mt-auto rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          bundle.highlighted
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
        }`}
      >
        {current ? 'Plano atual' : 'Escolher'}
      </button>
    </div>
  )
}
