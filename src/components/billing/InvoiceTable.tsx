import type { Invoice } from '@/types'
import { formatCurrency } from '@/lib/billing-format'
import { formatDate } from '@/lib/utils'

interface InvoiceTableProps {
  invoices: Invoice[]
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  return (
    <section>
      <header className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Notas fiscais</h3>
        <p className="text-sm text-gray-600">
          NFS-e emitidas para cada cobrança paga.
        </p>
      </header>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Nenhuma nota fiscal emitida ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Emissão</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {invoice.issuedAt ? formatDate(invoice.issuedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(invoice.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-4">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          PDF
                        </a>
                      )}
                      {invoice.xmlUrl && (
                        <a
                          href={invoice.xmlUrl}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          XML
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
