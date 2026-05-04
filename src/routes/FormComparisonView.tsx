import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import type {
  AdditionalEvaluator,
  AggregatedFormGroup,
  ComparisonResult,
  ComparisonRespondent,
  FormFieldAnswer,
  FormResponse,
} from '@/types'
import { CUSTOMER_CONTACT_RELATION_LABELS } from '@/types'
import { getAggregatedForms, getFormComparison } from '@/lib/api/customer-forms-api'
import { getFormResponseById, updateFormResponse } from '@/lib/api/form-api'
import { buildFormSectionGroups } from '@/lib/utils'
import { useError } from '@/contexts/ErrorContext'
import type { SaveStatus } from '@/lib/hooks/use-auto-save'
import SaveStatusIndicator from '@/components/ui/SaveStatusIndicator'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import EditorPageHeader from '@/components/editor/EditorPageHeader'
import FormPrintModal, { type PrintConfirmPayload } from '@/components/form-builder/FormPrintModal'
import { generateFormDocx } from '@/lib/docx-engine/form-generator'
import { getProfessional } from '@/lib/api/professional-api'
import { getInitials } from '@/lib/avatar-utils'
import { colorForIndex, type RespondentColor } from '@/lib/respondent-colors'
import ComparisonFormView from '@/components/comparison/ComparisonFormView'

export interface RespondentVisual {
  respondent: ComparisonRespondent
  index: number
  color: RespondentColor
  initials: string
  label: string
}

const SAVE_DEBOUNCE_MS = 800

function formatTotalDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const rem = totalSeconds % 60
  return rem === 0 ? `${minutes}min` : `${minutes}min ${rem}s`
}

function formatRespondentLabel(r: ComparisonRespondent): string {
  if (r.respondentType === 'customer') return 'Cliente'
  if (r.respondentType === 'professional') return 'Profissional'
  const rt = r.relationType as keyof typeof CUSTOMER_CONTACT_RELATION_LABELS | undefined
  if (rt && CUSTOMER_CONTACT_RELATION_LABELS[rt]) {
    return rt === 'parent' ? 'Filiação' : CUSTOMER_CONTACT_RELATION_LABELS[rt]
  }
  return 'Contato'
}

