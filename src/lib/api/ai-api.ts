import type {
  AiGenerationRequest,
  AiGenerationResponse,
  AiGenerationSource,
  AiRegenerationRequest,
  AiQuotaResponse,
  AiStatusResponse,
  AiUsageSummaryResponse,
  AiUsageDetailResponse,
  GenerateFullReportRequest,
  SectionProgressEvent,
  ReviewTextRequest,
  ReviewTextResponse,
} from '@/types'
import { api, API_BASE_URL, getAccessToken, refreshTokens } from '@/lib/api/api-client'

// ========== Single Section (Flow 2) ==========

export async function generateSection(
  reportId: string,
  request: AiGenerationRequest,
): Promise<AiGenerationResponse> {
  const { data } = await api.post<AiGenerationResponse>(
    `/reports/${reportId}/generate-section`,
    request,
  )
  return data
}

export async function regenerateSection(
  reportId: string,
  request: AiRegenerationRequest,
): Promise<AiGenerationResponse> {
  const { data } = await api.post<AiGenerationResponse>(
    `/reports/${reportId}/regenerate-section`,
    request,
  )
  return data
}

// ========== Full Report Generation (Flow 1 — SSE) ==========

export interface FullReportCallbacks {
  onSectionProgress: (event: SectionProgressEvent) => void
  onComplete: (event: SectionProgressEvent) => void
  onError: (error: Error) => void
}

export function generateFullReport(
  reportId: string,
  request: GenerateFullReportRequest,
  callbacks: FullReportCallbacks,
): { abort: () => void } {
  const controller = new AbortController()

  const doFetch = async (token: string | null) => {
    return fetch(`${API_BASE_URL}/reports/${reportId}/generate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
  }

  const run = async () => {
    try {
      let token = getAccessToken()
      let response = await doFetch(token)

      // Se token expirou, tenta refresh e retenta uma vez
      if (response.status === 401 || response.status === 403) {
        const refreshResult = await refreshTokens()
        if (refreshResult) {
          token = refreshResult.accessToken
          response = await doFetch(token)
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Sem suporte a streaming')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventName = ''
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            const jsonStr = line.slice(5).trim()
            if (!jsonStr) continue

            try {
              const event = JSON.parse(jsonStr) as SectionProgressEvent

              if (eventName === 'generation-complete' || event.status === 'done') {
                callbacks.onComplete(event)
              } else if (eventName === 'error') {
                callbacks.onError(new Error(event.message || 'Erro na geração'))
              } else {
                callbacks.onSectionProgress(event)
              }
            } catch {
              // ignore malformed SSE data
            }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      callbacks.onError(e instanceof Error ? e : new Error('Erro desconhecido'))
    }
  }

  run()

  return {
    abort: () => controller.abort(),
  }
}

// ========== Text Review ==========

export async function reviewText(
  reportId: string,
  request: ReviewTextRequest,
): Promise<ReviewTextResponse> {
  const { data } = await api.post<ReviewTextResponse>(
    `/reports/${reportId}/review-text`,
    request,
  )
  return data
}

// ========== Generation Sources ==========

export async function getGenerationSources(reportId: string): Promise<AiGenerationSource[]> {
  const { data } = await api.get<AiGenerationSource[]>(`/reports/${reportId}/generation-sources`)
  return data
}

// ========== Usage & Quota ==========

export async function getAiStatus(): Promise<AiStatusResponse> {
  const { data } = await api.get<AiStatusResponse>('/ai/status')
  return data
}

export async function getUsageSummary(month: number, year: number): Promise<AiUsageSummaryResponse> {
  const { data } = await api.get<AiUsageSummaryResponse>(
    `/ai/usage/summary?month=${month}&year=${year}`,
  )
  return data
}

export async function getUsageHistory(
  month: number,
  year: number,
): Promise<AiUsageDetailResponse[]> {
  const { data } = await api.get<AiUsageDetailResponse[]>(
    `/ai/usage/history?month=${month}&year=${year}`,
  )
  return data
}

export async function getUsageByReport(reportId: string): Promise<AiUsageDetailResponse[]> {
  const { data } = await api.get<AiUsageDetailResponse[]>(`/ai/usage/report/${reportId}`)
  return data
}

export async function getQuota(): Promise<AiQuotaResponse> {
  const { data } = await api.get<AiQuotaResponse>('/ai/quota')
  return data
}
