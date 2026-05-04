import { Fragment, useEffect, useMemo, useRef } from 'react'
import type {
  ComparisonResult,
  ComparisonRespondent,
  FormField,
  FormFieldAnswer,
  FormSectionGroup,
  ScoreResult,
} from '@/types'
import type { RespondentColor } from '@/lib/respondent-colors'

interface RespondentVisual {
  respondent: ComparisonRespondent
  index: number
  color: RespondentColor
  initials: string
  label: string
}

interface ComparisonFormViewProps {
  data: ComparisonResult
  sectionGroups: FormSectionGroup[]
  visuals: RespondentVisual[]
  editable?: boolean
  getNote?: (linkId: string, fieldId: string) => string | undefined
  onNoteChange?: (linkId: string, fieldId: string, note: string) => void
}

const FAST_RESPONSE_THRESHOLD_MS = 2000

function getAnswer(visual: RespondentVisual, fieldId: string): FormFieldAnswer | undefined {
  return visual.respondent.answers.find((a) => a.fieldId === fieldId)
}

interface CellValue {
  label: string
  value?: number | null
  interactionMs?: number | null
}

function formatDurationSeconds(ms: number | null | undefined): string | null {
  if (ms == null) return null
  return `${Math.round(ms / 1000)}s`
}

function renderCellValue(field: FormField, answer: FormFieldAnswer | undefined): CellValue {
  const interactionMs = answer?.patientInteractionMs ?? null
  if (!answer) return { label: '—', interactionMs }
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
      return { label: answer.value || '—', interactionMs }
    case 'yes-no':
      return { label: answer.value ? answer.value.charAt(0).toUpperCase() + answer.value.slice(1) : '—', interactionMs }
    case 'scale':
      return {
        label: answer.scaleValue !== null && answer.scaleValue !== undefined ? String(answer.scaleValue) : '—',
        value: answer.scaleValue,
        interactionMs,
      }
    case 'single-choice':
    case 'inventory-item': {
      const id = answer.selectedOptionIds[0]
      const opt = field.options.find((o) => o.id === id)
      if (!opt) return { label: '—', interactionMs }
      return { label: opt.label, value: opt.value ?? null, interactionMs }
    }
    case 'multiple-choice':
      return {
        label:
          answer.selectedOptionIds
            .map((id) => field.options.find((o) => o.id === id)?.label)
            .filter(Boolean)
            .join(', ') || '—',
        interactionMs,
      }
    default:
      return { label: '—', interactionMs }
  }
}

function renderLikertCell(
  field: FormField,
  rowId: string,
  answer: FormFieldAnswer | undefined,
  includeMeta: boolean,
): CellValue {
  const interactionMs = includeMeta ? answer?.patientInteractionMs ?? null : null
  if (!answer) return { label: '—', interactionMs }
  const v = answer.likertAnswers[rowId]
  if (v === undefined || v === null) return { label: '—', interactionMs }
  const point = field.likertScale.find((p) => p.value === v)
  return { label: point ? point.label : String(v), value: v, interactionMs }
}

interface QuestionRow {
  id: string
  label: string
  reverseScored?: boolean
  fieldId: string
  showNoteCell: boolean
  cellRender: (visual: RespondentVisual) => CellValue
}

function buildRowsForField(field: FormField): QuestionRow[] {
  if (field.type === 'likert-matrix') {
    return field.likertRows.map((row, idx) => ({
      id: `${field.id}:${row.id}`,
      label: row.label || 'Pergunta',
      reverseScored: row.reverseScored,
      fieldId: field.id,
      showNoteCell: idx === 0,
      cellRender: (v) => renderLikertCell(field, row.id, getAnswer(v, field.id), idx === 0),
    }))
  }
  if (field.type === 'section-header') return []
  return [
    {
      id: field.id,
      label: field.label || '(pergunta sem título)',
      reverseScored: field.reverseScored,
      fieldId: field.id,
      showNoteCell: true,
      cellRender: (v) => renderCellValue(field, getAnswer(v, field.id)),
    },
  ]
}

