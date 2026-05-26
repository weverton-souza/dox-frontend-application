import type { AssessmentEntry } from '@/types'
import { ASSESSMENT_ENTRY_TYPE_LABELS } from '@/types'
import AssessmentEntrySimple from './AssessmentEntrySimple'
import AssessmentEntryTable from './AssessmentEntryTable'
import AssessmentEntryChart from './AssessmentEntryChart'
import AttachmentField from './AttachmentField'

interface AssessmentEntryFormProps {
  entry: AssessmentEntry
  customerId: string
  index: number
  total: number
  hasInstrumentNameError?: boolean
  instrumentNameRef?: React.Ref<HTMLInputElement>
  onChange: (entry: AssessmentEntry) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const TYPE_BADGE_CLASSES: Record<AssessmentEntry['entryType'], string> = {
  simple: 'bg-gray-200 text-gray-700',
  table: 'bg-blue-100 text-blue-700',
  chart: 'bg-purple-100 text-purple-700',
}

const TYPE_ICONS: Record<AssessmentEntry['entryType'], string> = {
  simple: '📝',
  table: '📊',
  chart: '📈',
}

export default function AssessmentEntryForm({
  entry,
  customerId,
  index,
  total,
  hasInstrumentNameError = false,
  instrumentNameRef,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: AssessmentEntryFormProps) {
  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white ${
        hasInstrumentNameError ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'
      }`}
    >
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
          <span className="text-base">{TYPE_ICONS[entry.entryType]}</span>
          <span
            className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${TYPE_BADGE_CLASSES[entry.entryType]}`}
          >
            {ASSESSMENT_ENTRY_TYPE_LABELS[entry.entryType]}
          </span>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                ref={instrumentNameRef}
                type="text"
                value={entry.instrumentName}
                onChange={e => onChange({ ...entry, instrumentName: e.target.value })}
                placeholder="Nome do instrumento *"
                aria-invalid={hasInstrumentNameError}
                className={`bg-white border rounded px-2 py-1 pr-6 text-sm w-full focus:outline-none focus:ring-2 ${
                  hasInstrumentNameError
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-brand-500'
                }`}
              />
              {!entry.instrumentName.trim() && (
                <span
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 right-2 text-base ${
                    hasInstrumentNameError ? 'text-red-500' : 'text-red-400/70'
                  }`}
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </div>
            {hasInstrumentNameError && (
              <p className="text-[11px] text-red-600 mt-0.5 ml-0.5">Nome do instrumento é obrigatório</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed px-1"
            aria-label="Mover pra cima"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed px-1"
            aria-label="Mover pra baixo"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="hover:text-red-600 px-1 text-lg"
            aria-label="Remover registro"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {entry.entryType === 'simple' && (
          <AssessmentEntrySimple entry={entry} onChange={onChange} />
        )}
        {entry.entryType === 'table' && (
          <AssessmentEntryTable entry={entry} onChange={onChange} />
        )}
        {entry.entryType === 'chart' && (
          <AssessmentEntryChart entry={entry} onChange={onChange} />
        )}

        <div>
          <label className="block text-xs text-gray-600 mb-1">Observações clínicas deste registro</label>
          <textarea
            rows={2}
            value={entry.observations ?? ''}
            onChange={e => onChange({ ...entry, observations: e.target.value })}
            placeholder="Notas sobre a aplicação, comportamento, particularidades..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Anexo do protocolo</label>
          <AttachmentField
            customerId={customerId}
            attachmentFileId={entry.attachmentFileId}
            onChange={fileId => onChange({ ...entry, attachmentFileId: fileId })}
          />
        </div>
      </div>
    </div>
  )
}
