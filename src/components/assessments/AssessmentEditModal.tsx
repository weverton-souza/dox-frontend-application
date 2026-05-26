import { useState, useEffect, useRef } from 'react'
import type {
  Assessment,
  AssessmentEntry,
  AssessmentEntryType,
  AssessmentRequestPayload,
  ChartData,
  ChartTemplate,
  ScoreTableData,
  ScoreTableTemplate,
} from '@/types'
import {
  createChartFromTemplate,
  createEmptyAssessmentEntry,
  createEmptyChartData,
  createEmptyScoreTableData,
  createScoreTableFromTemplate,
} from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import DatePicker from '@/components/ui/DatePicker'
import { useError } from '@/contexts/ErrorContext'
import { createAssessment, updateAssessment } from '@/lib/api/assessment-api'
import { getChartTemplates, getScoreTableTemplates } from '@/lib/api/template-api'
import ScoreTableTemplatePicker from '@/components/editor/ScoreTableTemplatePicker'
import ChartTemplatePicker from '@/components/editor/ChartTemplatePicker'
import AssessmentEntryForm from './AssessmentEntryForm'

interface AssessmentEditModalProps {
  isOpen: boolean
  customerId: string
  customerName: string
  existing?: Assessment | null
  previousAssessments?: Assessment[]
  onClose: () => void
  onSaved: (assessment: Assessment) => void
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export default function AssessmentEditModal({
  isOpen,
  customerId,
  customerName,
  existing,
  previousAssessments = [],
  onClose,
  onSaved,
}: AssessmentEditModalProps) {
  const { showError, showWarning } = useError()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [appliedAt, setAppliedAt] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [parentAssessmentId, setParentAssessmentId] = useState<string | null>(null)
  const [isReapplication, setIsReapplication] = useState(false)
  const [entries, setEntries] = useState<AssessmentEntry[]>([])
  const [declarationAccepted, setDeclarationAccepted] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{
    title: boolean
    appliedAt: boolean
    entriesEmpty: boolean
    declaration: boolean
    instruments: Set<number>
    entryBodies: Map<number, string>
  }>({
    title: false,
    appliedAt: false,
    entriesEmpty: false,
    declaration: false,
    instruments: new Set(),
    entryBodies: new Map(),
  })
  const instrumentInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const titleRef = useRef<HTMLInputElement | null>(null)
  const [scoreTableTemplates, setScoreTableTemplates] = useState<ScoreTableTemplate[]>([])
  const [chartTemplates, setChartTemplates] = useState<ChartTemplate[]>([])
  const [pendingPicker, setPendingPicker] = useState<'table' | 'chart' | null>(null)

  const resetErrors = () => setErrors({
    title: false,
    appliedAt: false,
    entriesEmpty: false,
    declaration: false,
    instruments: new Set(),
    entryBodies: new Map(),
  })

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    Promise.all([getScoreTableTemplates(), getChartTemplates()])
      .then(([tables, charts]) => {
        if (cancelled) return
        setScoreTableTemplates(tables)
        setChartTemplates(charts)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    resetErrors()
    if (existing) {
      setTitle(existing.title)
      setCategory(existing.category ?? '')
      setAppliedAt(existing.appliedAt)
      setNotes(existing.notes ?? '')
      setParentAssessmentId(existing.parentAssessmentId ?? null)
      setIsReapplication(existing.parentAssessmentId != null)
      setEntries(existing.entries)
      setDeclarationAccepted(true)
    } else {
      setTitle('')
      setCategory('')
      setAppliedAt(todayISO())
      setNotes('')
      setParentAssessmentId(null)
      setIsReapplication(false)
      setEntries([])
      setDeclarationAccepted(false)
    }
  }, [isOpen, existing])

  const appendEntry = (entry: AssessmentEntry) => {
    setEntries(prev => [...prev, { ...entry, orderIndex: prev.length }])
    setErrors(p => ({ ...p, entriesEmpty: false }))
  }

  const startAddEntry = (entryType: AssessmentEntryType) => {
    setShowTypeDropdown(false)
    if (entryType === 'simple') {
      appendEntry(createEmptyAssessmentEntry('simple'))
      return
    }
    setPendingPicker(entryType)
  }

  const addEntryWithBlock = (
    entryType: 'table' | 'chart',
    block: ScoreTableData | ChartData,
    suggestedName: string,
  ) => {
    appendEntry({
      ...createEmptyAssessmentEntry(entryType),
      block,
      instrumentName: suggestedName,
    })
    setPendingPicker(null)
  }

  const handleSelectScoreTemplate = (templateId: string) => {
    const template = scoreTableTemplates.find(t => t.id === templateId)
    if (!template) {
      setPendingPicker(null)
      return
    }
    addEntryWithBlock('table', createScoreTableFromTemplate(template), template.instrumentName ?? template.name)
  }

  const handleSelectChartTemplate = (templateId: string) => {
    const template = chartTemplates.find(t => t.id === templateId)
    if (!template) {
      setPendingPicker(null)
      return
    }
    addEntryWithBlock('chart', createChartFromTemplate(template), template.instrumentName ?? template.name)
  }

  const handleSelectEmptyTable = () => {
    addEntryWithBlock('table', createEmptyScoreTableData(), '')
  }

  const handleSelectEmptyChart = () => {
    addEntryWithBlock('chart', createEmptyChartData(), '')
  }

  const updateEntry = (idx: number, entry: AssessmentEntry) => {
    setEntries(prev => prev.map((e, i) => (i === idx ? entry : e)))
    setErrors(prev => {
      const nextInstruments = new Set(prev.instruments)
      const nextBodies = new Map(prev.entryBodies)
      if (entry.instrumentName.trim()) nextInstruments.delete(idx)
      const hasBody =
        entry.entryType === 'simple'
          ? entry.scores.length > 0 || !!entry.observations?.trim()
          : !!entry.block
      if (hasBody) nextBodies.delete(idx)
      return { ...prev, instruments: nextInstruments, entryBodies: nextBodies }
    })
  }

  const removeEntry = (idx: number) => {
    setEntries(prev => prev.filter((_, i) => i !== idx))
  }

  const moveEntry = (idx: number, direction: -1 | 1) => {
    setEntries(prev => {
      const next = [...prev]
      const target = idx + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const validate = () => {
    const instruments = new Set<number>()
    const entryBodies = new Map<number, string>()
    entries.forEach((entry, idx) => {
      if (!entry.instrumentName.trim()) instruments.add(idx)
      if (entry.entryType === 'simple' && entry.scores.length === 0 && !entry.observations?.trim()) {
        entryBodies.set(idx, 'Adicione ao menos um escore ou observação')
      }
      if ((entry.entryType === 'table' || entry.entryType === 'chart') && !entry.block) {
        entryBodies.set(idx, `Configure o bloco ${entry.entryType === 'table' ? 'tabela' : 'gráfico'}`)
      }
    })

    const next = {
      title: !title.trim(),
      appliedAt: !appliedAt,
      entriesEmpty: entries.length === 0,
      declaration: !declarationAccepted,
      instruments,
      entryBodies,
    }
    const hasError =
      next.title ||
      next.appliedAt ||
      next.entriesEmpty ||
      next.declaration ||
      next.instruments.size > 0 ||
      next.entryBodies.size > 0

    if (!hasError) return null

    const messages: string[] = []
    if (next.title) messages.push('Título')
    if (next.appliedAt) messages.push('Data')
    if (next.entriesEmpty) messages.push('Adicione ao menos 1 registro')
    if (next.instruments.size > 0) {
      messages.push(
        next.instruments.size === 1
          ? '1 registro sem nome de instrumento'
          : `${next.instruments.size} registros sem nome de instrumento`,
      )
    }
    if (next.entryBodies.size > 0) {
      messages.push(
        next.entryBodies.size === 1
          ? '1 registro precisa de conteúdo'
          : `${next.entryBodies.size} registros precisam de conteúdo`,
      )
    }
    if (next.declaration) messages.push('Aceite a declaração no rodapé')

    return { state: next, message: messages.join(' · ') }
  }

  const scrollToFirstError = (state: typeof errors) => {
    if (state.title) {
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => titleRef.current?.focus(), 300)
      return
    }
    if (state.instruments.size > 0) {
      const firstIdx = Math.min(...state.instruments)
      const input = instrumentInputRefs.current[firstIdx]
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => input.focus(), 300)
      }
    }
  }

  const handleSave = async () => {
    const result = validate()
    if (result) {
      setErrors(result.state)
      showWarning('Verifique os campos destacados', result.message)
      scrollToFirstError(result.state)
      return
    }
    resetErrors()

    const payload: AssessmentRequestPayload = {
      title: title.trim(),
      category: category.trim() || null,
      appliedAt,
      appointmentId: null,
      parentAssessmentId: isReapplication ? parentAssessmentId : null,
      notes: notes.trim() || null,
      entries: entries.map((e, idx) => ({ ...e, orderIndex: idx })),
    }

    setSaving(true)
    try {
      const saved = existing
        ? await updateAssessment(customerId, existing.id, payload)
        : await createAssessment(customerId, payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existing ? 'Editar avaliação' : 'Nova avaliação'}
      size="2xl"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <label
            className={`flex items-start gap-2 text-xs flex-1 px-2 py-1 rounded ${
              errors.declaration ? 'bg-red-50 ring-1 ring-red-300 text-red-700' : 'text-gray-700'
            }`}
          >
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={e => {
                setDeclarationAccepted(e.target.checked)
                if (e.target.checked && errors.declaration) setErrors(p => ({ ...p, declaration: false }))
              }}
              className="mt-0.5"
            />
            <span>
              {errors.declaration && <strong>⚠ </strong>}
              Declaro estar habilitada(o) a aplicar os instrumentos desta avaliação e que os resultados
              registrados são de minha responsabilidade profissional.
            </span>
          </label>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar avaliação'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-xs text-gray-500">
          {customerName} · {existing ? 'editando registro existente' : 'novo registro'}
        </p>

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Dados da avaliação
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                ref={titleRef}
                value={title}
                onChange={e => {
                  setTitle(e.target.value)
                  if (e.target.value.trim() && errors.title) setErrors(p => ({ ...p, title: false }))
                }}
                placeholder="Ex.: Bateria neuropsicológica completa"
                error={errors.title ? 'Título é obrigatório' : undefined}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Categoria</label>
              <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex.: Neuropsicologia" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Data <span className="text-red-500">*</span>
              </label>
              <div className={errors.appliedAt ? 'ring-2 ring-red-300 rounded-xl' : ''}>
                <DatePicker
                  value={appliedAt}
                  onChange={v => {
                    setAppliedAt(v)
                    if (v && errors.appliedAt) setErrors(p => ({ ...p, appliedAt: false }))
                  }}
                />
              </div>
              {errors.appliedAt && (
                <p className="text-red-600 text-xs mt-1">Data é obrigatória</p>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Observações gerais</label>
            <TextArea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas sobre o contexto da sessão..."
            />
          </div>

          <div className="bg-gray-50 rounded p-3 text-xs">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={isReapplication}
                onChange={e => {
                  setIsReapplication(e.target.checked)
                  if (!e.target.checked) setParentAssessmentId(null)
                }}
              />
              <span>
                Esta avaliação é uma <strong>reaplicação</strong> de outra anterior
              </span>
            </label>
            {isReapplication && (
              <div className="mt-2">
                <select
                  value={parentAssessmentId ?? ''}
                  onChange={e => setParentAssessmentId(e.target.value || null)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— Selecione a avaliação original —</option>
                  {previousAssessments
                    .filter(a => a.id !== existing?.id)
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title} · {a.appliedAt}
                      </option>
                    ))}
                </select>
                {previousAssessments.length === 0 && (
                  <p className="text-gray-500 mt-1">Nenhuma avaliação anterior disponível pra este cliente.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Registros desta avaliação
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Cada registro é 1 teste · simples, tabela ou gráfico
              </p>
            </div>
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setShowTypeDropdown(v => !v)}
              >
                + Adicionar registro ▾
              </Button>
              {showTypeDropdown && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-56 z-10">
                  <button
                    type="button"
                    onClick={() => startAddEntry('simple')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-start gap-2"
                  >
                    <span className="text-base">📝</span>
                    <div>
                      <div className="font-medium">Simples</div>
                      <div className="text-[10px] text-gray-500">Escores + observação clínica</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => startAddEntry('table')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-start gap-2"
                  >
                    <span className="text-base">📊</span>
                    <div>
                      <div className="font-medium">Tabela</div>
                      <div className="text-[10px] text-gray-500">Componente do laudo</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => startAddEntry('chart')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-start gap-2"
                  >
                    <span className="text-base">📈</span>
                    <div>
                      <div className="font-medium">Gráfico</div>
                      <div className="text-[10px] text-gray-500">Componente do laudo</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {entries.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center text-sm ${
                errors.entriesEmpty
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-300 text-gray-500'
              }`}
            >
              {errors.entriesEmpty
                ? '⚠ Adicione ao menos 1 registro pra salvar'
                : 'Nenhum registro. Use "+ Adicionar registro" pra começar.'}
            </div>
          )}

          <div className="space-y-3">
            {entries.map((entry, idx) => (
              <div key={entry.id ?? idx}>
                <AssessmentEntryForm
                  entry={entry}
                  index={idx}
                  total={entries.length}
                  hasInstrumentNameError={errors.instruments.has(idx)}
                  instrumentNameRef={el => { instrumentInputRefs.current[idx] = el }}
                  onChange={e => updateEntry(idx, e)}
                  onRemove={() => removeEntry(idx)}
                  onMoveUp={() => moveEntry(idx, -1)}
                  onMoveDown={() => moveEntry(idx, 1)}
                />
                {errors.entryBodies.get(idx) && (
                  <p className="text-red-600 text-xs mt-1 ml-2">⚠ {errors.entryBodies.get(idx)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={pendingPicker !== null}
        onClose={() => setPendingPicker(null)}
        title="Adicionar Bloco"
        size="md"
      >
        {pendingPicker === 'table' && (
          <ScoreTableTemplatePicker
            onSelectTemplate={handleSelectScoreTemplate}
            onSelectEmpty={handleSelectEmptyTable}
            onBack={() => setPendingPicker(null)}
          />
        )}
        {pendingPicker === 'chart' && (
          <ChartTemplatePicker
            onSelectTemplate={handleSelectChartTemplate}
            onSelectEmpty={handleSelectEmptyChart}
            onBack={() => setPendingPicker(null)}
          />
        )}
      </Modal>
    </Modal>
  )
}
