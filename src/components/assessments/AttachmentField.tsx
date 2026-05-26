import { useEffect, useState } from 'react'
import {
  deleteCustomerFile,
  getCustomerFile,
  getCustomerFileDownloadUrl,
  type CustomerFile,
} from '@/lib/api/customer-file-api'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { useError } from '@/contexts/ErrorContext'
import FileDropzone from '@/components/ui/FileDropzone'

interface AttachmentFieldProps {
  customerId: string
  attachmentFileId?: string | null
  category?: string
  disabled?: boolean
  onChange: (fileId: string | null) => void
}

export default function AttachmentField({
  customerId,
  attachmentFileId,
  category = 'assessment_attachment',
  disabled = false,
  onChange,
}: AttachmentFieldProps) {
  const { showError } = useError()
  const { upload, uploading, progress, error } = useFileUpload(customerId, { category })
  const [file, setFile] = useState<CustomerFile | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(false)

  useEffect(() => {
    if (!attachmentFileId) {
      setFile(null)
      return
    }
    if (file?.id === attachmentFileId) return
    setLoadingMeta(true)
    getCustomerFile(customerId, attachmentFileId)
      .then(setFile)
      .catch(() => setFile(null))
      .finally(() => setLoadingMeta(false))
  }, [attachmentFileId, customerId, file?.id])

  async function handleSelect(selected: File) {
    try {
      const result = await upload(selected)
      setFile(result)
      onChange(result.id)
    } catch (err) {
      showError(err)
    }
  }

  async function handleDownload() {
    if (!file) return
    try {
      const { url } = await getCustomerFileDownloadUrl(customerId, file.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showError(err)
    }
  }

  async function handleRemove() {
    if (!file) return
    try {
      await deleteCustomerFile(customerId, file.id)
      setFile(null)
      onChange(null)
    } catch (err) {
      showError(err)
    }
  }

  if (loadingMeta) {
    return (
      <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-xs text-gray-500">
        Carregando anexo…
      </div>
    )
  }

  return (
    <FileDropzone
      uploading={uploading}
      progress={progress}
      uploaded={file ? { fileName: file.fileName } : null}
      error={error?.message ?? null}
      disabled={disabled}
      onSelect={handleSelect}
      onDownload={handleDownload}
      onRemove={handleRemove}
    />
  )
}
