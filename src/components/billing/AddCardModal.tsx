import { useEffect, useState } from 'react'
import { useError } from '@/contexts/ErrorContext'
import { getCustomerProfile, tokenizeCreditCard, type CustomerProfile } from '@/lib/api/billing-api'
import { digitsOnly } from '@/lib/validators'
import CreditCardForm, {
  EMPTY_CREDIT_CARD,
  isCreditCardFormValid,
  type CreditCardFormState,
} from '@/components/billing/CreditCardForm'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

interface AddCardModalProps {
  open: boolean
  onClose: () => void
  onAdded: () => void
}

export default function AddCardModal({ open, onClose, onAdded }: AddCardModalProps) {
  const { showError } = useError()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [card, setCard] = useState<CreditCardFormState>(EMPTY_CREDIT_CARD)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setCard(EMPTY_CREDIT_CARD)
    getCustomerProfile()
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const cardFormInvalid = !isCreditCardFormValid(card)

  async function handleSubmit() {
    if (!profile || cardFormInvalid || submitting) return
    setSubmitting(true)
    try {
      await tokenizeCreditCard({
        cardHolderName: card.holderName.trim(),
        cardNumber: digitsOnly(card.number),
        cardExpiryMonth: card.expiryMonth.padStart(2, '0'),
        cardExpiryYear: card.expiryYear,
        cardCcv: digitsOnly(card.ccv),
        billingName: profile.name,
        billingEmail: profile.email ?? '',
        billingCpfCnpj: digitsOnly(profile.cpfCnpj),
        billingPostalCode: digitsOnly(profile.postalCode ?? ''),
        billingAddressNumber: profile.addressNumber ?? '',
        billingAddressComplement: profile.complement ?? undefined,
        billingMobilePhone: digitsOnly(profile.mobilePhone ?? ''),
        makeDefault: card.makeDefault,
      })
      onAdded()
      onClose()
    } catch (err) {
      showError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Adicionar cartão" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {profile && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              Cobrança em <span className="font-medium text-gray-900">{profile.name}</span>
              {profile.address && (
                <>
                  {' · '}
                  {profile.address}, {profile.addressNumber}
                </>
              )}
            </div>
          )}

          <CreditCardForm value={card} onChange={setCard} />

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
              disabled={cardFormInvalid || submitting || !profile}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Salvando…' : 'Salvar cartão'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
