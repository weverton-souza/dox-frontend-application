import { useState } from 'react'
import {
  MOCK_INVOICES_LIST,
  MOCK_PAYMENTS_HISTORY,
  MOCK_SUBSCRIPTION,
} from '@/lib/mock/billing-mock'
import SubscriptionOverview from '@/components/billing/SubscriptionOverview'
import ActivePromotionsCard from '@/components/billing/ActivePromotionsCard'
import PaymentMethodSection from '@/components/billing/PaymentMethodSection'
import PaymentHistoryTable from '@/components/billing/PaymentHistoryTable'
import InvoiceTable from '@/components/billing/InvoiceTable'
import BillingActions from '@/components/billing/BillingActions'
import Modal from '@/components/ui/Modal'

export default function SettingsBilling() {
  const subscription = MOCK_SUBSCRIPTION
  const payments = MOCK_PAYMENTS_HISTORY
  const invoices = MOCK_INVOICES_LIST

  const [comingSoonAction, setComingSoonAction] = useState<string | null>(null)

  return (
    <div>
      <header className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">Cobrança</h2>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie sua assinatura, módulos ativos e histórico de pagamentos.
        </p>
      </header>

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