function CellContent({ cell, color }: { cell: CellValue; color: RespondentColor }) {
  const hasValue = cell.value !== null && cell.value !== undefined && cell.label !== '—'
  const showMeta = cell.interactionMs != null && cell.label !== '—'
  const isFast = cell.interactionMs != null && cell.interactionMs < FAST_RESPONSE_THRESHOLD_MS
  const durationLabel = formatDurationSeconds(cell.interactionMs)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium" style={{ color: color.primary }}>
        {cell.label}
        {hasValue && <span className="ml-1.5 text-xs opacity-70">({cell.value})</span>}
      </span>
      {showMeta && durationLabel && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium self-start"
          style={
            isFast
              ? { backgroundColor: '#F4E0D2', color: '#9E7560' }
              : { backgroundColor: '#D7E3D7', color: '#5A7A5A' }
          }
          title={isFast ? 'Respondido em menos de 2s — possível chute' : 'Tempo de interação dentro do esperado'}
        >
          {durationLabel} – {isFast ? 'Rápido' : 'Normal'}
        </span>
      )}
    </div>
  )
}

interface NoteCellProps {
  value: string
  editable: boolean
  onChange?: (next: string) => void
}

function NoteCell({ value, editable, onChange }: NoteCellProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  if (!editable) {
    return value ? (
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{value}</p>
    ) : null
  }
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="Observação clínica…"
      rows={1}
      className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border border-transparent rounded-md px-2 py-1 hover:border-gray-200 focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-200 resize-none transition-colors overflow-hidden min-h-[2rem]"
    />
  )
}

function ScoreCell({ score, color }: { score: ScoreResult | undefined; color: RespondentColor }) {
  if (!score || score.value === null || score.value === undefined) {
    return <span className="text-gray-400">—</span>
  }
  return (
    <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: color.primary }}>
      <span className="text-base">{score.value}</span>
      {score.classification && (
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ backgroundColor: color.cellTint, color: color.primary }}
        >
          {score.classification}
        </span>
      )}
    </span>
  )
}

