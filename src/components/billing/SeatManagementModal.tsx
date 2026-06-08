import { useEffect, useState } from 'react'
import type { Addon } from '@/types'
import { addAddon, getAddon, removeAddon } from '@/lib/api/billing-api'
import { useError } from '@/contexts/ErrorContext'
import Modal from '@/components/ui/Modal'

const EXTRA_SEAT_ADDON_ID = 'extra_seat'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

interface SeatManagementModalProps {
  open: boolean
  onClose: () => void
  onChanged: () => void
}

export default function SeatManagementModal({ open, onClose, onChanged }: SeatManagementModalProps) {
  const { showError } = useError()
  const [addon, setAddon] = useState<Addon | null>(null)
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode('add')
    setQuantity(1)
    getAddon(EXTRA_SEAT_ADDON_ID)
      .then(setAddon)
      .catch(() => setAddon(null))
  }, [open])

  const unitCents = addon?.priceUnitCents ?? 0
  const totalLabel = currencyFormatter.format((unitCents * quantity) / 100)

  async function handleConfirm() {
    setSubmitting(true)
    try {
      if (mode === 'add') {
        await addAddon(EXTRA_SEAT_ADDON_ID, quantity)
      } else {
        await removeAddon(EXTRA_SEAT_ADDON_ID, quantity)
      }
      onChanged()
      onClose()
    } catch (err) {
      showError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'bg-brand-500 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
    }`

  return (
    <Modal isOpen={open} onClose={onClose} title="Profissionais adicionais" size="sm">
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Cada profissional adicional custa{' '}
          <span className="font-medium text-gray-900">{currencyFormatter.format(unitCents / 100)}</span> por mês,
          cobrado no cartão da assinatura. Disponível apenas no plano Clínica.
        </p>

        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('add')} className={tabClass(mode === 'add')}>
            Adicionar
          </button>
          <button type="button" onClick={() => setMode('remove')} className={tabClass(mode === 'remove')}>
            Remover
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
          <span className="text-sm text-gray-700">Quantidade</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-base font-semibold text-gray-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-lg text-gray-700 hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        {mode === 'add' && (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-gray-600">Total recorrente</span>
            <span className="font-semibold text-gray-900">+{totalLabel}/mês</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? 'Processando…' : mode === 'add' ? `Adicionar ${quantity}` : `Remover ${quantity}`}
        </button>
      </div>
    </Modal>
  )
}
