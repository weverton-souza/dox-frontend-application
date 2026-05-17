import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useError } from '@/contexts/ErrorContext'
import {
  getCustomerProfile,
  updateCustomerProfile,
  type CustomerProfile,
} from '@/lib/api/billing-api'
import BillingProfileForm, {
  EMPTY_BILLING_ADDRESS,
  isBillingAddressValid,
  isValidCpfCnpj,
  type BillingAddress,
} from '@/components/billing/BillingProfileForm'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { digitsOnly, formatCep, formatPhoneBr } from '@/lib/validators'

interface BillingAddressModalProps {
  open: boolean
  onClose: () => void
  onSaved: (profile: CustomerProfile) => void
}

export default function BillingAddressModal({ open, onClose, onSaved }: BillingAddressModalProps) {
  const { user } = useAuth()
  const { showError } = useError()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState<BillingAddress>(EMPTY_BILLING_ADDRESS)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    getCustomerProfile()
      .then((profile) => {
        if (cancelled) return
        setName(profile?.name ?? user?.name ?? '')
        setCpfCnpj(profile?.cpfCnpj ?? '')
        setEmail(profile?.email ?? user?.email ?? '')
        setAddress({
          mobilePhone: formatPhoneBr(profile?.mobilePhone ?? ''),
          postalCode: formatCep(profile?.postalCode ?? ''),
          street: profile?.address ?? '',
          number: profile?.addressNumber ?? '',
          complement: profile?.complement ?? '',
          neighborhood: profile?.province ?? '',
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, user])

  const invalid =
    !name.trim() ||
    !isValidCpfCnpj(cpfCnpj) ||
    !email.includes('@') ||
    !isBillingAddressValid(address)

  async function handleSubmit() {
    if (invalid || submitting) return
    setSubmitting(true)
    try {
      const updated = await updateCustomerProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        cpfCnpj: digitsOnly(cpfCnpj),
        mobilePhone: digitsOnly(address.mobilePhone),
        postalCode: digitsOnly(address.postalCode),
        address: address.street.trim(),
        addressNumber: address.number.trim(),
        complement: address.complement.trim() || undefined,
        province: address.neighborhood.trim(),
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      showError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Endereço de cobrança" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <BillingProfileForm
            name={name}
            cpfCnpj={cpfCnpj}
            email={email}
            address={address}
            onChangeName={setName}
            onChangeCpfCnpj={setCpfCnpj}
            onChangeEmail={setEmail}
            onChangeAddress={setAddress}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={invalid || submitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Salvando…' : 'Salvar endereço'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
