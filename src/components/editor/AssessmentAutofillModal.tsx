import { useState } from 'react'
import type { AutofillMatch } from '@/lib/assessment-autofill'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { TableIcon, LineChartIcon } from '@/components/icons'

interface AssessmentAutofillModalProps {
  isOpen: boolean
  matches: AutofillMatch[]
  onConfirm: (selectedBlockIds: Set<string>) => void
  onSkip: () => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export default function AssessmentAutofillModal({
  isOpen,
  matches,
  onConfirm,
  onSkip,
}: AssessmentAutofillModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(matches.map((m) => m.blockId)))

  const toggle = (blockId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }

  const allSelected = selected.size === matches.length
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(matches.map((m) => m.blockId)))
  }

  return (
    <Modal isOpen={isOpen} onClose={onSkip} title="Preencher com dados das avaliações" size="md">
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600">
          Este paciente já tem tabelas e gráficos registrados em avaliações que aparecem neste
          relatório. Quer preencher automaticamente com os dados mais recentes?
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            {matches.length} {matches.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        </div>

        <ul className="space-y-2 max-h-[360px] overflow-y-auto">
          {matches.map((match) => {
            const isChecked = selected.has(match.blockId)
            return (
              <li key={match.blockId}>
                <label
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    isChecked ? 'border-brand-300 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(match.blockId)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/40"
                  />
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-gray-100 text-gray-600">
                    {match.blockType === 'score-table' ? <TableIcon size={16} /> : <LineChartIcon size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{match.blockTitle}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {match.sourceInstrument} · aplicado em {formatDate(match.sourceDate)}
                    </div>
                  </div>
                </label>
              </li>
            )
          })}
        </ul>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onSkip}>
            Pular
          </Button>
          <Button onClick={() => onConfirm(selected)} disabled={selected.size === 0}>
            Preencher {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
