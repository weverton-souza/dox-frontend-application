import type { PriceBreakdown as PriceBreakdownData } from '@/types'

interface PriceBreakdownProps {
  data: PriceBreakdownData
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

const CYCLE_LABEL: Record<PriceBreakdownData['cycle'], string> = {
  MONTHLY: 'mensal',
  QUARTERLY: 'trimestral',
  SEMIANNUALLY: 'semestral',
  YEARLY: 'anual',
}

export default function PriceBreakdown({ data }: PriceBreakdownProps) {
  const hasBundleDiscount = data.bundleDiscountCents > 0

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-gray-700">Resumo</h3>

      <div className="flex flex-col gap-2">
        <Row label="Subtotal" value={formatPrice(data.basePriceCents)} />
        {hasBundleDiscount && (
          <Row
            label="Desconto do bundle"
            value={`-${formatPrice(data.bundleDiscountCents)}`}
            accent="success"
          />
        )}
      </div>

      <div className="border-t border-gray-200" />

      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700">
          Total {CYCLE_LABEL[data.cycle]}
        </span>
        <span className="text-2xl font-semibold tracking-tight text-gray-900">
          {formatPrice(data.finalPriceCents)}
        </span>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'success'
}) {
  const valueClass = accent === 'success' ? 'text-success font-medium' : 'text-gray-900'
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