export default function ComparisonFormView({
  data,
  sectionGroups,
  visuals,
  editable = false,
  getNote,
  onNoteChange,
}: ComparisonFormViewProps) {
  const resolveNote = (linkId: string, fieldId: string): string => {
    if (getNote) {
      const fromState = getNote(linkId, fieldId)
      if (fromState !== undefined) return fromState
    }
    const visual = visuals.find((v) => v.respondent.linkId === linkId)
    return visual?.respondent.answers.find((a) => a.fieldId === fieldId)?.professional?.note ?? ''
  }

  const isMultiRespondent = visuals.length > 1

  const sharedNoteLinkId = useMemo(() => {
    if (!isMultiRespondent) return null
    const customer = visuals.find(
      (v) => v.respondent.respondentType === 'customer' && v.respondent.responseId,
    )
    if (customer) return customer.respondent.linkId
    const anyEditable = visuals.find((v) => v.respondent.responseId)
    return anyEditable?.respondent.linkId ?? null
  }, [visuals, isMultiRespondent])

  const sharedNoteEditable = useMemo(() => {
    if (!sharedNoteLinkId) return false
    const v = visuals.find((x) => x.respondent.linkId === sharedNoteLinkId)
    return editable && !!v?.respondent.responseId
  }, [editable, sharedNoteLinkId, visuals])

  const respondentsWithNotes = useMemo(() => {
    if (isMultiRespondent) return new Set<string>()
    if (editable) {
      return new Set(visuals.filter((v) => v.respondent.responseId).map((v) => v.respondent.linkId))
    }
    const set = new Set<string>()
    for (const v of visuals) {
      const hasAnyNote = v.respondent.answers.some((a) => a.professional?.note?.trim())
      if (hasAnyNote) set.add(v.respondent.linkId)
    }
    return set
  }, [visuals, editable, isMultiRespondent])

  const showSharedNoteColumn = isMultiRespondent && (editable || !!sharedNoteLinkId)

  if (visuals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
        Aguardando respostas
      </div>
    )
  }

  const scoreFormulas = data.respondents[0]?.scoreBreakdown ?? []

  return (
    <div className="space-y-3">
      {sectionGroups.map((group) => {
        const rows = group.children.flatMap(buildRowsForField)
        if (rows.length === 0) return null
        return (
          <div key={group.sectionFieldId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {group.sectionField && (
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">
                  {group.sectionField.label || 'Seção'}
                </h2>
                {group.sectionField.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{group.sectionField.description}</p>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500 uppercase tracking-wide w-[22%] min-w-[160px]">
                      Pergunta
                    </th>
                    {visuals.map((v) => (
                      <Fragment key={v.respondent.linkId}>
                        <th className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide">
                          <span
                            className="truncate block"
                            style={{ color: v.color.primary }}
                            title={v.respondent.respondentName ?? ''}
                          >
                            {v.respondent.respondentName?.split(' ')[0]?.toUpperCase() ?? '—'}
                            <span className="text-gray-400 font-normal ml-1">({v.label.toUpperCase()})</span>
                          </span>
                        </th>
                        {respondentsWithNotes.has(v.respondent.linkId) && (
                          <th className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-amber-700">
                            Observação clínica
                          </th>
                        )}
                      </Fragment>
                    ))}
                    {showSharedNoteColumn && (
                      <th className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-amber-700">
                        Observação clínica
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 last:border-b-0">
                      <td className="px-4 py-2.5 text-gray-700 align-top break-words">
                        {row.label}
                        {row.reverseScored && <span className="ml-1.5 text-xs text-gray-400">(reverso)</span>}
                      </td>
                      {visuals.map((v) => {
                        const cell = row.cellRender(v)
                        const noteValue = resolveNote(v.respondent.linkId, row.fieldId)
                        return (
                          <Fragment key={v.respondent.linkId}>
                            <td
                              className="px-3 py-2.5 align-top"
                              style={{ backgroundColor: v.color.cellTint }}
                            >
                              <CellContent cell={cell} color={v.color} />
                            </td>
                            {respondentsWithNotes.has(v.respondent.linkId) && (
                              <td className="px-3 py-2.5 align-top">
                                {row.showNoteCell ? (
                                  <NoteCell
                                    value={noteValue}
                                    editable={editable && !!v.respondent.responseId}
                                    onChange={(next) =>
                                      onNoteChange?.(v.respondent.linkId, row.fieldId, next)
                                    }
                                  />
                                ) : null}
                              </td>
                            )}
                          </Fragment>
                        )
                      })}
                      {showSharedNoteColumn && (
                        <td className="px-3 py-2.5 align-top">
                          {row.showNoteCell && sharedNoteLinkId ? (
                            <NoteCell
                              value={resolveNote(sharedNoteLinkId, row.fieldId)}
                              editable={sharedNoteEditable}
                              onChange={(next) =>
                                onNoteChange?.(sharedNoteLinkId, row.fieldId, next)
                              }
                            />
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {scoreFormulas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {scoreFormulas.map((firstScore, idx) => (
                  <tr key={firstScore.formulaId} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-xs text-gray-500 uppercase tracking-wide align-top w-[44%] min-w-[220px]">
                      {idx === 0 ? 'Pontuação' : firstScore.name}
                    </td>
                    {visuals.map((v) => (
                      <td
                        key={v.respondent.linkId}
                        className="px-3 py-3 align-top min-w-[140px]"
                        style={{ backgroundColor: v.color.cellTint }}
                      >
                        <ScoreCell score={v.respondent.scoreBreakdown[idx]} color={v.color} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
