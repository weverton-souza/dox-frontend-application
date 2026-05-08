import type { Addon } from '@/types'

interface AddonCardProps {
  addon: Addon
  onSelect: (addon: Addon) => void
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

function priceLabel(addon: Addon): { primary: string; secondary: string } {
  if (addon.type === 'PERCENTAGE_FEE' && addon.feePercentage !== null) {
    return {
      primary: `${Number(addon.feePercentage).toLocaleString('pt-BR')}%`,
      secondary: 'do GMV cobrado',
    }
  }
  if (addon.type === 'SLOT_QUOTA' && addon.priceUnitCents !== null) {
    return {
      primary: formatPrice(addon.priceUnitCents),
      secondary: 'por unidade/mês',
    }
  }
  if (addon.type === 'SEAT_QUOTA' && addon.priceUnitCents !== null) {
    return {
      primary: formatPrice(addon.priceUnitCents),
      secondary: 'por profissional/mês',
    }
  }
  return {
    primary: formatPrice(addon.priceMonthlyCents),
    secondary: '/mês',
  }
}

export default function AddonCard({ addon, onSelect }: AddonCardProps) {
  const { primary, secondary } = priceLabel(addon)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-card">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-gray-900">{addon.name}</h3>
        {addon.description && (
          <p className="text-sm text-gray-600">{addon.description}</p>
        )}
      </header>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-gray-900">
          {primary}
        </span>
        <span className="text-xs text-gray-500">{secondary}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {addon.availableForBundles.map((bundleId) => (
          <span
            key={bundleId}
            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
          >
            {bundleId}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSelect(addon)}
        className="mt-auto rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
      >
        Adicionar
      </button>
    </div>
  )
}
