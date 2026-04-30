import type { ActivePromotion } from '@/types'
import { daysBetween } from '@/lib/billing-format'

interface ActivePromotionsCardProps {
  promotions: ActivePromotion[]
}

function formatDuration(promotion: ActivePromotion): string {
  if (promotion.durationType === 'FOREVER') return 'Vitalício'
  if (promotion.durationType === 'ONCE') return 'Apenas na primeira cobrança'
  if (promotion.expiresAt) {
    const days = daysBetween(promotion.expiresAt)
    if (days <= 0) return 'Expirado'
    if (days === 1) return 'Expira amanhã'
    return `Expira em ${days} dias`
  }
  return 'Período definido'
}

function formatDiscount(promotion: ActivePromotion): string {
  if (promotion.discountType === 'PERCENTAGE') {
    return `${promotion.discountValue}% de desconto`
  }
  if (promotion.discountType === 'FIXED_AMOUNT') {
    return `R$ ${(promotion.discountValue / 100).toFixed(2)} de desconto`
  }
  if (promotion.discountType === 'FREE_MONTHS') {
    return `${promotion.discountValue} ${promotion.discountValue === 1 ? 'mês grátis' : 'meses grátis'}`
  }
  if (promotion.discountType === 'TRIAL_EXTENSION_DAYS') {
    return `+${promotion.discountValue} dias de teste`
  }
  return ''
}

export default function ActivePromotionsCard({
  promotions,
}: ActivePromotionsCardProps) {
  if (promotions.length === 0) return null

  return (
    <section>
      <header className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Promoções ativas
        </h3>
        <p className="text-sm text-gray-600">
          Descontos aplicados à sua assinatura.
        </p>
      </header>

      <div className="space-y-3">
        {promotions.map((promotion) => (
          <div
            key={promotion.id}
            className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-emerald-900">
                  {promotion.name}
                </h4>
                <code className="rounded bg-white/60 px-2 py-0.5 text-xs font-mono text-emerald-800">
                  {promotion.code}
                </code>
              </div>
              <p className="mt-1 text-sm text-emerald-800">
                {formatDiscount(promotion)}
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {formatDuration(promotion)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
