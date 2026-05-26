import { PaperclipIcon } from '@/components/icons'

interface AttachmentChipProps {
  onClick: (e: React.MouseEvent) => void
  title?: string
}

export default function AttachmentChip({
  onClick,
  title = 'Baixar anexo',
}: AttachmentChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-700 transition-colors"
    >
      <PaperclipIcon size={16} />
    </button>
  )
}
