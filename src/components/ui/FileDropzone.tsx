import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface FileDropzoneProps {
  accept?: string
  maxSizeMb?: number
  uploading?: boolean
  progress?: number
  uploaded?: { fileName: string } | null
  error?: string | null
  disabled?: boolean
  onSelect: (file: File) => void
  onRemove?: () => void
  onDownload?: () => void
}

function formatBytes(bytes?: number | null): string {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileDropzone({
  accept = 'application/pdf,image/jpeg,image/png,image/webp',
  maxSizeMb = 10,
  uploading = false,
  progress = 0,
  uploaded = null,
  error = null,
  disabled = false,
  onSelect,
  onRemove,
  onDownload,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file: File | null | undefined) {
    if (!file) return
    if (file.size > maxSizeMb * 1024 * 1024) {
      onSelect(file)
      return
    }
    onSelect(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || uploading) return
    handleFile(e.dataTransfer.files?.[0])
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0])
    e.target.value = ''
  }

  if (uploaded) {
    return (
      <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-2 text-left min-w-0 flex-1 hover:text-brand-600 disabled:cursor-default"
          disabled={!onDownload}
        >
          <span className="text-base shrink-0">📎</span>
          <span className="truncate">{uploaded.fileName}</span>
        </button>
        {onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-500 hover:text-red-600 shrink-0"
          >
            Remover
          </button>
        )}
      </div>
    )
  }

  if (uploading) {
    return (
      <div className="border border-dashed border-brand-300 rounded-lg px-3 py-3 bg-brand-50">
        <div className="flex items-center justify-between text-xs text-brand-700 mb-2">
          <span>Enviando…</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-white rounded overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border border-dashed rounded-lg px-3 py-3 text-xs text-center transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : isDragging
              ? 'border-brand-400 bg-brand-50 text-brand-700 cursor-pointer'
              : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-brand-300 hover:bg-brand-50/40 cursor-pointer'
        }`}
      >
        <div>📎 Arraste ou clique pra selecionar</div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          PDF, JPG, PNG ou WEBP · até {maxSizeMb}MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export { formatBytes }
