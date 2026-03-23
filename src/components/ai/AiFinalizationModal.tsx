import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface AiFinalizationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  used: number
  limit: number
  warningCount?: number
}

export default function AiFinalizationModal({
  isOpen,
  onClose,
  onConfirm,
  used,
  limit,
  warningCount = 0,
}: AiFinalizationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar laudo"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Sim, finalizar
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          Este laudo contém seções geradas pelo Assistente.
        </p>
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
            <li>Será contabilizado na sua franquia mensal ({used}/{limit} usados)</li>
            <li>Não poderá mais ser editado</li>
            <li>Estará disponível para exportação .docx</li>
          </ul>
        </div>
        <p className="text-sm font-medium text-gray-800">
          Você revisou todo o conteúdo gerado?
        </p>
      </div>
    </Modal>
  )
}
