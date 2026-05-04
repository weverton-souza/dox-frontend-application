import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SectionItem {
  id: string
  title: string
}

interface SectionSidebarProps {
  sections: SectionItem[]
  activeId: string | null
  onActivate: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

interface SectionRowProps {
  section: SectionItem
  index: number
  isActive: boolean
  isOnly: boolean
  onActivate: () => void
  onStartEdit: () => void
  onRemove: () => void
}

function SectionRow({ section, index, isActive, isOnly, onActivate, onStartEdit, onRemove }: SectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1 rounded-lg transition-colors ${
        isActive ? 'bg-brand-50' : 'hover:bg-gray-50'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="Arrastar para reordenar"
        className="shrink-0 flex items-center justify-center w-5 h-8 cursor-grab active:cursor-grabbing text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="8" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" />
          <circle cx="8" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" />
          <circle cx="8" cy="12" r="1.2" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onActivate}
        onDoubleClick={onStartEdit}
        title="Duplo clique para renomear"
        className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors min-w-0 ${
          isActive ? 'text-brand-700 font-medium' : 'text-gray-700'
        }`}
      >
        <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold ${
          isActive ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          {index + 1}
        </span>
        <span className="truncate">{section.title || 'Seção sem título'}</span>
      </button>

      {!isOnly && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          title="Excluir seção"
          className="shrink-0 mr-1 flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      )}
    </li>
  )
}

export default function SectionSidebar({
  sections,
  activeId,
  onActivate,
  onRename,
  onAdd,
  onRemove,
  onReorder,
}: SectionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const startEdit = (id: string, currentTitle: string) => {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = [...sections]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    onReorder(next.map((s) => s.id))
  }

  const sectionIds = sections.map((s) => s.id)

  return (
    <aside className="lg:w-56 lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2">
        <div className="px-2 py-1.5 mb-1">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Seções
          </h3>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <ul className="space-y-0.5">
              {sections.map((section, idx) => {
                const isEditing = editingId === section.id
                if (isEditing) {
                  return (
                    <li
                      key={section.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-brand-50 ring-1 ring-brand-300"
                    >
                      <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold bg-brand-500 text-white">
                        {idx + 1}
                      </span>
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
                        className="flex-1 min-w-0 text-sm text-brand-700 font-medium bg-transparent border-none outline-none"
                      />
                    </li>
                  )
                }
                return (
                  <SectionRow
                    key={section.id}
                    section={section}
                    index={idx}
                    isActive={section.id === activeId}
                    isOnly={sections.length === 1}
                    onActivate={() => onActivate(section.id)}
                    onStartEdit={() => startEdit(section.id, section.title)}
                    onRemove={() => onRemove(section.id)}
                  />
                )
              })}
            </ul>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={onAdd}
          className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:text-brand-600 hover:bg-gray-50 transition-colors"
        >
          <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full border border-dashed border-gray-300 text-gray-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          Nova seção
        </button>
      </div>
    </aside>
  )
}
