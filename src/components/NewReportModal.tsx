import { useState, useEffect, useMemo } from 'react'
import type { Customer, ReportTemplate } from '@/types'
import { getReportTemplates } from '@/lib/api/template-api'
import { getAllTemplates } from '@/lib/default-templates'
import { getBlockTitle } from '@/lib/block-constants'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface NewReportModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  onSelectTemplate: (template: ReportTemplate) => void
  onSelectBlank: () => void
}

export default function NewReportModal({
  isOpen,
  onClose,
  customer,
  onSelectTemplate,
  onSelectBlank,
}: NewReportModalProps) {
  const [customTemplates, setCustomTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    getReportTemplates()
      .then(setCustomTemplates)
      .catch(() => setCustomTemplates([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  const templates = useMemo(
    () => getAllTemplates(customTemplates),
    [customTemplates],
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Relatório" size="lg">
      <div className="p-4 space-y-4">
        <div className="bg-brand-50 rounded-lg px-4 py-3">
          <p className="text-sm text-brand-800">
            <span className="font-medium">Cliente:</span> {customer.data.name}
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Escolha um template para iniciar o relatório com seções pré-definidas, ou comece do zero.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* Opção em branco */}
            <button
              type="button"
              onClick={() => { onSelectBlank(); onClose() }}
              className="w-full text-left p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-300 hover:bg-brand-50/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gray-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Relatório em branco</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Inicia apenas com o bloco de identificação preenchido
                  </p>
                </div>
              </div>
            </button>

            {/* Templates */}
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => { onSelectTemplate(template); onClose() }}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-brand-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{template.name}</p>
                      {template.isDefault && (
                        <span className="text-[10px] font-medium uppercase bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">
                          Padrão
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{template.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {template.blocks.length} blocos
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1 pl-12">
                  {template.blocks.map((block, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                    >
                      {getBlockTitle(block)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}
