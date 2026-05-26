import { useState } from 'react'
import { useError } from '@/contexts/ErrorContext'
import type { CustomerFile } from '@/lib/api/customer-file-api'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import FileDropzone from '@/components/ui/FileDropzone'

interface CustomerFileUploadModalProps {
  isOpen: boolean
  customerId: string
  categories: ReadonlyArray<{ value: string; label: string }>
  defaultCategory?: string
  onClose: () => void
  onUploaded: (file: CustomerFile) => void
}

export default function CustomerFileUploadModal({
  isOpen,
  customerId,
  categories,
  defaultCategory,
  onClose,
  onUploaded,
}: CustomerFileUploadModalProps) {
  const { showError } = useError()
  const [category, setCategory] = useState<string>(defaultCategory ?? categories[0].value)
  const { upload, uploading, progress, error, reset } = useFileUpload(customerId, { category })

  function handleClose() {
    if (uploading) return
    reset()
    onClose()
  }

  async function handleSelect(file: File) {
    try {
      const created = await upload(file)
      onUploaded(created)
      reset()
      onClose()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo arquivo" size="sm">
      <div className="space-y-4">
        <Select
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={[...categories]}
        />
        <FileDropzone
          uploading={uploading}
          progress={progress}
          error={error?.message ?? null}
          onSelect={handleSelect}
        />
      </div>
    </Modal>
  )
}
