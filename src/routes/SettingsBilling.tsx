import { useEffect, useState } from 'react'
import type { Invoice, Payment, Subscription } from '@/types'
import { getSubscription, listInvoices, listPayments } from '@/lib/api/billing-api'
import { adaptInvoice, adaptPayment, adaptSubscription } from '@/lib/billing-adapter'
import { useAccessibleModules } from '@/lib/hooks/use-modules'
import { MOCK_ACTIVE_PROMOTIONS, MOCK_PAYMENT_METHODS } from '@/lib/mock/billing-mock'
import { useError } from '@/contexts/ErrorContext'
import SubscriptionOverview from '@/components/billing/SubscriptionOverview'
import ActivePromotionsCard from '@/components/billing/ActivePromotionsCard'
import PaymentMethodSection from '@/components/billing/PaymentMethodSection'
import PaymentHistoryTable from '@/components/billing/PaymentHistoryTable'
import InvoiceTable from '@/components/billing/InvoiceTable'
import BillingActions from '@/components/billing/BillingActions'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'

export default function SettingsBilling() {
  const { showError } = useError()
  const { modules: accessibleModules } = useAccessibleModules()

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [comingSoonAction, setComingSoonAction] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getSubscription().catch(() => null),
      listPayments().catch(() => []),
      listInvoices().catch(() => []),
    ])
      .then(([apiSub, apiPayments, apiInvoices]) => {
        if (cancelled) return
        const adapted = adaptSubscription(apiSub, accessibleModules, {
          promotions: MOCK_ACTIVE_PROMOTIONS,
          paymentMethods: MOCK_PAYMENT_METHODS,
        })
        const mappedPayments = apiPayments.map(adaptPayment)
        const paymentById = new Map(mappedPayments.map((p) => [p.id, p]))
        setSubscription(adapted)
        setPayments(mappedPayments)
        setInvoices(apiInvoices.map((i) => adaptInvoice(i, paymentById.get(i.paymentId))))
      })
      .catch(showError)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessibleModules, showError])

  return (
    <div>
      <header className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">Cobrança</h2>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie sua assinatura, módulos ativos e histórico de pagamentos.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : !subscription ? (
        <EmptyState onChoosePlan={() => setComingSoonAction('Escolher plano')} />
      ) : (
        <div className="mt-8 space-y-10">
          <SubscriptionOverview subscription={subscription} />

          <ActivePromotionsCard promotions={subscription.activePromotions} />

          <PaymentMethodSection
            methods={subscription.paymentMethods}
            onChangeRequest={() => setComingSoonAction('Trocar método de pagamento')}
          />

          <PaymentHistoryTable payments={payments} />

          <InvoiceTable invoices={invoices} />

          <BillingActions
            onChangePlan={() => setComingSoonAction('Trocar de plano')}
            onAddModule={() => setComingSoonAction('Adicionar módulo')}
            onCancel={() => setComingSoonAction('Cancelar assinatura')}
          />
        </div>
      )}

      {comingSoonAction && (
        <Modal
          isOpen={true}
          onClose={() => setComingSoonAction(null)}
          title={comingSoonAction}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Esta ação ainda não está disponível. Estamos trabalhando para
              liberá-la em breve.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setComingSoonAction(null)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Entendi
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

interface EmptyStateProps {
  onChoosePlan: () => void
}

function EmptyState({ onChoosePlan }: EmptyStateProps) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Sem assinatura ativa</h3>
      <p className="mt-1 max-w-md text-sm text-gray-600">
        Você ainda não escolheu um plano. Selecione um pacote ou módulos avulsos
        pra começar a usar o DOX no plano que faz mais sentido pra você.
      </p>
      <button
        type="button"
        onClick={onChoosePlan}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
      >
        Escolher plano
      </button>
    </div>
  )
}
