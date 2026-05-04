import { useMemo, useState } from 'react'
import type { FormField } from '@/types'

interface CollectionModeNoticeProps {
  fields: FormField[]
}

export default function CollectionModeNotice({ fields }: CollectionModeNoticeProps) {
  const [expanded, setExpanded] = useState(false)

  const { online, presencial } = useMemo(() => {
    const counted = fields.filter((f) => f.type !== 'section-header')
    return {
      online: counted.filter((f) => (f.collectionMode ?? 'online') === 'online'),
      presencial: counted.filter((f) => f.collectionMode === 'presencial'),
    }
  }, [fields])

  if (online.length === 0 && presencial.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
      <div className="flex items-start gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="flex-1 leading-relaxed">
          <p>
            <strong>{online.length}</strong> {online.length === 1 ? 'pergunta online' : 'perguntas online'} {online.length === 1 ? 'será enviada' : 'serão enviadas'} ao cliente.
            {presencial.length > 0 && (
              <>
                {' '}
                <strong>{presencial.length}</strong> {presencial.length === 1 ? 'pergunta presencial fica reservada' : 'perguntas presenciais ficam reservadas'} pra coleta na consulta.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs font-medium text-amber-800 underline hover:text-amber-900"
          >
            {expanded ? 'Ocultar perguntas' : 'Revisar perguntas'}
          </button>
        </div>
      </div>

      {expanded && (
        <ul className="mt-2 pl-6 space-y-1 max-h-48 overflow-y-auto">
          {[...online, ...presencial].map((f) => (
            <li key={f.id} className="flex items-start gap-2">
              <span
                className={`shrink-0 mt-0.5 inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-1.5 py-px rounded-full ${
                  f.collectionMode === 'presencial'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-white text-gray-600 border border-amber-200'
                }`}
              >
                {f.collectionMode === 'presencial' ? 'Presencial' : 'Online'}
              </span>
              <span className="text-amber-900/90 truncate">
                {f.label || '(sem título)'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
