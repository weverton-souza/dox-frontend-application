interface FloatingToolbarProps {
  onAddQuestion: () => void
  onAddSection: () => void
}

export default function FloatingToolbar({ onAddQuestion, onAddSection }: FloatingToolbarProps) {
  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <ToolbarButton
        onClick={onAddQuestion}
        title="Adicionar pergunta"
        icon={<PlusCircleIcon />}
      />
      <ToolbarButton
        onClick={onAddSection}
        title="Adicionar seção"
        icon={<SectionIcon />}
      />
    </div>
  )
}

function ToolbarButton({
  onClick,
  title,
  icon,
}: {
  onClick: () => void
  title: string
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2.5 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors border-b border-gray-100 last:border-b-0"
    >
      {icon}
    </button>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function SectionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}
