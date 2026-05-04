import { useEffect, useRef, useState } from 'react'

interface SectionTabItem {
  id: string
  title: string
}

interface SectionTabsProps {
  sections: SectionTabItem[]
  activeId: string | null
  onActivate: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onAdd: () => void
}

export default function SectionTabs({
  sections,
  activeId,
  onActivate,
  onRename,
  onAdd,
}: SectionTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id)
    setDraftTitle(currentTitle)
  }

  const commitEdit = () => {
    if (editingId) {
      const trimmed = draftTitle.trim()
      onRename(editingId, trimmed || 'Seção sem título')
    }
    setEditingId(null)
    setDraftTitle('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraftTitle('')
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
      {sections.map((section, idx) => {
        const isActive = section.id === activeId
        const isEditing = editingId === section.id

        if (isEditing) {
          return (
            <div
              key={section.id}
              className="shrink-0 inline-flex items-center bg-white rounded-full border border-brand-500 shadow-sm pl-3 pr-2 py-1.5"
            >
              <input
                ref={inputRef}
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitEdit()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    cancelEdit()
                  }
                }}
                className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none min-w-[80px] max-w-[200px]"
              />
            </div>
          )
        }

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onActivate(section.id)}
            onDoubleClick={() => startEditing(section.id, section.title)}
            title="Duplo clique para renomear"
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span className={`text-[10px] font-semibold ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
              {idx + 1}
            </span>
            <span className="truncate max-w-[200px]">{section.title || 'Seção sem título'}</span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onAdd}
        title="Nova seção"
        className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-gray-500 hover:bg-gray-50 hover:text-brand-600 border border-dashed border-gray-300 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
