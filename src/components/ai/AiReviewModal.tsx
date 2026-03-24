import { useState, useEffect, useCallback } from 'react'
import type { ReviewAction, ReviewTextResponse, FormResponse } from '@/types'
import { reviewText } from '@/lib/api/ai-api'
import { getFormResponsesByCustomerId } from '@/lib/api/form-api'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import AiSparkleIcon from '@/components/ai/AiSparkleIcon'

interface AiReviewModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
  customerId?: string
  blockText: string
  sectionType?: string
  onAccept: (revisedText: string) => void
}

const REVIEW_ACTIONS: { value: ReviewAction; label: string; description: string }[] = [
  { value: 'corrigir', label: 'Corrigir', description: 'Corrige erros gramaticais e ortográficos' },
  { value: 'melhorar', label: 'Melhorar', description: 'Torna o texto mais técnico e profissional' },
  { value: 'resumir', label: 'Resumir', description: 'Condensa mantendo informações relevantes' },
  { value: 'expandir', label: 'Expandir', description: 'Adiciona detalhes e profundidade' },
]

type ModalStep = 'configure' | 'loading' | 'result'

export default function AiReviewModal({
  isOpen,
  onClose,
  reportId,
  customerId,
  blockText,
  sectionType,
  onAccept,
}: AiReviewModalProps) {
  const [step, setStep] = useState<ModalStep>('configure')
  const [selectedAction, setSelectedAction] = useState<ReviewAction>('melhorar')
  const [instruction, setInstruction] = useState('')
  const [formResponses, setFormResponses] = useState<FormResponse[]>([])
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([])
  const [showSources, setShowSources] = useState(false)
  const [result, setResult] = useState<ReviewTextResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setStep('configure')
      setInstruction('')
      setResult(null)
      setError(null)
      setShowSources(false)
      setSelectedResponseIds([])
      setSelectedAction('melhorar')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !customerId) return
    getFormResponsesByCustomerId(customerId)
      .then((responses) => {
        const completed = responses.filter((r) => r.status === 'concluido')
        setFormResponses(completed)
      })
      .catch(() => setFormResponses([]))
  }, [isOpen, customerId])

  const handleReview = useCallback(async () => {
    setStep('loading')
    setError(null)

    try {
      const response = await reviewText(reportId, {
        text: blockText,
        action: selectedAction,
        sectionType: sectionType || undefined,
        instruction: instruction.trim() || undefined,
        formResponseIds: selectedResponseIds.length > 0 ? selectedResponseIds : undefined,
      })
      setResult(response)
      setStep('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao revisar texto')
      setStep('configure')
    }
  }, [reportId, blockText, selectedAction, sectionType, instruction, selectedResponseIds])

  const handleAccept = useCallback(() => {
    if (result) {
      onAccept(result.revised)
      onClose()
    }
  }, [result, onAccept, onClose])

  const toggleResponseId = useCallback((id: string) => {
    setSelectedResponseIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }, [])

  const footer = (
    <div className="flex items-center justify-between">
      <div className="text-xs text-gray-400">
        {result && `${result.tokensUsed} tokens`}
      </div>
      <div className="flex gap-2">
        {step === 'configure' && (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleReview}>
              <span className="flex items-center gap-1.5">
                <AiSparkleIcon size={14} />
                Revisar
              </span>
            </Button>
          </>
        )}
        {step === 'result' && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setStep('configure')}>
              Voltar
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Descartar
            </Button>
            <Button size="sm" onClick={handleAccept}>
              Aceitar revisão
            </Button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revisar com Assistente"
      size="lg"
      footer={footer}
      accent={{ colorClass: 'bg-brand-50 text-brand-600', icon: <AiSparkleIcon size={16} /> }}
    >
      {step === 'configure' && (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de revisão
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REVIEW_ACTIONS.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => setSelectedAction(action.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedAction === action.value
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{action.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom instruction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Instrução adicional <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Adicione mais detalhes sobre os resultados cognitivos"
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            />
          </div>

          {/* Sources (expandable) */}
          {customerId && formResponses.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSources(!showSources)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clipRule="evenodd" />
                  </svg>
                  Fontes de dados
                  {selectedResponseIds.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded">
                      {selectedResponseIds.length}
                    </span>
                  )}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`text-gray-400 transition-transform ${showSources ? 'rotate-180' : ''}`}
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {showSources && (
                <div className="border-t border-gray-200 px-3 py-2 space-y-1.5 max-h-40 overflow-y-auto">
                  <p className="text-xs text-gray-400 mb-1">
                    Selecione questionários para enriquecer a revisão com dados do cliente
                  </p>
                  {formResponses.map((response) => (
                    <label
                      key={response.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedResponseIds.includes(response.id)}
                        onChange={() => toggleResponseId(response.id)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-gray-700 block truncate">
                          {response.customerName || 'Formulário'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {response.createdAt
                            ? new Date(response.createdAt).toLocaleDateString('pt-BR')
                            : ''}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Text preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Texto atual
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
              {blockText.length > 500 ? blockText.slice(0, 500) + '…' : blockText}
            </div>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Revisando texto com o Assistente...</p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">
                Original
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {result.original}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">
                Revisado
              </label>
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-sm text-gray-800 max-h-64 overflow-y-auto whitespace-pre-wrap">
                {result.revised}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
