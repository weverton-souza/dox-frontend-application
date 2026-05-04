import type { Payment } from '@/types'
import {
  formatBillingType,
  formatCurrency,
  formatPaymentStatus,
} from '@/lib/billing-format'
import { formatDate } from '@/lib/utils'
import StatusBadge from './StatusBadge'

interface PaymentHistoryTableProps {
  payments: Payment[]
}

export default function PaymentHistoryTable({
  payments,
}: PaymentHistoryTableProps) {
  return (
    <section>
      <header className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Histórico de cobranças
        </h3>
        <p className="text-sm text-gray-600">
          Todas as faturas geradas para esta conta.
        </p>
      </header>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Nenhuma cobrança registrada.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Vencimento
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Descrição</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Método</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Valor</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => {
                const status = formatPaymentStatus(payment.status)
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(payment.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {payment.description}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatBillingType(payment.billingType)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(payment.amountCents)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={status.label}
                        variant={status.variant}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
