import { useEffect, useMemo, useState } from 'react'
import type { AdditionalEvaluator, FormField } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

export interface PrintRespondentOption {
  id: string
  label: string
}

export interface PrintConfirmPayload {
  selectedFieldIds: Set<string>
  respondentId: string | null
  evaluators: AdditionalEvaluator[]
}

interface FormPrintModalProps {
  isOpen: boolean
  onClose: () => void
  fields: FormField[]
  onConfirm: (payload: PrintConfirmPayload) => Promise<void> | void
  title?: string
  respondents?: PrintRespondentOption[]
  initialRespondentId?: string | null
  initialEvaluators?: AdditionalEvaluator[]
}

interface SectionGroup {
  header: FormField | null
  children: FormField[]
}

function buildGroups(fields: FormField[]): SectionGroup[] {
  const groups: SectionGroup[] = []
  let current: SectionGroup = { header: null, children: [] }
  groups.push(current)

  for (const f of [...fields].sort((a, b) => a.order - b.order)) {
    if (f.type === 'section-header') {
      current = { header: f, children: [] }
      groups.push(current)
    } else {
      current.children.push(f)
    }
  }

  return groups.filter((g) => g.header || g.children.length > 0)
}

export default function FormPrintModal({
  isOpen,
  onClose,
  fields,
  onConfirm,
  title,
  respondents,
  initialRespondentId,
  initialEvaluators,
}: FormPrintModalProps) {
  const groups = useMemo(() => buildGroups(fields), [fields])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [respondentId, setRespondentId] = useState<string | null>(null)
  const [evaluators, setEvaluators] = useState<AdditionalEvaluator[]>([])

  useEffect(() => {
    if (!isOpen) return
    const all = new Set<string>()
    fields.forEach((f) => all.add(f.id))
    setSelected(all)
    setRespondentId(initialRespondentId ?? respondents?.[0]?.id ?? null)
    setEvaluators(initialEvaluators ?? [])
  }, [isOpen, fields, initialRespondentId, initialEvaluators, respondents])

  const toggleField = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSection = (group: SectionGroup) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const headerSelected = group.header ? next.has(group.header.id) : false
      const allChildrenSelected = group.children.every((c) => next.has(c.id))
      const sectionFullySelected = group.header ? headerSelected && allChildrenSelected : allChildrenSelected
      if (sectionFullySelected) {
        if (group.header) next.delete(group.header.id)
        group.children.forEach((c) => next.delete(c.id))
      } else {
        if (group.header) next.add(group.header.id)
        group.children.forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  const totalSelected = useMemo(
    () => fields.filter((f) => f.type !== 'section-header' && selected.has(f.id)).length,
    [fields, selected],
  )

  const updateEvaluator = (index: number, patch: Partial<AdditionalEvaluator>) => {
    setEvaluators((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  const addEvaluator = () => {
    setEvaluators((prev) => [...prev, { name: '', council: '' }])
  }

  const removeEvaluator = (index: number) => {
    setEvaluators((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = async () => {
    setGenerating(true)
    try {
      await onConfirm({
        selectedFieldIds: selected,
        respondentId,
        evaluators,
      })
      onClose()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title ?? 'Imprimir formulário'} size="lg">
      <div className="p-5 space-y-4">
        {respondents && respondents.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Respondente
            </label>
            <Select
              value={respondentId ?? ''}
              onChange={(v) => setRespondentId(v)}
              options={respondents.map((r) => ({ value: r.id, label: r.label }))}
            />
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Perguntas
          </p>
          <div className="border border-gray-200 rounded-lg max-h-[320px] overflow-y-auto">
            {groups.map((group, idx) => {
              const headerSelected = group.header ? selected.has(group.header.id) : false
              const someChildSelected = group.children.some((c) => selected.has(c.id))
              const allChildrenSelected = group.children.every((c) => selected.has(c.id))
              const sectionFullySelected = group.header
                ? headerSelected && allChildrenSelected
                : allChildrenSelected
              const sectionPartial =
                !sectionFullySelected && (headerSelected || someChildSelected)

              return (
                <div
                  key={(group.header?.id ?? `g-${idx}`)}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={sectionFullySelected}
                      ref={(el) => {
                        if (el) el.indeterminate = sectionPartial
                      }}
                      onChange={() => toggleSection(group)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {group.header?.label || 'Sem seção'}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {group.children.length} {group.children.length === 1 ? 'pergunta' : 'perguntas'}
                    </span>
                  </label>

                  <ul className="bg-gray-50/40">
                    {group.children.map((field) => (
                      <li key={field.id}>
                        <label className="flex items-center gap-3 pl-10 pr-4 py-2 cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selected.has(field.id)}
                            onChange={() => toggleField(field.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-sm text-gray-700 truncate flex-1" title={field.label}>
                            {field.label || '(sem título)'}
                          </span>
                          {field.collectionMode === 'presencial' && (
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              Presencial
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Outros avaliadores
              <span className="ml-1 normal-case font-normal text-gray-400">(opcional)</span>
            </p>
          </div>

          {evaluators.length === 0 ? (
            <p className="text-xs text-gray-500 mb-2">
              Aparece no rodapé do `.docx`. Pode adicionar quantos quiser, ou deixar em branco para preencher à mão.
            </p>
          ) : (
            <div className="space-y-2 mb-2">
              {evaluators.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateEvaluator(i, { name: e.target.value })}
                    placeholder="Nome do avaliador"
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={row.council}
                    onChange={(e) => updateEvaluator(i, { council: e.target.value })}
                    placeholder="Conselho (ex: CRP 06/12345)"
                    className="w-56 text-sm bg-white border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeEvaluator(i)}
                    className="shrink-0 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remover avaliador"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addEvaluator}
            className="w-full border-2 border-dashed border-gray-300 rounded-md py-2 text-sm font-medium text-gray-500 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/30 transition-all"
          >
            + Adicionar avaliador
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {totalSelected} {totalSelected === 1 ? 'pergunta' : 'perguntas'} selecionada{totalSelected === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={totalSelected === 0 || generating}>
              {generating ? 'Gerando…' : 'Gerar .docx'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
