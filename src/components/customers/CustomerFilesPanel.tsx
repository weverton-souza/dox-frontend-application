import { useCallback, useEffect, useState } from 'react'
import { useError } from '@/contexts/ErrorContext'
import {
  deleteCustomerFile,
  getCustomerFileDownloadUrl,
  getCustomerFiles,
  type CustomerFile,
} from '@/lib/api/customer-file-api'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import { formatBytes } from '@/components/ui/FileDropzone'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import CustomerFileUploadModal from './CustomerFileUploadModal'

const ASSESSMENT_CATEGORY = 'assessment_attachment'

const CATEGORY_OPTIONS = [
  { value: 'exam', label: 'Exame' },
  { value: 'referral', label: 'Encaminhamento' },
  { value: 'external_report', label: 'Laudo externo' },
  { value: 'prescription', label: 'Receita' },
  { value: 'other', label: 'Outros' },
] as const

const FILTER_OPTIONS = [{ value: '', label: 'Todas as categorias' }, ...CATEGORY_OPTIONS]

function labelFor(category: string | null | undefined): string {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.label ?? 'Outros'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return ''
  }
}

interface CustomerFilesPanelProps {
  customerId: string
  hideAddButton?: boolean
  refreshKey?: number
}

export default function CustomerFilesPanel({ customerId, hideAddButton = false, refreshKey = 0 }: CustomerFilesPanelProps) {
  const { showError } = useError()
  const [files, setFiles] = useState<CustomerFile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [uploadOpen, setUploadOpen] = useState(false)

  const performDelete = useCallback(
    async (id: string) => {
      try {
        await deleteCustomerFile(customerId, id)
        setFiles(prev => prev.filter(f => f.id !== id))
      } catch (err) {
        showError(err)
      }
    },
    [customerId, showError],
  )

  const { confirmId, requestDelete, confirmDelete, cancelDelete } = useConfirmDelete(performDelete)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const list = await getCustomerFiles(customerId)
      setFiles(list.filter(f => f.category !== ASSESSMENT_CATEGORY))
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }, [customerId, showError])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  async function handleDownload(file: CustomerFile) {
    try {
      const { url } = await getCustomerFileDownloadUrl(customerId, file.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showError(err)
    }
  }

  const visible = filter ? files.filter(f => f.category === filter) : files
  const targetFile = files.find(f => f.id === confirmId) ?? null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Arquivos clínicos</h2>
          <p className="text-sm text-gray-600">
            {files.length === 0
              ? 'Nenhum arquivo enviado'
              : `${files.length} ${files.length === 1 ? 'arquivo' : 'arquivos'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <div className="w-44">
              <Select value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
            </div>
          )}
          {!hideAddButton && (
            <Button onClick={() => setUploadOpen(true)}>+ Novo arquivo</Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-sm text-gray-500">
          {filter
            ? `Nenhum arquivo na categoria "${labelFor(filter)}"`
            : 'Nenhum arquivo enviado ainda. Clique em "Novo arquivo" pra começar.'}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
          {visible.map(f => (
            <li key={f.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
              <span className="text-base shrink-0">📎</span>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleDownload(f)}
                  className="text-sm font-medium text-gray-900 hover:text-brand-600 truncate block max-w-full text-left"
                >
                  {f.fileName}
                </button>
                <div className="text-xs text-gray-500 truncate">
                  {labelFor(f.category)} · {formatDate(f.createdAt)}
                  {f.fileSizeBytes ? ` · ${formatBytes(f.fileSizeBytes)}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => requestDelete(f.id)}
                className="text-xs text-gray-500 hover:text-red-600 shrink-0"
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}

      <CustomerFileUploadModal
        isOpen={uploadOpen}
        customerId={customerId}
        categories={CATEGORY_OPTIONS}
        onClose={() => setUploadOpen(false)}
        onUploaded={file => setFiles(prev => [file, ...prev])}
      />

      <ConfirmDeleteModal
        isOpen={!!confirmId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message={`Confirma a exclusão de "${targetFile?.fileName ?? ''}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  )
}
