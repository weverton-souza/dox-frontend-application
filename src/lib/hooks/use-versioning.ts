import { useCallback, useState } from 'react'
import type { Report, ReportVersion } from '@/types'
import { REPORT_STATUS_LABELS } from '@/types'
import { getReportVersions, createReportVersion } from '@/lib/api/report-api'

export function useVersioning(
  report: Report | null,
  onError?: (err: unknown) => void,
) {
  const [versions, setVersions] = useState<ReportVersion[]>([])

  const refreshVersions = useCallback(async () => {
    if (!report) return
    try {
      const v = await getReportVersions(report.id)
      setVersions(v)
    } catch (err) {
      onError?.(err)
    }
  }, [report, onError])

  const createSnapshot = useCallback(
    async (description: string, skipDuplicateCheck = false): Promise<boolean> => {
      if (!report) return false

      if (!skipDuplicateCheck && versions.length > 0) {
        const latestVersion = versions[0]
        const currentBlocksJson = JSON.stringify(report.blocks)
        const latestBlocksJson = JSON.stringify(latestVersion.blocks)
        if (currentBlocksJson === latestBlocksJson) {
          return false
        }
      }

      try {
        await createReportVersion(report.id, { description })
        const v = await getReportVersions(report.id)
        setVersions(v)
        return true
      } catch (err) {
        onError?.(err)
        return false
      }
    },
    [report, versions, onError]
  )

  const createStatusChangeSnapshot = useCallback(
    (fromStatus: string) => {
      createSnapshot(`Status alterado de ${REPORT_STATUS_LABELS[fromStatus as keyof typeof REPORT_STATUS_LABELS] ?? fromStatus}`)
    },
    [createSnapshot]
  )

  const createExportSnapshot = useCallback(
    (format: string) => {
      createSnapshot(`Exportação ${format}`)
    },
    [createSnapshot]
  )

  const createManualSnapshot = useCallback(async (): Promise<boolean> => {
    const created = await createSnapshot('Versão salva manualmente')
    return created
  }, [createSnapshot])

  return {
    versions,
    refreshVersions,
    createSnapshot,
    createStatusChangeSnapshot,
    createExportSnapshot,
    createManualSnapshot,
  }
}
