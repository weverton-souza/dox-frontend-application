import { useState, useEffect } from 'react'
import type { AiUsageSummaryResponse, AiUsageDetailResponse } from '@/types'
import { getUsageSummary, getUsageHistory } from '@/lib/api/ai-api'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

interface AiUsageDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export default function AiUsageDashboard({ isOpen, onClose }: AiUsageDashboardProps) {
  const [summary, setSummary] = useState<AiUsageSummaryResponse | null>(null)
  const [history, setHistory] = useState<AiUsageDetailResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    Promise.all([getUsageSummary(month, year), getUsageHistory(month, year)])
      .then(([s, h]) => {
        setSummary(s)
        setHistory(h)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen])

  const percentage = summary && summary.limit > 0
    ? Math.round((summary.used / summary.limit) * 100)
    : 0

  const barColor = percentage >= 100
    ? 'bg-red-500'
    : percentage >= 80
      ? 'bg-amber-500'
      : 'bg-brand-600'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Consumo do Assistente" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {summary.tierName || 'Plano Assistente'}
              </span>
              <span className="text-sm text-gray-500">
                {summary.used} de {summary.limit} laudos
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            {summary.overage > 0 && (
              <p className="text-xs text-amber-600 mt-2">
                {summary.overage} laudos excedentes (R${(summary.overageCostCents / 100).toFixed(2)} estimados)
              </p>
            )}
          </div>

          {history.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Histórico do mês</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 text-xs border border-gray-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        item.status === 'SUCCESS' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-gray-700">{item.sectionType}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <span>{item.inputTokens + item.outputTokens} tokens</span>
                      <span>R${item.estimatedCostBrl.toFixed(4)}</span>
                      <span>{item.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-8 text-center">
          Não foi possível carregar os dados de consumo.
        </p>
      )}
    </Modal>
  )
}
