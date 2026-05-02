import { useState } from 'react'
import { SaveIcon, HistoryIcon, EyeIcon, TemplateIcon, SendIcon } from '@/components/icons'

interface ToolbarAction {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}

interface EditorFloatingToolbarProps {
  onSaveVersion: () => void
  onOpenVersionHistory: () => void
  onSaveAsTemplate: () => void
  onTogglePreview: () => void
  showPreview: boolean
  onToggleNumbering?: () => void
  numberingActive?: boolean
  onRequestResponses?: () => void
}

const NumberingIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </svg>
)

export default function EditorFloatingToolbar({
  onSaveVersion,
  onOpenVersionHistory,
  onSaveAsTemplate,
  onTogglePreview,
  showPreview,
  onToggleNumbering,
  numberingActive = false,
  onRequestResponses,
}: EditorFloatingToolbarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const actions: ToolbarAction[] = [
    {
      id: 'save-version',
      icon: <SaveIcon size={16} />,
      label: 'Salvar versão',
      onClick: onSaveVersion,
    },
    {
      id: 'version-history',
      icon: <HistoryIcon size={16} />,
      label: 'Histórico de versões',
      onClick: onOpenVersionHistory,
    },
    {
      id: 'save-template',
      icon: <TemplateIcon size={16} />,
      label: 'Salvar como template',
      onClick: onSaveAsTemplate,
    },
    ...(onToggleNumbering
      ? [{
          id: 'numbering',
          icon: <NumberingIcon size={16} />,
          label: numberingActive ? 'Remover numeração' : 'Numerar seções',
          onClick: onToggleNumbering,
          active: numberingActive,
        }]
      : []),
    ...(onRequestResponses
      ? [{
          id: 'request-responses',
          icon: <SendIcon size={16} />,
          label: 'Solicitar respostas',
          onClick: onRequestResponses,
        }]
      : []),
    {
      id: 'preview',
      icon: <EyeIcon size={16} />,
      label: 'Preview',
      onClick: onTogglePreview,
      active: showPreview,
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-1 rounded-2xl bg-white/80 backdrop-blur-xl p-1.5 shadow-lg border border-gray-200/60">
        {actions.map((action) => (
          <div key={action.id} className="relative">
            <button
              type="button"
              onClick={action.onClick}
              onMouseEnter={() => setHoveredId(action.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-150
                ${action.active
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }
              `}
              title={action.label}
            >
              {action.icon}
            </button>

            {/* Tooltip */}
            {hoveredId === action.id && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 pointer-events-none">
                <div className="whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
                  {action.label}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
