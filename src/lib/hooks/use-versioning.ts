import { useCallback, useOptimistic, useState, startTransition } from 'react'
import type { Report, ReportVersion } from '@/types'
import { REPORT_STATUS_LABELS } from '@/types'
import { getReportVersions, createReportVersion } from '@/lib/api/report-api'
import { getNowIso } from '@/lib/utils'

export function useVersioning(
  report: Report | null,
  onError?: (err: unknown) => void,
) {
  const [versions, setVersions] = useState<ReportVersion[]>([])
  const [optimisticVersions, addOptimisticVersion] = useOptimistic(
    versions,
    (current: ReportVersion[], optimistic: ReportVersion) => [optimistic, ...current],
  )

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

      let succeeded = false
      await new Promise<void>((resolve) => {
        startTransition(async () => {
          const optimisticVersion: ReportVersion = {
            id: `optimistic-${crypto.randomUUID()}`,
            reportId: report.id,
            customerName: report.customerName,
            status: report.status,
            description,
            blocks: report.blocks,
            createdAt: getNowIso(),
          }
          addOptimisticVersion(optimisticVersion)
          try {
            await createReportVersion(report.id, { description })
            const v = await getReportVersions(report.id)
            setVersions(v)
            succeeded = true
          } catch (err) {
            onError?.(err)
          } finally {
            resolve()
          }
        })
      })
      return succeeded
    },
    [report, versions, addOptimisticVersion, onError]
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
    versions: optimisticVersions,
    refreshVersions,
    createSnapshot,
    createStatusChangeSnapshot,
    createExportSnapshot,
    createManualSnapshot,
  }
}
