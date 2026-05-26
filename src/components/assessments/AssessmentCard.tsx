import type { Assessment } from '@/types'
import {
  ClipboardListIcon,
  PaperclipIcon,
  TrashIcon,
} from '@/components/icons'

interface AssessmentCardProps {
  assessment: Assessment
  reapplications?: Assessment[]
  onEdit: () => void
  onDelete: () => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export default function AssessmentCard({
  assessment,
  reapplications = [],
  onEdit,
  onDelete,
}: AssessmentCardProps) {
  const entriesCount = assessment.entries.length
  const attachmentsCount = assessment.entries.filter((e) => e.attachmentFileId).length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit()
        }
      }}
      className="bg-white border border-gray-200 rounded-xl px-5 py-4 cursor-pointer hover:border-brand-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-brand-50 text-brand-600">
          <ClipboardListIcon size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{assessment.title}</h3>
              {assessment.category && (
                <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                  {assessment.category}
                </span>
              )}
              {reapplications.length > 0 && (
                <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs">
                  Reaplicações: {reapplications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {attachmentsCount > 0 && (
                <span
                  title={`${attachmentsCount} ${attachmentsCount === 1 ? 'anexo' : 'anexos'}`}
                  aria-label={`${attachmentsCount} ${attachmentsCount === 1 ? 'anexo' : 'anexos'}`}
                  className="inline-flex items-center gap-0.5 rounded-md p-1.5 text-gray-500"
                >
                  <PaperclipIcon size={16} />
                  {attachmentsCount > 1 && (
                    <span className="text-xs font-medium">{attachmentsCount}</span>
                  )}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                title="Excluir avaliação"
                aria-label="Excluir avaliação"
                className="rounded-md p-1.5 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatDate(assessment.appliedAt)} · {entriesCount} {entriesCount === 1 ? 'registro' : 'registros'}
          </div>
          {assessment.notes && (
            <div className="text-sm text-gray-600 italic mt-1.5">"{assessment.notes}"</div>
          )}
        </div>
      </div>
    </div>
  )
}
