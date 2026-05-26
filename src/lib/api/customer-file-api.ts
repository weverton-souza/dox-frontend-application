import type { AxiosProgressEvent } from 'axios'
import { api as apiClient } from './api-client'

export interface CustomerFile {
  id: string
  customerId: string
  fileName: string
  fileType: string | null
  category: string | null
  fileSizeBytes: number | null
  uploadedBy: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface CustomerFileDownloadUrl {
  url: string
  expiresInMinutes: number
}

export interface UploadOptions {
  category?: string
  onProgress?: (percent: number) => void
}

export async function uploadCustomerFile(
  customerId: string,
  file: File,
  options: UploadOptions = {},
): Promise<CustomerFile> {
  const formData = new FormData()
  formData.append('file', file)
  if (options.category) formData.append('category', options.category)

  const { data } = await apiClient.post<CustomerFile>(
    `/customers/${customerId}/files`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!options.onProgress || !event.total) return
        const percent = Math.round((event.loaded * 100) / event.total)
        options.onProgress(percent)
      },
    },
  )
  return data
}

export async function getCustomerFiles(customerId: string, category?: string): Promise<CustomerFile[]> {
  const params: Record<string, string> = {}
  if (category) params.category = category
  const { data } = await apiClient.get<CustomerFile[]>(`/customers/${customerId}/files`, { params })
  return data
}

export async function getCustomerFile(customerId: string, fileId: string): Promise<CustomerFile> {
  const { data } = await apiClient.get<CustomerFile>(`/customers/${customerId}/files/${fileId}`)
  return data
}

export async function getCustomerFileDownloadUrl(
  customerId: string,
  fileId: string,
): Promise<CustomerFileDownloadUrl> {
  const { data } = await apiClient.get<CustomerFileDownloadUrl>(
    `/customers/${customerId}/files/${fileId}/download-url`,
  )
  return data
}

export async function deleteCustomerFile(customerId: string, fileId: string): Promise<void> {
  await apiClient.delete(`/customers/${customerId}/files/${fileId}`)
}
