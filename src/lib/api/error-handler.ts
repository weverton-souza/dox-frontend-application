import { isAxiosError } from 'axios'
import type { ApiErrorCode, ProblemDetail } from '@/types'
import { ApiError, NetworkError } from '@/lib/api/api-client'
import type { NotificationVariant } from '@/components/ui/NotificationModal'

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

const ERROR_TITLES: Record<ApiErrorCode, string> = {
  RESOURCE_NOT_FOUND: 'Não encontrado',
  DUPLICATE_RESOURCE: 'Já existe',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  INVALID_TOKEN: 'Sessão inválida',
  TOKEN_EXPIRED: 'Sessão expirada',
  ACCESS_DENIED: 'Acesso negado',
  BUSINESS_RULE_VIOLATION: 'Não foi possível continuar',
  VALIDATION_ERROR: 'Verifique os dados',
  INTERNAL_ERROR: 'Algo deu errado',
}

const ERROR_VARIANTS: Record<ApiErrorCode, NotificationVariant> = {
  RESOURCE_NOT_FOUND: 'warning',
  DUPLICATE_RESOURCE: 'warning',
  INVALID_CREDENTIALS: 'error',
  INVALID_TOKEN: 'error',
  TOKEN_EXPIRED: 'error',
  ACCESS_DENIED: 'error',
  BUSINESS_RULE_VIOLATION: 'warning',
  VALIDATION_ERROR: 'warning',
  INTERNAL_ERROR: 'error',
}

const STATUS_FALLBACKS: Record<number, { title: string; message: string; variant: NotificationVariant }> = {
  400: { title: 'Dados inválidos', message: 'Verifique as informações enviadas e tente novamente.', variant: 'warning' },
  401: { title: 'Acesso negado', message: 'Faça login para continuar.', variant: 'error' },
  403: { title: 'Acesso negado', message: 'Você não tem permissão para realizar esta ação.', variant: 'error' },
  404: { title: 'Não encontrado', message: 'O recurso solicitado não foi encontrado.', variant: 'warning' },
  409: { title: 'Conflito de dados', message: 'Já existe um registro com essas informações.', variant: 'warning' },
  422: { title: 'Não foi possível processar', message: 'Os dados enviados não puderam ser processados.', variant: 'warning' },
  429: { title: 'Muitas tentativas', message: 'Aguarde alguns instantes e tente novamente.', variant: 'warning' },
  500: { title: 'Erro no servidor', message: 'Algo deu errado do nosso lado. Tente novamente em instantes.', variant: 'error' },
  502: { title: 'Servidor indisponível', message: 'Não foi possível alcançar o servidor. Tente novamente.', variant: 'error' },
  503: { title: 'Serviço indisponível', message: 'O serviço está temporariamente fora do ar.', variant: 'error' },
  504: { title: 'Tempo esgotado', message: 'O servidor demorou para responder. Tente novamente.', variant: 'error' },
}

// Erros de sessão expirada — redirect direto para /login, sem modal
const SESSION_EXPIRED_CODES: ApiErrorCode[] = [
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
]

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const URN_REGEX = /^urn:/i
const URL_PATH_REGEX = /^https?:\/\//i

/**
 * Mensagens cruas que não devem ser exibidas: UUIDs, URNs, URLs.
 * Esses textos vazam quando algum lugar faz `throw new Error(someId)` ou
 * propaga `error.message` sem tratar.
 */
function isOpaqueMessage(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return true
  if (UUID_REGEX.test(trimmed) && trimmed.length < 60) return true
  if (URN_REGEX.test(trimmed)) return true
  if (URL_PATH_REGEX.test(trimmed)) return true
  return false
}

export interface ParsedError {
  variant: NotificationVariant
  title: string
  message: string
  errorCode: ApiErrorCode
  validationErrors?: { field: string; message: string }[]
  businessViolations?: string[]
  isAuthError: boolean
}

function fallbackError(title: string, message: string, variant: NotificationVariant = 'error'): ParsedError {
  return {
    variant,
    title,
    message,
    errorCode: 'INTERNAL_ERROR',
    isAuthError: false,
  }
}

function fromProblemDetail(
  title: string | undefined,
  detail: string | undefined,
  code: ApiErrorCode,
  errors?: { field: string; message: string; rejectedValue?: unknown }[],
  violations?: string[],
): ParsedError {
  const safeDetail = detail && !isOpaqueMessage(detail) ? detail : ERROR_MESSAGES[code]
  // Sempre usa título amigável por errorCode — backend manda títulos técnicos
  // (ex: "Violação de regra de negócio") que não fazem sentido pra usuário final
  const safeTitle = ERROR_TITLES[code] ?? (title && !isOpaqueMessage(title) ? title : 'Erro')
  return {
    variant: ERROR_VARIANTS[code] ?? 'error',
    title: safeTitle,
    message: safeDetail,
    errorCode: code,
    validationErrors: errors?.map((e) => ({ field: e.field, message: e.message })),
    businessViolations: violations,
    isAuthError: SESSION_EXPIRED_CODES.includes(code),
  }
}

function fromStatus(status: number): ParsedError {
  const fb = STATUS_FALLBACKS[status]
  if (fb) return fallbackError(fb.title, fb.message, fb.variant)
  if (status >= 500) return fallbackError('Erro no servidor', 'Algo deu errado. Tente novamente em instantes.', 'error')
  if (status >= 400) return fallbackError('Erro', 'A requisição não pôde ser concluída.', 'warning')
  return fallbackError('Erro inesperado', 'Ocorreu um erro inesperado.', 'error')
}

const CONNECTION_ERROR_MSG = 'Não foi possível conectar ao servidor. Verifique sua conexão.'

export function parseError(error: unknown): ParsedError {
  if (error instanceof ApiError) {
    const { problemDetail, status } = error
    const code = problemDetail.properties?.errorCode ?? 'INTERNAL_ERROR'
    if (problemDetail.detail || problemDetail.title) {
      return fromProblemDetail(
        problemDetail.title,
        problemDetail.detail,
        code,
        problemDetail.properties?.errors,
        problemDetail.properties?.violations,
      )
    }
    return fromStatus(status)
  }

  if (error instanceof NetworkError) {
    return fallbackError('Erro de Conexão', CONNECTION_ERROR_MSG, 'error')
  }

  if (isAxiosError(error)) {
    if (!error.response) {
      return fallbackError('Erro de Conexão', CONNECTION_ERROR_MSG, 'error')
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
    if (typeof detail === 'string' && !isOpaqueMessage(detail)) {
      return fallbackError('Erro', detail, 'error')
    }

    return fromStatus(error.response.status)
  }

  if (error instanceof Error && !isOpaqueMessage(error.message)) {
    return fallbackError('Erro inesperado', error.message, 'error')
  }

  return fallbackError('Erro inesperado', 'Ocorreu um erro inesperado. Tente novamente.', 'error')
}
