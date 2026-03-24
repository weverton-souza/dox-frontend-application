import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  AiStatusResponse,
  AiUsageSummaryResponse,
  AiGenerationResponse,
  AiGenerationProgress,
  AiGenerationStatus,
  SectionProgressEvent,
  GenerateFullReportRequest,
  AiGenerationRequest,
  Block,
} from '@/types'
import {
  getAiStatus,
  getUsageSummary,
  generateSection as apiGenerateSection,
  regenerateSection as apiRegenerateSection,
  generateFullReport as apiGenerateFullReport,
} from '@/lib/api/ai-api'
import { buildQuantitativePayload } from '@/lib/ai-context-builder'

interface UseAiGenerationReturn {
  aiStatus: AiStatusResponse | null
  isAvailable: boolean
  isGenerating: boolean
  generationStatus: AiGenerationStatus
  progress: AiGenerationProgress | null
  usageSummary: AiUsageSummaryResponse | null

  generateFullReport: (
    reportId: string,
    formResponseIds: string[],
    blocks: Block[],
    onBlockGenerated: (sectionType: string, text: string, generationId: string) => void,
    selectedSections?: string[],
  ) => void
  generateSection: (
    reportId: string,
    sectionType: string,
    formResponseId?: string,
  ) => Promise<AiGenerationResponse | null>
  regenerateSection: (
    reportId: string,
    sectionType: string,
    generationId: string,
  ) => Promise<AiGenerationResponse | null>
  cancelGeneration: () => void
  refreshUsage: () => Promise<void>
  refreshStatus: () => Promise<void>
  error: string | null
  clearError: () => void
}

export function useAiGeneration(): UseAiGenerationReturn {
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null)
  const [usageSummary, setUsageSummary] = useState<AiUsageSummaryResponse | null>(null)
  const [generationStatus, setGenerationStatus] = useState<AiGenerationStatus>('idle')
  const [progress, setProgress] = useState<AiGenerationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<{ abort: () => void } | null>(null)
  const statusLoadedRef = useRef(false)

  const isAvailable = aiStatus?.available === true
  const isGenerating = generationStatus === 'loading'

  useEffect(() => {
    if (statusLoadedRef.current) return
    statusLoadedRef.current = true
    getAiStatus()
      .then(status => {
        setAiStatus(status)
        if (status.available) {
          const now = new Date()
          getUsageSummary(now.getMonth() + 1, now.getFullYear())
            .then(setUsageSummary)
            .catch(() => {})
        }
      })
      .catch(() => setAiStatus({ available: false }))
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getAiStatus()
      setAiStatus(status)
    } catch {
      setAiStatus({ available: false })
    }
  }, [])

  const refreshUsage = useCallback(async () => {
    try {
      const now = new Date()
      const summary = await getUsageSummary(now.getMonth() + 1, now.getFullYear())
      setUsageSummary(summary)
    } catch {
      // silently fail
    }
  }, [])

  const generateFullReport = useCallback(
    (
      reportId: string,
      formResponseIds: string[],
      blocks: Block[],
      onBlockGenerated: (sectionType: string, text: string, generationId: string) => void,
      selectedSections?: string[],
    ) => {
      setGenerationStatus('loading')
      setError(null)

      const quantitativeData = buildQuantitativePayload(blocks)

      const newProgress: AiGenerationProgress = {
        currentSection: '',
        currentIndex: 0,
        total: 0,
        completedSections: new Map(),
        failedSections: new Map(),
        skippedSections: new Map(),
      }
      setProgress(newProgress)

      const request: GenerateFullReportRequest = {
        formResponseId: formResponseIds[0],
        formResponseIds,
        quantitativeData,
        selectedSections,
      }

      const handle = apiGenerateFullReport(reportId, request, {
        onSectionProgress: (event: SectionProgressEvent) => {
          setProgress(prev => {
            const updated: AiGenerationProgress = {
              currentSection: event.sectionType,
              currentIndex: event.index,
              total: event.total,
              completedSections: new Map(prev?.completedSections),
              failedSections: new Map(prev?.failedSections),
              skippedSections: new Map(prev?.skippedSections),
            }

            if (event.status === 'completed' && event.text && event.generationId) {
              updated.completedSections.set(event.sectionType, {
                text: event.text,
                generationId: event.generationId,
              })
              onBlockGenerated(event.sectionType, event.text, event.generationId)
            } else if (event.status === 'skipped') {
              updated.skippedSections.set(event.sectionType, event.message || 'Dados insuficientes')
            } else if (event.status === 'error') {
              updated.failedSections.set(event.sectionType, event.message || 'Erro')
            }

            return updated
          })
        },
        onComplete: () => {
          setGenerationStatus('success')
          refreshUsage()
        },
        onError: (err: Error) => {
          setError(err.message)
          setGenerationStatus('error')
        },
      })

      abortRef.current = handle
    },
    [refreshUsage],
  )

  const generateSection = useCallback(
    async (
      reportId: string,
      sectionType: string,
      formResponseId?: string,
    ): Promise<AiGenerationResponse | null> => {
      setGenerationStatus('loading')
      setError(null)

      try {
        const request: AiGenerationRequest = { sectionType, formResponseId }
        const result = await apiGenerateSection(reportId, request)
        setGenerationStatus('success')
        refreshUsage()
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao gerar seção'
        setError(msg)
        setGenerationStatus('error')
        return null
      }
    },
    [refreshUsage],
  )

  const regenerateSection = useCallback(
    async (
      reportId: string,
      sectionType: string,
      generationId: string,
    ): Promise<AiGenerationResponse | null> => {
      setGenerationStatus('loading')
      setError(null)

      try {
        const result = await apiRegenerateSection(reportId, { sectionType, generationId })
        setGenerationStatus('success')
        refreshUsage()
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao regerar seção'
        setError(msg)
        setGenerationStatus('error')
        return null
      }
    },
    [refreshUsage],
  )

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setGenerationStatus('idle')
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setGenerationStatus('idle')
  }, [])

  return {
    aiStatus,
    isAvailable,
    isGenerating,
    generationStatus,
    progress,
    usageSummary,
    generateFullReport,
    generateSection,
    regenerateSection,
    cancelGeneration,
    refreshUsage,
    refreshStatus,
    error,
    clearError,
  }
}
