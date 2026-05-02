import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import type {
  ComparisonResult,
  ComparisonRespondent,
  FormField,
  FormFieldAnswer,
} from '@/types'
import { CUSTOMER_CONTACT_RELATION_LABELS } from '@/types'
import { getFormComparison } from '@/lib/api/customer-forms-api'
import { buildFormSectionGroups } from '@/lib/utils'
import { useError } from '@/contexts/ErrorContext'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import { getInitials } from '@/lib/avatar-utils'
import { colorForIndex, type RespondentColor } from '@/lib/respondent-colors'
import ComparisonLegend from '@/components/comparison/ComparisonLegend'
import ComparisonFormView from '@/components/comparison/ComparisonFormView'
import ComparisonTablePreview from '@/components/comparison/ComparisonTablePreview'

type ViewMode = 'form' | 'table'

interface RespondentVisual {
  respondent: ComparisonRespondent
  index: number
  color: RespondentColor
  initials: string
  label: string
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
  const [viewMode, setViewMode] = useState<ViewMode>('form')

  useEffect(() => {
    if (!customerId || !formId || !versionId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getFormComparison(customerId, formId, versionId)
      .then((res) => {
        if (!cancelled) setData(res)
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
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-page mx-auto px-page py-5">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-400 hover:text-brand-600 transition-colors mb-2"
          >
            ← Voltar
          </button>
          <h1 className="text-xl font-bold text-gray-900">{data.form.title}</h1>
          <p className="text-xs text-gray-500 mt-1">
            v{data.version.version} · {answeredVisuals.length} de {data.respondents.length} respondentes responderam
          </p>
        </div>
      </div>

      <div className="flex-1 bg-gray-50/50">
        <div className="max-w-page mx-auto px-page py-6 space-y-5">
          <ComparisonLegend visuals={respondentVisuals} />

          <div className="inline-flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'form' ? 'bg-brand-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Formulário
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table' ? 'bg-brand-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tabela
            </button>
          </div>

          {viewMode === 'form' && (
            <ComparisonFormView
              sectionGroups={sectionGroups}
              visuals={answeredVisuals}
            />
          )}

          {viewMode === 'table' && (
            <ComparisonTablePreview data={data} visuals={respondentVisuals} />
          )}
        </div>
      </div>
    </div>
  )
}

export function findAnswer(answers: FormFieldAnswer[], fieldId: string): FormFieldAnswer | undefined {
  return answers.find((a) => a.fieldId === fieldId)
}

export function getOptionValue(field: FormField, answer: FormFieldAnswer | undefined): number | null {
  if (!answer) return null
  const id = answer.selectedOptionIds[0]
  if (!id) return null
  const opt = field.options.find((o) => o.id === id)
  return opt?.value ?? null
}
