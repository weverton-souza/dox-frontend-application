import { isAxiosError } from 'axios'
import type { ApiErrorCode, ProblemDetail } from '@/types'
import { ApiError, NetworkError } from '@/lib/api/api-client'

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  RESOURCE_NOT_FOUND: 'O recurso solicitado não foi encontrado.',
  DUPLICATE_RESOURCE: 'Já existe um registro com esses dados.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  INVALID_TOKEN: 'Sessão inválida. Faça login novamente.',
  TOKEN_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  ACCESS_DENIED: 'Você não tem permissão para realizar esta ação.',
  BUSINESS_RULE_VIOLATION: 'Operação não permitida.',
  VALIDATION_ERROR: 'Verifique os campos preenchidos.',
  INTERNAL_ERROR: 'Ocorreu um erro interno. Tente novamente mais tarde.',
}

const ERROR_ICONS: Record<ApiErrorCode, { colorClass: string; iconType: ErrorIconType }> = {
  RESOURCE_NOT_FOUND: { colorClass: 'bg-amber-100 text-amber-600', iconType: 'warning' },
  DUPLICATE_RESOURCE: { colorClass: 'bg-amber-100 text-amber-600', iconType: 'warning' },
  INVALID_CREDENTIALS: { colorClass: 'bg-red-100 text-red-600', iconType: 'lock' },
  INVALID_TOKEN: { colorClass: 'bg-red-100 text-red-600', iconType: 'lock' },
  TOKEN_EXPIRED: { colorClass: 'bg-red-100 text-red-600', iconType: 'lock' },
  ACCESS_DENIED: { colorClass: 'bg-red-100 text-red-600', iconType: 'lock' },
  BUSINESS_RULE_VIOLATION: { colorClass: 'bg-amber-100 text-amber-600', iconType: 'warning' },
  VALIDATION_ERROR: { colorClass: 'bg-amber-100 text-amber-600', iconType: 'warning' },
  INTERNAL_ERROR: { colorClass: 'bg-red-100 text-red-600', iconType: 'error' },
}

export type ErrorIconType = 'warning' | 'error' | 'lock'

// Erros de sessão expirada — redirect direto para /login, sem modal
const SESSION_EXPIRED_CODES: ApiErrorCode[] = [
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
]

export interface ParsedError {
  title: string
  message: string
  errorCode: ApiErrorCode
  colorClass: string
  iconType: ErrorIconType
  validationErrors?: { field: string; message: string }[]
  businessViolations?: string[]
  isAuthError: boolean
}

function fallbackError(title: string, message: string, overrides?: Partial<ParsedError>): ParsedError {
  return {
    title,
    message,
    errorCode: 'INTERNAL_ERROR',
    colorClass: 'bg-red-100 text-red-600',
    iconType: 'error',
    isAuthError: false,
    ...overrides,
  }
}

function fromProblemDetail(
  title: string | undefined,
  detail: string | undefined,
  code: ApiErrorCode,
  errors?: { field: string; message: string; rejectedValue?: unknown }[],
  violations?: string[],
): ParsedError {
  const icon = ERROR_ICONS[code] ?? ERROR_ICONS.INTERNAL_ERROR
  return {
    title: title || 'Erro',
    message: detail || ERROR_MESSAGES[code],
    errorCode: code,
    colorClass: icon.colorClass,
    iconType: icon.iconType,
    validationErrors: errors?.map((e) => ({ field: e.field, message: e.message })),
    businessViolations: violations,
    isAuthError: SESSION_EXPIRED_CODES.includes(code),
  }
}

const CONNECTION_ERROR_MSG = 'Não foi possível conectar ao servidor. Verifique sua conexão.'

export function parseError(error: unknown): ParsedError {
  if (error instanceof ApiError) {
    const { problemDetail } = error
    const code = problemDetail.properties?.errorCode ?? 'INTERNAL_ERROR'
    return fromProblemDetail(
      problemDetail.title,
      problemDetail.detail,
      code,
      problemDetail.properties?.errors,
      problemDetail.properties?.violations,
    )
  }

  if (error instanceof NetworkError) {
    return fallbackError('Erro de Conexão', CONNECTION_ERROR_MSG)
  }

  if (isAxiosError(error)) {
    if (!error.response) {
      return fallbackError('Erro de Conexão', CONNECTION_ERROR_MSG)
    }

    const data = error.response.data as Partial<ProblemDetail> | null
    if (data && typeof data.type === 'string' && data.type.startsWith('urn:dox:error:')) {
      const code = data.properties?.errorCode ?? 'INTERNAL_ERROR'
      return fromProblemDetail(
        data.title,
        data.detail,
        code,
        data.properties?.errors,
        data.properties?.violations,
      )
    }

    const detail = (data as Record<string, unknown> | null)?.detail
    if (typeof detail === 'string') {
      return fallbackError('Erro', detail)
    }
  }

  return fallbackError(
    'Erro Inesperado',
    error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
  )
}
