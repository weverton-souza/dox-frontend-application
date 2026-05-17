import type { CustomerProfile } from '@/lib/api/billing-api'
import { formatCep, formatPhoneBr } from '@/lib/validators'
import { isCustomerProfileComplete } from '@/lib/customer-profile'

interface BillingAddressCardProps {
  profile: CustomerProfile | null
  onEdit: () => void
}

export default function BillingAddressCard({ profile, onEdit }: BillingAddressCardProps) {
  const filled = isCustomerProfileComplete(profile)

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Endereço de cobrança</h3>
          <p className="text-sm text-gray-600">
            Usado para cobranças, notas fiscais e validação do cartão.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {filled ? 'Editar' : 'Cadastrar'}
        </button>
      </header>

      {filled && profile ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">
            {profile.address}, {profile.addressNumber}
            {profile.complement ? ` · ${profile.complement}` : ''}
          </p>
          <p className="text-gray-600">
            {profile.province} · CEP {formatCep(profile.postalCode ?? '')}
          </p>
          <p className="mt-1 text-gray-500">{formatPhoneBr(profile.mobilePhone ?? '')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Cadastre o endereço de cobrança para adicionar cartões e emitir notas fiscais.
        </div>
      )}
    </section>
  )
}
