import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface AiFinalizationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  used: number
  limit: number
  warningCount?: number
  hasAi?: boolean
  customerName?: string
  blockCount?: number
}

const CONFIRM_WORD = 'finalizar'

export default function AiFinalizationModal({
  isOpen,
  onClose,
  onConfirm,
  used,
  limit,
  warningCount = 0,
  hasAi = false,
  customerName,
  blockCount,
}: AiFinalizationModalProps) {
  const [confirmation, setConfirmation] = useState('')
  const [acceptedIrreversible, setAcceptedIrreversible] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setConfirmation('')
      setAcceptedIrreversible(false)
    }
  }, [isOpen])

  const wordOk = confirmation.trim().toLowerCase() === CONFIRM_WORD
  const canConfirm = wordOk && acceptedIrreversible

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm()
  }

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar relatório"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
            Finalizar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span><strong>Esta ação é irreversível.</strong> Após finalizar, o relatório não poderá mais ser editado nem regenerado pelo Assistente.</span>
        </div>

        {(customerName || blockCount !== undefined) && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Resumo
            </div>
            {customerName && (
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-gray-500">Cliente</span>
                <span className="font-medium truncate">{customerName}</span>
              </div>
            )}
            {blockCount !== undefined && (
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-gray-500">Blocos</span>
                <span className="font-medium">{blockCount}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-gray-500">Finalizado em</span>
              <span className="font-medium">{today}</span>
            </div>
          </div>
        )}

        {hasAi && (
          <p className="text-sm text-gray-700">
            Este relatório contém seções geradas pelo Assistente.
          </p>
        )}

        {warningCount > 0 && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              {warningCount} {warningCount === 1 ? 'seção não foi gerada' : 'seções não foram geradas'} por dados insuficientes. Revise antes de finalizar.
            </span>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1.5">
          <p>Ao finalizar:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            {hasAi && <li>Será contabilizado na sua franquia mensal ({used}/{limit} usados)</li>}
            <li>Não poderá mais ser editado</li>
            <li>O Assistente não poderá mais ser usado neste relatório</li>
            <li>O status não poderá ser revertido</li>
            <li>Estará disponível para download em .docx</li>
          </ul>
        </div>

        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptedIrreversible}
            onChange={(e) => setAcceptedIrreversible(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">
            Entendo que esta ação é irreversível e o relatório não poderá mais ser editado.
          </span>
        </label>

        <div className="pt-1">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Para confirmar, digite <span className="font-semibold text-brand-700">{CONFIRM_WORD}</span> abaixo:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  )
}
