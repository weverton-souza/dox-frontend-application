import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  AiStatusResponse,
  AiUsageSummaryResponse,
  AiGenerationResponse,
  AiGenerationProgress,
  AiGenerationStatus,
  SectionProgressEvent,
  GenerateFullReportRequest,
  Block,
} from '@/types'
import {
  getAiStatus,
  getUsageSummary,
  generateSection as apiGenerateSection,
  regenerateSection as apiRegenerateSection,
  generateFullReport as apiGenerateFullReport,
} from '@/lib/api/ai-api'
import type { SectionInstruction } from '@/types'
import { buildQuantitativePayload, serializeBlocksForAi } from '@/lib/ai-context-builder'

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
    selectedSections?: SectionInstruction[],
    dataInstructions?: Record<string, string>,
    selectedDataBlockIds?: string[],
    includeCustomerData?: boolean,
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
      selectedSections?: SectionInstruction[],
      dataInstructions?: Record<string, string>,
      selectedDataBlockIds?: string[],
      includeCustomerData?: boolean,
    ) => {
      setGenerationStatus('loading')
      setError(null)

      const selectedBlocks = selectedDataBlockIds
        ? blocks.filter(b => (b.type !== 'score-table' && b.type !== 'chart') || selectedDataBlockIds.includes(b.id))
        : blocks
      const quantitativeData = buildQuantitativePayload(selectedBlocks)
      const quantitativeContext = serializeBlocksForAi(selectedBlocks)

      if (dataInstructions && selectedSections) {
        for (const [blockId, instruction] of Object.entries(dataInstructions)) {
          if (!instruction) continue
          const dataBlock = blocks.find(b => b.id === blockId)
          if (!dataBlock?.parentId) continue
          const parentBlock = blocks.find(b => b.id === dataBlock.parentId)
          if (!parentBlock) continue
          const parentTitle = parentBlock.type === 'info-box'
            ? (parentBlock.data as { label?: string }).label
            : (parentBlock.data as { title?: string }).title
          if (!parentTitle) continue
          const section = selectedSections.find(s => s.sectionTitle === parentTitle)
          if (section) {
            section.instruction = section.instruction
              ? `${section.instruction}. ${instruction}`
              : instruction
          }
        }
      }

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
        formResponseIds,
        quantitativeData,
        quantitativeContext: quantitativeContext || undefined,
        selectedSections,
        includeCustomerData: includeCustomerData !== false,
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

  const generateOrRegenerate = useCallback(
    async (
      reportId: string,
      sectionType: string,
      opts?: { formResponseId?: string; generationId?: string },
    ): Promise<AiGenerationResponse | null> => {
      setGenerationStatus('loading')
      setError(null)

      const generationId = opts?.generationId
      const isRegeneration = !!generationId

      try {
        const result = isRegeneration
          ? await apiRegenerateSection(reportId, { sectionType, generationId })
          : await apiGenerateSection(reportId, { sectionType, formResponseId: opts?.formResponseId })
        setGenerationStatus('success')
        refreshUsage()
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : (isRegeneration ? 'Erro ao regerar seção' : 'Erro ao gerar seção')
        setError(msg)
        setGenerationStatus('error')
        return null
      }
    },
    [refreshUsage],
  )

  const generateSection = useCallback(
    (reportId: string, sectionType: string, formResponseId?: string) =>
      generateOrRegenerate(reportId, sectionType, { formResponseId }),
    [generateOrRegenerate],
  )

  const regenerateSection = useCallback(
    (reportId: string, sectionType: string, generationId: string) =>
      generateOrRegenerate(reportId, sectionType, { generationId }),
    [generateOrRegenerate],
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
