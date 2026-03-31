import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { Form, FormResponse, ReportTemplate, SectionProgressEvent } from '@/types'
import { useRotatingMessage } from '@/lib/hooks/use-rotating-message'
import { getProfessional } from '@/lib/api/professional-api'
import { createReport } from '@/lib/api/report-api'
import { getCustomer } from '@/lib/api/customer-api'
import { updateFormResponse } from '@/lib/api/form-api'
import { buildVariableMap, resolveBlockVariables } from '@/lib/variable-service'
import { generateFullReport } from '@/lib/api/ai-api'
import { buildQuantitativePayload, getEmptyDataBlocks, countFillableBlocks, countAnsweredFields } from '@/lib/ai-context-builder'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import AiSparkleIcon from '@/components/ai/AiSparkleIcon'

interface GenerateReportModalProps {
  isOpen: boolean
  onClose: () => void
  form: Form | null
  response: FormResponse | null
  template: ReportTemplate | null
  onReportGenerated: (reportId: string) => void
}

type GenerationState = 'confirm' | 'generating' | 'done' | 'error' | 'no-template'

interface ProgressSection {
  name: string
  status: 'pending' | 'generating' | 'completed' | 'error' | 'skipped'
  message?: string
}

export default function GenerateReportModal({
  isOpen,
  onClose,
  form,
  response,
  template,
  onReportGenerated,
}: GenerateReportModalProps) {
  const [state, setState] = useState<GenerationState>('confirm')
  const [errorMessage, setErrorMessage] = useState('')
  const [sections, setSections] = useState<ProgressSection[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [createdReportId, setCreatedReportId] = useState<string | null>(null)
  const [abortHandle, setAbortHandle] = useState<{ abort: () => void } | null>(null)
  const completedCountRef = useRef(0)
  const abortHandleRef = useRef<{ abort: () => void } | null>(null)

  const showNoTemplate = !template

  const emptyDataBlocks = useMemo(() => {
    if (!template) return { tables: [], charts: [] }
    return getEmptyDataBlocks(template.blocks.map((b, i) => ({
      id: String(i),
      type: b.type,
      parentId: b.parentId ?? null,
      order: b.order,
      data: b.data,
      collapsed: false,
    })))
  }, [template])

  const hasEmptyData = emptyDataBlocks.tables.length > 0 || emptyDataBlocks.charts.length > 0

  const fillableCount = useMemo(() => {
    if (!template) return 0
    return countFillableBlocks(template.blocks.map((b, i) => ({
      id: String(i),
      type: b.type,
      parentId: b.parentId ?? null,
      order: b.order,
      data: b.data,
      collapsed: false,
    })))
  }, [template])

  const answeredInfo = useMemo(() => {
    if (!response || !form) return null
    return countAnsweredFields(response.answers, form.fields?.length ?? 0)
  }, [response, form])

  const lowAnswerRate = answeredInfo && answeredInfo.percentage < 30

  // Sincroniza refs para acesso em callbacks sem stale closure
  useEffect(() => { completedCountRef.current = completedCount }, [completedCount])
  useEffect(() => { abortHandleRef.current = abortHandle }, [abortHandle])

  // Cleanup: aborta geração se o componente desmontar
  useEffect(() => {
    return () => { abortHandleRef.current?.abort() }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!form || !response || !template) return

    setState('generating')
    setErrorMessage('')
    setCompletedCount(0)
    setFailedCount(0)

    try {
      await getProfessional()

      let customerData = null
      if (response.customerId) {
        try {
          const customer = await getCustomer(response.customerId)
          customerData = customer?.data ?? null
        } catch {}
      }
      const variableMap = buildVariableMap(customerData, form, response)
      const resolvedBlocks = resolveBlockVariables(
        template.blocks.map((tb, i) => ({
          id: crypto.randomUUID(),
          type: tb.type,
          parentId: tb.parentId ?? null,
          order: tb.order ?? i,
          data: tb.data,
          collapsed: false,
        })),
        variableMap,
      )

      const report = await createReport({
        status: 'rascunho',
        customerName: response.customerName || '',
        customerId: response.customerId ?? undefined,
        formResponseId: response.id,
        formId: form.id,
        blocks: resolvedBlocks,
      })

      setCreatedReportId(report.id)

      await updateFormResponse(form.id, {
        ...response,
        generatedReportId: report.id,
      })

      const sectionNames = resolvedBlocks
        .filter(b => {
          if (b.type === 'section') return true
          if (b.type === 'info-box') return true
          return false
        })
        .sort((a, b) => a.order - b.order)
        .map(b => {
          const d = b.data as { title?: string; label?: string }
          return d.title || d.label || 'Seção'
        })

      setSections(sectionNames.map(name => ({ name, status: 'pending' })))

      const quantitativeData = buildQuantitativePayload(resolvedBlocks)

      const handle = generateFullReport(
        report.id,
        { formResponseIds: [response.id], quantitativeData },
        {
          onSectionProgress: (event: SectionProgressEvent) => {
            setSections(prev => prev.map(s => {
              if (s.name === event.sectionType) {
                const status = event.status === 'completed' ? 'completed'
                  : event.status === 'skipped' ? 'skipped'
                  : 'error'
                return { ...s, status, message: event.message }
              }
              const nextIdx = prev.findIndex(sec => sec.status === 'pending')
              if (nextIdx >= 0 && prev[nextIdx].name === s.name && (event.status === 'completed' || event.status === 'skipped')) {
                return { ...s, status: 'generating' }
              }
              return s
            }))

            if (event.status === 'completed') {
              setCompletedCount(c => c + 1)
            } else if (event.status === 'error') {
              setFailedCount(c => c + 1)
            }
          },
          onComplete: () => {
            setState('done')
          },
          onError: (err: Error) => {
            setErrorMessage(err.message)
            if (completedCountRef.current > 0) {
              setState('done')
            } else {
              setState('error')
            }
          },
        },
      )

      setAbortHandle(handle)
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao criar relatório')
    }
  }, [form, response, template])

  const handleCancel = useCallback(() => {
    abortHandle?.abort()
    if (createdReportId && completedCount > 0) {
      setState('done')
    } else {
      handleClose()
    }
  }, [abortHandle, createdReportId, completedCount])

  const handleClose = useCallback(() => {
    setState('confirm')
    setErrorMessage('')
    setSections([])
    setCompletedCount(0)
    setFailedCount(0)
    setCreatedReportId(null)
    setAbortHandle(null)
    onClose()
  }, [onClose])

  const handleOpenEditor = useCallback(() => {
    if (createdReportId) {
      onReportGenerated(createdReportId)
    }
    handleClose()
  }, [createdReportId, onReportGenerated, handleClose])

  const totalSections = sections.length
  const skippedCount = sections.filter(s => s.status === 'skipped').length
  const currentIndex = completedCount + failedCount + skippedCount
  const percentage = totalSections > 0 ? Math.round((currentIndex / totalSections) * 100) : 0
  const motivationalMessage = useRotatingMessage(percentage)

  return (
    <Modal isOpen={isOpen} onClose={state === 'generating' ? () => {} : handleClose} title="Redigir Laudo com Assistente" size="md">
      <div className="p-4 space-y-4">
        {showNoTemplate ? (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Este formulário não possui um template de relatório vinculado.
              Vincule um template no editor do formulário para usar a geração automática.
            </p>
            <div className="flex justify-center mt-4">
              <Button variant="ghost" onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        ) : state === 'confirm' ? (
          <>
            <div className="bg-brand-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-brand-800 mb-2">Resumo da geração</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-brand-600 font-medium">Cliente:</dt>
                  <dd className="text-brand-800">{response?.customerName || '(sem nome)'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-brand-600 font-medium">Template:</dt>
                  <dd className="text-brand-800">{template?.name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-brand-600 font-medium">Seções a gerar:</dt>
                  <dd className="text-brand-800">{fillableCount}</dd>
                </div>
              </dl>
            </div>

            {lowAnswerRate && answeredInfo && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  Apenas {answeredInfo.answered} de {answeredInfo.total} campos respondidos.
                  A IA terá poucos dados e poderá gerar conteúdo genérico.
                </span>
              </div>
            )}

            {hasEmptyData && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  {emptyDataBlocks.tables.length > 0 && (
                    <>{emptyDataBlocks.tables.length} tabela(s) em branco</>
                  )}
                  {emptyDataBlocks.tables.length > 0 && emptyDataBlocks.charts.length > 0 && ' e '}
                  {emptyDataBlocks.charts.length > 0 && (
                    <>{emptyDataBlocks.charts.length} gráfico(s) em branco</>
                  )}
                  {' '}precisarão ser preenchidos manualmente.
                </span>
              </div>
            )}

            <p className="text-sm text-gray-500">
              O Assistente redigirá as seções de texto com base nas respostas do formulário.
              Você poderá revisar e ajustar tudo no editor.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleGenerate}>
                <span className="flex items-center gap-2">
                  <AiSparkleIcon size={16} />
                  Redigir Laudo
                </span>
              </Button>
            </div>
          </>
        ) : state === 'generating' ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-1">
                <AiSparkleIcon size={16} />
                <span className="text-[15px] font-semibold text-gray-900">Assistente redigindo seu laudo</span>
              </div>
              <p className="text-[13px] text-gray-500 font-medium">
                {currentIndex} de {totalSections} seções
              </p>
            </div>

            {/* Progress bar + message */}
            <div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-[13px] text-gray-400 text-center mt-2 min-h-[20px]">
                {motivationalMessage}
              </p>
            </div>

            {/* Section list */}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {sections.map((section, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-250 ${
                  section.status === 'generating' ? 'bg-brand-50' :
                  section.status === 'completed' || section.status === 'skipped' ? 'opacity-60' :
                  ''
                }`}>
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {section.status === 'completed' && (
                      <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {section.status === 'skipped' && (
                      <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {section.status === 'error' && (
                      <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    {section.status === 'generating' && (
                      <svg className="w-5 h-5 text-brand-600 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                      </svg>
                    )}
                    {section.status === 'pending' && (
                      <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[15px] leading-snug ${
                      section.status === 'generating' ? 'text-gray-900 font-medium' :
                      section.status === 'skipped' ? 'text-amber-600' :
                      section.status === 'error' ? 'text-red-600' :
                      section.status === 'completed' ? 'text-gray-500' :
                      'text-gray-400'
                    }`}>
                      {section.name}
                    </span>
                    {section.status === 'skipped' && section.message && (
                      <span className="text-xs text-amber-500 truncate">{section.message}</span>
                    )}
                  </div>
                  <span className={`ml-auto text-xs shrink-0 ${
                    section.status === 'generating' ? 'text-brand-600 font-medium' :
                    section.status === 'error' ? 'text-red-500' :
                    section.status === 'skipped' ? 'text-amber-500' :
                    section.status === 'completed' ? 'text-gray-400' :
                    'text-gray-300'
                  }`}>
                    {section.status === 'completed' && 'pronto'}
                    {section.status === 'error' && 'erro'}
                    {section.status === 'skipped' && 'requer mais informações'}
                    {section.status === 'generating' && 'redigindo'}
                    {section.status === 'pending' && 'pendente'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancelar redação
              </Button>
            </div>
          </div>
        ) : state === 'done' ? (
          <div className="text-center py-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              failedCount === 0 ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {failedCount === 0 ? (
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {failedCount === 0 && skippedCount === 0 ? (
              <>
                <p className="text-sm font-medium text-gray-800 mb-1">Laudo redigido com sucesso!</p>
                <p className="text-xs text-gray-500 mb-4">
                  {completedCount} seções preenchidas. Revise o conteúdo antes de finalizar.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {failedCount > 0 ? 'Laudo parcialmente redigido' : 'Laudo redigido'}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {completedCount} de {totalSections} seções redigidas.
                  {skippedCount > 0 && ` ${skippedCount} pulada(s) por dados insuficientes.`}
                  {failedCount > 0 && ` ${failedCount} com erro.`}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Você pode redigir as seções restantes individualmente no editor.
                </p>
              </>
            )}

            <div className="flex justify-center">
              <Button onClick={handleOpenEditor}>Abrir no editor</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-sm text-gray-700 font-medium mb-1">Erro ao redigir laudo</p>
            <p className="text-xs text-gray-500 mb-4">{errorMessage}</p>
            <div className="flex justify-center gap-2">
              <Button variant="ghost" onClick={handleClose}>Fechar</Button>
              <Button onClick={() => setState('confirm')}>Tentar novamente</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
