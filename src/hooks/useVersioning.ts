import { useCallback, useState } from 'react'
import { Laudo, LaudoVersion, LAUDO_STATUS_LABELS } from '@/types'
import { getVersionHistory, saveVersion } from '@/lib/version-storage'

export function useVersioning(laudo: Laudo | null) {
  const [versions, setVersions] = useState<LaudoVersion[]>([])

  const refreshVersions = useCallback(() => {
    if (!laudo) return
    setVersions(getVersionHistory(laudo.id))
  }, [laudo])

  const createSnapshot = useCallback(
    (description: string) => {
      if (!laudo) return
      const version: LaudoVersion = {
        id: crypto.randomUUID(),
        laudoId: laudo.id,
        createdAt: new Date().toISOString(),
        status: laudo.status,
        description,
        patientName: laudo.patientName,
        blocks: JSON.parse(JSON.stringify(laudo.blocks)),
      }
      saveVersion(version)
      setVersions(getVersionHistory(laudo.id))
    },
    [laudo]
  )

  const createStatusChangeSnapshot = useCallback(
    (fromStatus: string) => {
      createSnapshot(`Status alterado de ${LAUDO_STATUS_LABELS[fromStatus as keyof typeof LAUDO_STATUS_LABELS] ?? fromStatus}`)
    },
    [createSnapshot]
  )

  const createExportSnapshot = useCallback(
    (format: string) => {
      createSnapshot(`Exportação ${format}`)
    },
    [createSnapshot]
  )

  const createManualSnapshot = useCallback(() => {
    createSnapshot('Versão salva manualmente')
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