export default function FormComparisonView() {
  const { customerId, formId } = useParams<{ customerId: string; formId: string }>()
  const [searchParams] = useSearchParams()
  const versionId = searchParams.get('versionId') || ''
  const navigate = useNavigate()
  const { showError } = useError()

  const [data, setData] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [responsesById, setResponsesById] = useState<Map<string, FormResponse>>(new Map())
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [otherForms, setOtherForms] = useState<AggregatedFormGroup[]>([])
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const inFlightSaves = useRef<Set<string>>(new Set())
  const responsesRef = useRef<Map<string, FormResponse>>(new Map())

  useEffect(() => {
    responsesRef.current = responsesById
  }, [responsesById])

  useEffect(() => {
    if (!customerId || !formId || !versionId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getFormComparison(customerId, formId, versionId)
      .then(async (res) => {
        if (cancelled) return
        setData(res)
        const responseIds = res.respondents
          .map((r) => r.responseId)
          .filter((id): id is string => !!id)
        if (responseIds.length === 0) return
        const responses = await Promise.all(
          responseIds.map((id) => getFormResponseById(formId, id).catch(() => null)),
        )
        if (cancelled) return
        const map = new Map<string, FormResponse>()
        for (const r of responses) {
          if (r) map.set(r.id, r)
        }
        setResponsesById(map)
      })
      .catch((err) => {
        if (!cancelled) showError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    getAggregatedForms(customerId)
      .then((groups) => {
        if (!cancelled) setOtherForms(groups)
      })
      .catch(() => {
        // silencioso — sidebar é acessório
      })

    return () => {
      cancelled = true
      pendingTimers.current.forEach((t) => clearTimeout(t))
      pendingTimers.current.clear()
    }
  }, [customerId, formId, versionId, showError])

  const respondentVisuals = useMemo<RespondentVisual[]>(() => {
    if (!data) return []
    return data.respondents.map((r, idx) => ({
      respondent: r,
      index: idx,
      color: colorForIndex(idx),
      initials: getInitials(r.respondentName || '?'),
      label: formatRespondentLabel(r),
    }))
  }, [data])

  const answeredVisuals = useMemo(
    () => respondentVisuals.filter((v) => v.respondent.status === 'answered'),
    [respondentVisuals],
  )

  const sectionGroups = useMemo(
    () => (data ? buildFormSectionGroups([...data.fields].sort((a, b) => a.order - b.order)) : []),
    [data],
  )

  const linkIdToResponseId = useMemo(() => {
    const map = new Map<string, string>()
    if (!data) return map
    for (const r of data.respondents) {
      if (r.responseId) map.set(r.linkId, r.responseId)
    }
    return map
  }, [data])

  const scheduleSaveResponse = useCallback(
    (responseId: string) => {
      if (!formId) return
      const existing = pendingTimers.current.get(responseId)
      if (existing) clearTimeout(existing)
      const timer = setTimeout(async () => {
        pendingTimers.current.delete(responseId)
        const response = responsesRef.current.get(responseId)
        if (!response) return
        inFlightSaves.current.add(responseId)
        setSaveStatus('saving')
        try {
          await updateFormResponse(formId, response)
        } catch (err) {
          showError(err)
        } finally {
          inFlightSaves.current.delete(responseId)
          if (
            inFlightSaves.current.size === 0 &&
            pendingTimers.current.size === 0
          ) {
            setSaveStatus('saved')
          }
        }
      }, SAVE_DEBOUNCE_MS)
      pendingTimers.current.set(responseId, timer)
    },
    [formId, showError],
  )

  const handleNoteChange = useCallback(
    (linkId: string, fieldId: string, note: string) => {
      const responseId = linkIdToResponseId.get(linkId)
      if (!responseId) return
      setSaveStatus('unsaved')
      setResponsesById((prev) => {
        const response = prev.get(responseId)
        if (!response) return prev
        const existingAnswer = response.answers.find((a) => a.fieldId === fieldId)
        const updatedAnswer: FormFieldAnswer = existingAnswer
          ? {
              ...existingAnswer,
              professional: {
                ...(existingAnswer.professional ?? {}),
                note,
                answeredAt: new Date().toISOString(),
              },
            }
          : {
              fieldId,
              value: '',
              selectedOptionIds: [],
              scaleValue: null,
              likertAnswers: {},
              professional: { note, answeredAt: new Date().toISOString() },
            }
        const answers = existingAnswer
          ? response.answers.map((a) => (a.fieldId === fieldId ? updatedAnswer : a))
          : [...response.answers, updatedAnswer]
        const next = new Map(prev)
        next.set(responseId, { ...response, answers })
        return next
      })
      scheduleSaveResponse(responseId)
    },
    [linkIdToResponseId, scheduleSaveResponse],
  )

  const getNote = useCallback(
    (linkId: string, fieldId: string): string | undefined => {
      const responseId = linkIdToResponseId.get(linkId)
      if (!responseId) return undefined
      const response = responsesById.get(responseId)
      if (!response) return undefined
      return response.answers.find((a) => a.fieldId === fieldId)?.professional?.note ?? ''
    },
    [linkIdToResponseId, responsesById],
  )

  const totalDurationActiveMs = useMemo(() => {
    let total = 0
    for (const response of responsesById.values()) {
      if (!response.pageDurationsMs) continue
      for (const ms of Object.values(response.pageDurationsMs)) {
        total += ms
      }
    }
    return total
  }, [responsesById])

  const printRespondents = useMemo(
    () =>
      answeredVisuals
        .filter((v) => v.respondent.responseId)
        .map((v) => ({
          id: v.respondent.responseId as string,
          label: `${v.respondent.respondentName?.split(' ')[0] ?? '—'} (${v.label})`,
        })),
    [answeredVisuals],
  )

  const handlePrintConfirm = useCallback(
    async ({ selectedFieldIds, respondentId, evaluators }: PrintConfirmPayload) => {
      if (!data || !formId) return
      const targetResponseId = respondentId ?? printRespondents[0]?.id
      if (!targetResponseId) return
      const response = responsesById.get(targetResponseId)
      if (!response) return

      const updatedResponse: FormResponse = { ...response, additionalEvaluators: evaluators }
      setResponsesById((prev) => {
        const next = new Map(prev)
        next.set(targetResponseId, updatedResponse)
        return next
      })
      try {
        await updateFormResponse(formId, updatedResponse)
      } catch (err) {
        showError(err)
        return
      }

      const professional = await getProfessional().catch(() => null)
      await generateFormDocx({
        formTitle: data.form.title,
        fields: data.fields,
        selectedFieldIds,
        header: {
          professional,
          customerName: updatedResponse.customerName,
          date: new Date(),
        },
        response: updatedResponse,
        evaluators,
      })
    },
    [data, formId, responsesById, printRespondents, showError],
  )

  const historyEntries = useMemo(() => {
    const byFormId = new Map<string, AggregatedFormGroup>()
    for (const g of otherForms) {
      const isCurrent = g.form.id === formId && g.version.id === versionId
      const existing = byFormId.get(g.form.id)
      if (isCurrent) {
        byFormId.set(g.form.id, g)
      } else if (!existing) {
        byFormId.set(g.form.id, g)
      } else if (existing.form.id !== formId && g.version.version > existing.version.version) {
        byFormId.set(g.form.id, g)
      }
    }
    return Array.from(byFormId.values())
  }, [otherForms, formId, versionId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Comparação não encontrada</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate(`/customers/${customerId}?tab=forms`)}>Voltar</Button>
        </div>
      </div>
    )
  }

  const canPrint = printRespondents.length > 0

  return (
    <div
      className="min-h-[calc(100vh-3rem)] bg-gray-100 pb-6"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        backgroundAttachment: 'fixed',
      }}
    >
      <EditorPageHeader
        onBack={() => navigate(`/customers/${customerId}?tab=forms`)}
        showSaveStatus={false}
        alignWithSidebar
        withToolbarSpacer={false}
        center={
          <div className="flex items-center gap-2 min-w-0 text-xs text-gray-500">
            <span className="text-sm font-medium text-gray-700 truncate">
              {data.form.title}
            </span>
            <span className="text-gray-300 shrink-0">·</span>
            <span className="shrink-0">
              <span className="text-gray-400">Data:</span>{' '}
              <span className="text-gray-700">
                {new Date(data.respondents[0]?.submittedAt ?? Date.now()).toLocaleDateString('pt-BR')}
              </span>
            </span>
            <span className="text-gray-300 shrink-0">·</span>
            <span className="shrink-0" title="Soma do tempo de preenchimento de todos os respondentes">
              <span className="text-gray-400">Tempo:</span>{' '}
              <span className="text-gray-700">
                {totalDurationActiveMs > 0 ? formatTotalDuration(totalDurationActiveMs) : '—'}
              </span>
            </span>
            <span className="text-gray-300 shrink-0">·</span>
            <span className="shrink-0" title="Respondentes que enviaram resposta sobre o total convidado">
              <span className="text-gray-400">Respondentes:</span>{' '}
              <span className="text-gray-700">
                {answeredVisuals.length}/{data.respondents.length}
              </span>
            </span>
          </div>
        }
        right={
          canPrint ? (
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-xs font-medium"
              title="Imprimir resposta preenchida"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Imprimir
            </button>
          ) : null
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8 pt-6 lg:pt-14">
        <aside className="w-full lg:w-72 xl:w-80 lg:shrink-0 flex flex-col lg:self-start lg:sticky lg:top-[160px] lg:min-h-[400px] lg:max-h-[calc(100vh-176px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-3 pt-4 pb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Histórico
            </span>
            <SaveStatusIndicator status={saveStatus} showLabel={true} />
          </div>

          <nav className="flex-1 overflow-y-auto px-1 pb-3 min-h-0">
            {historyEntries.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">
                Sem respostas para este cliente.
              </p>
            ) : (
              <ul className="space-y-1">
                {historyEntries.map((g) => {
                  const answered = g.respondents.filter((r) => r.status === 'answered').length
                  const total = g.respondents.length
                  const sentDate = new Date(g.sentAt).toLocaleDateString('pt-BR')
                  const isActive = g.form.id === formId && g.version.id === versionId
                  return (
                    <li key={`${g.form.id}-${g.version.id}`}>
                      <button
                        type="button"
                        onClick={() =>
                          isActive
                            ? undefined
                            : navigate(
                                `/customers/${customerId}/forms/${g.form.id}/comparison?versionId=${g.version.id}`,
                              )
                        }
                        title={`${g.form.title} · v${g.version.version} · ${sentDate} · ${answered}/${total} respondentes`}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-medium cursor-default'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="block truncate">
                          {g.form.title}
                          <span
                            className={`ml-1.5 font-normal ${
                              isActive ? 'text-brand-400' : 'text-gray-400'
                            }`}
                          >
                            · v{g.version.version}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <ComparisonFormView
            data={data}
            sectionGroups={sectionGroups}
            visuals={answeredVisuals}
            editable
            getNote={getNote}
            onNoteChange={handleNoteChange}
          />
        </div>
      </div>

      {canPrint && (
        <FormPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          fields={data.fields}
          respondents={printRespondents}
          initialEvaluators={
            (() => {
              const first = printRespondents[0]
              if (!first) return []
              return responsesById.get(first.id)?.additionalEvaluators ?? []
            })() as AdditionalEvaluator[]
          }
          onConfirm={handlePrintConfirm}
          title="Imprimir resposta preenchida"
        />
      )}
    </div>
  )
}
