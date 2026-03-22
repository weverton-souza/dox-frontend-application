import axios from 'axios'
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ProblemDetail, RefreshRequest } from '@/types'

// ========== Token Management ==========

let accessToken: string | null = null

const REFRESH_TOKEN_KEY = 'dox_refresh_token'
const ACCESS_TOKEN_KEY = 'dox_access_token'
const USER_KEY = 'dox_user'
const REMEMBER_ME_KEY = 'dox_remember_me'

accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true'
}

export function setRememberMe(value: boolean): void {
  localStorage.setItem(REMEMBER_ME_KEY, String(value))
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
    ?? sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    if (getRememberMe()) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } else {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
    }
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function getStoredUser(): string | null {
  return sessionStorage.getItem(USER_KEY)
}

export function setStoredUser(json: string | null): void {
  if (json) {
    sessionStorage.setItem(USER_KEY, json)
  } else {
    sessionStorage.removeItem(USER_KEY)
  }
}

export function clearTokens(): void {
  accessToken = null
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

// ========== Error Classes ==========

export class ApiError extends Error {
  constructor(
    public readonly problemDetail: ProblemDetail,
    public readonly status: number,
  ) {
    super(problemDetail.detail || problemDetail.title)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Sem conexão com o servidor') {
    super(message)
    this.name = 'NetworkError'
  }
}

// ========== Axios Instance ==========

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ========== Request Interceptor ==========

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && !config.headers?.['Skip-Auth']) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    delete config.headers['Skip-Auth']
    return config
  },
)

// ========== Session Expired Callback ==========

let onSessionExpired: (() => void) | null = null

/**
 * Registra callback chamado quando a sessão expira (refresh falha).
 * O AuthContext usa isso para fazer logout + redirect para /login.
 */
export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback
}

// ========== Shared Refresh Logic ==========

// The refresh endpoint returns the full AuthResponse (tokens + user info).
// We type it loosely here to avoid importing AuthResponse into api-client.
// The auth-service casts the result to AuthResponse.
type RefreshResult = { accessToken: string; refreshToken: string } & Record<string, unknown>

let refreshPromise: Promise<RefreshResult | null> | null = null

/**
 * Single refresh function used by both the interceptor and AuthContext.
 * Deduplicates concurrent calls and manages token storage.
 */
export function refreshTokens(): Promise<RefreshResult | null> {
  if (refreshPromise) return refreshPromise

  const refresh = getRefreshToken()
  if (!refresh) return Promise.resolve(null)

  refreshPromise = (async () => {
    try {
      const res = await axios.post<RefreshResult>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: refresh } satisfies RefreshRequest,
        { headers: { 'Content-Type': 'application/json' } },
      )
      setAccessToken(res.data.accessToken)
      setRefreshToken(res.data.refreshToken)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response && err.response.status < 500) {
        clearTokens()
      }
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ========== Response Interceptor (auto-refresh) ==========

function forceSessionExpired(): void {
  clearTokens()
  if (onSessionExpired) {
    onSessionExpired()
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Network error (no response)
    if (!error.response) {
      return Promise.reject(new NetworkError())
    }

    const { status, data } = error.response
    const originalRequest = error.config

    // Auto-refresh on 401 or 403 (backend pode retornar 403 para token expirado)
    if (
      (status === 401 || status === 403) &&
      originalRequest &&
      !(originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })._retry
    ) {
      const problemData = data as ProblemDetail | null
      const errorCode = problemData?.properties?.errorCode

      // Tenta refresh se: TOKEN_EXPIRED explícito, ou 403 sem ProblemDetail (Spring Security default)
      const rawData = data as Record<string, unknown> | null
      const isProblemDetail = rawData && typeof rawData.type === 'string'
        && rawData.type.startsWith('urn:dox:error:')
      const shouldRefresh = errorCode === 'TOKEN_EXPIRED' || (status === 403 && !isProblemDetail)

      if (shouldRefresh) {
        (originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })._retry = true

        const result = await refreshTokens()
        if (result) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }

        // Refresh falhou — sessão expirou, redireciona para login
        forceSessionExpired()
        return Promise.reject(
          new ApiError(
            {
              type: 'urn:dox:error:TOKEN_EXPIRED',
              title: 'Sessão expirada',
              status,
              detail: 'Sua sessão expirou. Redirecionando para login...',
              instance: originalRequest?.url || '',
              properties: {
                errorCode: 'TOKEN_EXPIRED',
                timestamp: new Date().toISOString(),
              },
            },
            status,
          ),
        )
      }
    }

    // Parse ProblemDetail from response
    const responseData = data as Record<string, unknown> | null
    if (responseData && typeof responseData.type === 'string' && responseData.type.startsWith('urn:dox:error:')) {
      return Promise.reject(new ApiError(responseData as unknown as ProblemDetail, status))
    }

    // Fallback for non-ProblemDetail errors
    return Promise.reject(
      new ApiError(
        {
          type: 'urn:dox:error:INTERNAL_ERROR',
          title: 'Erro desconhecido',
          status,
          detail: 'O servidor retornou um erro inesperado.',
          instance: originalRequest?.url || '',
          properties: {
            errorCode: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
          },
        },
        status,
      ),
    )
  },
)

export { api }
