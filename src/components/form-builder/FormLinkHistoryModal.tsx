import { useEffect, useState } from 'react'
import type { FormLinkEmailHistoryItem, EmailLogStatus } from '@/types'
import { getFormLinkEmailHistory } from '@/lib/api/form-link-api'
import { useError } from '@/contexts/ErrorContext'
import Modal from '@/components/ui/Modal'
import { formatDateTime } from '@/lib/utils'

interface FormLinkHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  linkId: string | null
  respondentName: string | null
}

const TEMPLATE_LABELS: Record<string, string> = {
  'form-invite': 'Convite inicial',
  'form-followup-soft': 'Lembrete · D+1',
  'form-followup-medium': 'Lembrete · ação pendente',
  'form-followup-urgent': 'Último lembrete',
}

const STATUS_LABELS: Record<EmailLogStatus, string> = {
  PENDING: 'Aguardando',
  SENT: 'Enviado',
  FAILED: 'Falhou',
  DELIVERED: 'Entregue',
  BOUNCED: 'Devolvido',
  COMPLAINED: 'Marcado como spam',
  OPENED: 'Aberto',
  CLICKED: 'Clicado',
  SUPPRESSED: 'Não enviado',
}

const STATUS_COLORS: Record<EmailLogStatus, string> = {
  PENDING: 'text-gray-500 bg-gray-100',
  SENT: 'text-blue-700 bg-blue-50',
  FAILED: 'text-red-700 bg-red-50',
  DELIVERED: 'text-emerald-700 bg-emerald-50',
  BOUNCED: 'text-red-700 bg-red-50',
  COMPLAINED: 'text-red-700 bg-red-50',
  OPENED: 'text-emerald-700 bg-emerald-50',
  CLICKED: 'text-emerald-700 bg-emerald-50',
  SUPPRESSED: 'text-amber-700 bg-amber-50',
}

export default function FormLinkHistoryModal({
  isOpen,
  onClose,
  linkId,
  respondentName,
}: FormLinkHistoryModalProps) {
  const { showError } = useError()
  const [items, setItems] = useState<FormLinkEmailHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !linkId) return
    let cancelled = false
    setLoading(true)
    getFormLinkEmailHistory(linkId)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err) => {
        if (!cancelled) showError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, linkId, showError])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico de emails${respondentName ? ' · ' + respondentName : ''}`} size="lg">
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Nenhum email enviado para este link ainda.</p>
            <p className="text-xs text-gray-400 mt-1">Os envios automáticos aparecem aqui depois que o cron diário rodar (9h).</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {TEMPLATE_LABELS[item.templateId] ?? item.templateId}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      Para {item.recipientEmail} · {formatDateTime(item.sentAt)}
                    </p>
                    {item.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{item.errorMessage}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-md ${STATUS_COLORS[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
