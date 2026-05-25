interface AttachmentPlaceholderProps {
  attachmentFileId?: string | null
}

export default function AttachmentPlaceholder({ attachmentFileId }: AttachmentPlaceholderProps) {
  return (
    <div className="border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-500 bg-gray-50 cursor-not-allowed">
      <div className="flex items-center justify-between">
        <span>📎 {attachmentFileId ? 'Arquivo anexado (ID interno)' : 'Anexar protocolo'}</span>
        <span className="text-[10px] uppercase tracking-wide bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
          Em breve
        </span>
      </div>
    </div>
  )
}
