import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '@/components/icons'
import type { Addon, ApiSubscription, Bundle } from '@/types'
import { getSubscription, listAddons, listBundles } from '@/lib/api/billing-api'
import { useError } from '@/contexts/ErrorContext'
import CycleToggle, { type PricingCycle } from '@/components/billing/CycleToggle'
import PlanCard from '@/components/billing/PlanCard'
import AddonCard from '@/components/billing/AddonCard'
import Spinner from '@/components/ui/Spinner'

type Tab = 'BUNDLES' | 'ADDONS'

export default function Pricing() {
  const navigate = useNavigate()
  const { showError } = useError()

  const [bundles, setBundles] = useState<Bundle[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null)
  const [cycle, setCycle] = useState<PricingCycle>('MONTHLY')
  const [tab, setTab] = useState<Tab>('BUNDLES')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      listBundles(),
      listAddons().catch(() => [] as Addon[]),
      getSubscription().catch(() => null),
    ])
      .then(([bundleList, addonList, sub]) => {
        if (cancelled) return
        setBundles(bundleList)
        setAddons(addonList)
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

  const sortedAddons = useMemo(
    () => [...addons].sort((a, b) => a.sortOrder - b.sortOrder),
    [addons],
  )

  const currentBundleId = useMemo(() => {
    if (!subscription) return null
    return null
  }, [subscription])

  function handleSelectBundle(bundle: Bundle, selectedCycle: PricingCycle) {
    navigate(`/checkout?bundle=${bundle.id}&cycle=${selectedCycle}`)
  }

  function handleSelectAddon(addon: Addon) {
    navigate(`/checkout?addon=${addon.id}`)
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
            Escolha um plano completo ou monte do zero adicionando módulos
            avulsos. Você pode trocar ou cancelar quando quiser direto na aba
            Cobrança.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onChange={setTab} />
          {tab === 'BUNDLES' && <CycleToggle value={cycle} onChange={setCycle} />}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : tab === 'BUNDLES' ? (
        <BundlesGrid
          bundles={sortedBundles}
          cycle={cycle}
          currentBundleId={currentBundleId}
          onSelect={handleSelectBundle}
        />
      ) : (
        <AddonsGrid addons={sortedAddons} onSelect={handleSelectAddon} />
      )}
    </main>
  )
}

interface TabsProps {
  value: Tab
  onChange: (tab: Tab) => void
}

function Tabs({ value, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-xs">
      <TabButton active={value === 'BUNDLES'} onClick={() => onChange('BUNDLES')}>
        Bundles
      </TabButton>
      <TabButton active={value === 'ADDONS'} onClick={() => onChange('ADDONS')}>
        À la carte
      </TabButton>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-500 text-white' : 'text-gray-700 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

interface BundlesGridProps {
  bundles: Bundle[]
  cycle: PricingCycle
  currentBundleId: string | null
  onSelect: (bundle: Bundle, cycle: PricingCycle) => void
}

function BundlesGrid({ bundles, cycle, currentBundleId, onSelect }: BundlesGridProps) {
  if (bundles.length === 0) {
    return (
      <EmptyState
        title="Nenhum plano disponível"
        description="Os bundles ainda não foram configurados. Entre em contato com o suporte se isso parecer um problema."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {bundles.map((bundle) => (
        <PlanCard
          key={bundle.id}
          bundle={bundle}
          cycle={cycle}
          current={currentBundleId === bundle.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface AddonsGridProps {
  addons: Addon[]
  onSelect: (addon: Addon) => void
}

function AddonsGrid({ addons, onSelect }: AddonsGridProps) {
  if (addons.length === 0) {
    return (
      <EmptyState
        title="Sem add-ons disponíveis"
        description="Os add-ons à la carte ainda não foram configurados pra essa instância."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {addons.map((addon) => (
        <AddonCard key={addon.id} addon={addon} onSelect={onSelect} />
      ))}
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-gray-600">{description}</p>
    </div>
  )
}
