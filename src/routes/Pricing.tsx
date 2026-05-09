import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '@/components/icons'
import type { ApiSubscription, Bundle } from '@/types'
import { getSubscription, listBundles } from '@/lib/api/billing-api'
import { useError } from '@/contexts/ErrorContext'
import CycleToggle, { type PricingCycle } from '@/components/billing/CycleToggle'
import PlanCard from '@/components/billing/PlanCard'
import Spinner from '@/components/ui/Spinner'

export default function Pricing() {
  const navigate = useNavigate()
  const { showError } = useError()

  const [bundles, setBundles] = useState<Bundle[]>([])
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null)
  const [cycle, setCycle] = useState<PricingCycle>('MONTHLY')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([listBundles(), getSubscription().catch(() => null)])
      .then(([bundleList, sub]) => {
        if (cancelled) return
        setBundles(bundleList)
        setSubscription(sub)
      })
      .catch(showError)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [showError])

  const sortedBundles = useMemo(
    () => [...bundles].sort((a, b) => a.priceMonthlyCents - b.priceMonthlyCents),
    [bundles],
  )

  const currentBundleId = useMemo(() => {
    if (!subscription) return null
    return null
  }, [subscription])

  function handleSelectBundle(bundle: Bundle, selectedCycle: PricingCycle) {
    navigate(`/checkout?bundle=${bundle.id}&cycle=${selectedCycle}`)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-8">
      <header className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 self-start text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeftIcon size={16} />
          Voltar
        </button>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Planos
          </h1>
          <p className="max-w-2xl text-sm text-gray-600">
            Escolha um plano com tudo o que você precisa. Você pode trocar
            ou cancelar quando quiser direto na aba Cobrança.
          </p>
        </div>

        <div className="mt-2">
          <CycleToggle value={cycle} onChange={setCycle} />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : sortedBundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Nenhum plano disponível
          </h3>
          <p className="mt-1 max-w-md text-sm text-gray-600">
            Os planos ainda não foram configurados. Entre em contato com o
            suporte se isso parecer um problema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {sortedBundles.map((bundle) => (
            <PlanCard
              key={bundle.id}
              bundle={bundle}
              cycle={cycle}
              current={currentBundleId === bundle.id}
              onSelect={handleSelectBundle}
            />
          ))}
        </div>
      )}
    </main>
  )
}
