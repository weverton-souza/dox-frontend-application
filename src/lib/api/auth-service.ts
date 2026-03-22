import type { LoginRequest, RegisterRequest, AuthResponse, AuthUser } from '@/types'
import { api, setAccessToken, setRefreshToken, setRememberMe, clearTokens, getRefreshToken, refreshTokens } from '@/lib/api/api-client'

export async function login(credentials: LoginRequest, rememberMe = true): Promise<AuthResponse> {
  setRememberMe(rememberMe)
  const { data } = await api.post<AuthResponse>('/auth/login', credentials)
  setAccessToken(data.accessToken)
  setRefreshToken(data.refreshToken)
  return data
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', request)
  setAccessToken(data.accessToken)
  setRefreshToken(data.refreshToken)
  return data
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken })
    }
  } finally {
    clearTokens()
  }
}

/**
 * Attempts to refresh the session using the shared refreshTokens() from api-client.
 * Returns the full AuthResponse if successful, null otherwise.
 */
export async function refreshSession(): Promise<AuthResponse | null> {
  const result = await refreshTokens()
  if (!result) return null
  return result as unknown as AuthResponse
}

export async function switchTenant(tenantId: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/switch-tenant', { tenantId })
  setAccessToken(data.accessToken)
  setRefreshToken(data.refreshToken)
  return data
}

export function authResponseToUser(response: AuthResponse): AuthUser {
  return {
    id: response.userId,
    email: response.email,
    name: response.name,
    tenantId: response.tenantId,
    vertical: response.vertical,
  }
}
