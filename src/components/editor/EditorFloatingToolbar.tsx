import { useState } from 'react'
import { SaveIcon, HistoryIcon, EyeIcon } from '@/components/icons'

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
}

export default function EditorFloatingToolbar({
  onSaveVersion,
  onOpenVersionHistory,
  onSaveAsTemplate,
  onTogglePreview,
  showPreview,
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
      label: 'Histórico',
      onClick: onOpenVersionHistory,
    },
    {
      id: 'save-template',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      ),
      label: 'Template',
      onClick: onSaveAsTemplate,
    },
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
