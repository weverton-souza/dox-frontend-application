// ========== Auth Types ==========

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  vertical?: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface SwitchTenantRequest {
  tenantId: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  name: string
  tenantId: string
  vertical: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  tenantId: string
  vertical: string
}

// ========== Workspace Types ==========

export type TenantType = 'PERSONAL' | 'ORGANIZATION'
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Workspace {
  tenantId: string
  name: string
  type: TenantType
  vertical: string
  role: MemberRole | null
}
