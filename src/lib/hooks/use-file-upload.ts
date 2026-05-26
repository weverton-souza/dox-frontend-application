import { useCallback, useState } from 'react'
import { uploadCustomerFile, type CustomerFile } from '@/lib/api/customer-file-api'

export interface UseFileUploadOptions {
  category?: string
}

export interface UseFileUploadResult {
  upload: (file: File) => Promise<CustomerFile>
  uploading: boolean
  progress: number
  error: Error | null
  reset: () => void
}

export function useFileUpload(customerId: string, options: UseFileUploadOptions = {}): UseFileUploadResult {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const upload = useCallback(
    async (file: File): Promise<CustomerFile> => {
      setUploading(true)
      setProgress(0)
      setError(null)
      try {
        const result = await uploadCustomerFile(customerId, file, {
          category: options.category,
          onProgress: setProgress,
        })
        return result
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Falha no upload')
        setError(e)
        throw e
      } finally {
        setUploading(false)
      }
    },
    [customerId, options.category],
  )

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return { upload, uploading, progress, error, reset }
}
