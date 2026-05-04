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
import Button from '@/components/ui/Button'

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
  isActive: boolean
  isOnly: boolean
  onActivate: () => void
  onStartEdit: () => void
  onRemove: () => void
}

function SectionRow({ section, isActive, isOnly, onActivate, onStartEdit, onRemove }: SectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const label = section.title || 'Seção sem título'

  return (
    <li ref={setNodeRef} style={style} className="relative group">
      <span
        aria-hidden="true"
        className="absolute w-2 h-2 rounded-full border border-gray-400 bg-white pointer-events-none z-10"
        style={{ left: '8px', top: '12px' }}
      />

      <button
        type="button"
        onClick={onActivate}
        onDoubleClick={onStartEdit}
        title={`${label} — duplo clique para renomear`}
        {...attributes}
        {...listeners}
        style={{ paddingLeft: '22px' }}
        className={`relative w-full text-left pr-8 py-1.5 rounded-md text-sm leading-snug transition-colors cursor-grab active:cursor-grabbing ${
          isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {label}
      </button>

      {!isOnly && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          title="Excluir seção"
          className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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
    <aside className="w-full lg:w-72 xl:w-80 lg:shrink-0 flex flex-col lg:self-start lg:sticky lg:top-28 lg:min-h-[400px] lg:max-h-[calc(100vh-8rem)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Seções
      </div>

      <nav className="flex-1 overflow-y-auto px-1 min-h-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1">
              {sections.map((section) => {
                const isEditing = editingId === section.id
                if (isEditing) {
                  return (
                    <li key={section.id} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute w-2 h-2 rounded-full border border-brand-500 bg-brand-500 pointer-events-none z-10"
                        style={{ left: '8px', top: '12px' }}
                      />
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
                        style={{ paddingLeft: '22px' }}
                        className="w-full pr-3 py-1.5 rounded-md text-sm leading-snug bg-brand-50 text-brand-700 font-medium border-none outline-none ring-1 ring-brand-300"
                      />
                    </li>
                  )
                }
                return (
                  <SectionRow
                    key={section.id}
                    section={section}
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
      </nav>

      <div className="px-2 py-3 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 hover:text-brand-700"
        >
          + Adicionar Seção
        </Button>
      </div>
    </aside>
  )
}
