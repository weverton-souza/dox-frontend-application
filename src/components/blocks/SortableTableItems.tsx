import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripDotsIcon } from '@/components/icons'

export function SortableRow({ id, rowIndex, children }: { id: string; rowIndex: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
    >
      <td
        className="w-10 px-1 py-1 text-center text-[10px] font-semibold text-gray-400 bg-gray-50 border-r border-gray-200 select-none cursor-grab active:cursor-grabbing"
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center justify-center gap-0.5">
          <GripDotsIcon size={10} />
          <span>{rowIndex + 1}</span>
        </div>
      </td>
      {children}
    </tr>
  )
}


export function SortableTh({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <th ref={setNodeRef} style={style} className={className} {...attributes}>
      <div className="flex items-center gap-1">
        <div
          className="shrink-0 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/70 transition-colors"
          {...listeners}
        >
          <GripDotsIcon size={10} />
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </th>
  )
}
