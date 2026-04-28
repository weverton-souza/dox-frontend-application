import type { Report } from '@/types'

export interface ReportEditability {
  canEdit: boolean
  canUseAi: boolean
  canChangeStatus: boolean
  reasonText: string | null
}

export function useReportEditability(report: Report | null): ReportEditability {
  if (!report) {
    return { canEdit: false, canUseAi: false, canChangeStatus: false, reasonText: null }
  }
  const isFinalized = report.status === 'finalizado'
  return {
    canEdit: !isFinalized,
    canUseAi: !isFinalized,
    canChangeStatus: !isFinalized,
    reasonText: isFinalized ? 'Relatório finalizado, somente leitura' : null,
  }
}
