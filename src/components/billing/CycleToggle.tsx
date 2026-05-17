export type PricingCycle = 'MONTHLY' | 'YEARLY'

interface CycleToggleProps {
  value: PricingCycle
  onChange: (cycle: PricingCycle) => void
  yearlyDiscountPct?: number
}

export default function CycleToggle({
  value,
  onChange,
  yearlyDiscountPct = 20,
}: CycleToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-xs">
      <button
        type="button"
        onClick={() => onChange('MONTHLY')}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          value === 'MONTHLY'
            ? 'bg-brand-500 text-white'
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => onChange('YEARLY')}
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          value === 'YEARLY'
            ? 'bg-brand-500 text-white'
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        Anual
        <span
          className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
            value === 'YEARLY' ? 'bg-white/20 text-white' : 'bg-success/15 text-success'
          }`}
        >
          -{yearlyDiscountPct}%
        </span>
      </button>
    </div>
  )
}
