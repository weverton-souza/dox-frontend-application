import { createContext, useContext, useState, useCallback } from 'react'
import { parseError } from '@/lib/api/error-handler'
import type { ParsedError } from '@/lib/api/error-handler'
import NotificationModal, { type NotificationData } from '@/components/ui/NotificationModal'

interface ErrorContextValue {
  showError: (error: unknown) => void
  showSuccess: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  clearError: () => void
}

const ErrorContext = createContext<ErrorContextValue | null>(null)

export function useError(): ErrorContextValue {
  const ctx = useContext(ErrorContext)
  if (!ctx) throw new Error('useError must be used within ErrorProvider')
  return ctx
}

function violationsToDetails(parsed: ParsedError): string[] | undefined {
  if (parsed.businessViolations && parsed.businessViolations.length > 0) {
    return parsed.businessViolations
  }
  if (parsed.validationErrors && parsed.validationErrors.length > 0) {
    return parsed.validationErrors.map((v) => `${v.field}: ${v.message}`)
  }
  return undefined
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(null)

  const showError = useCallback((error: unknown) => {
    const parsed = parseError(error)
    // Erros de auth são tratados pelo interceptor (redirect automático) — não mostra modal
    if (parsed.isAuthError) return
    setNotification({
      variant: parsed.variant,
      title: parsed.title,
      message: parsed.message,
      details: violationsToDetails(parsed),
      confirmLabel: 'Fechar',
    })
  }, [])

  const showSuccess = useCallback((title: string, message?: string) => {
    setNotification({ variant: 'success', title, message })
  }, [])

  const showWarning = useCallback((title: string, message?: string) => {
    setNotification({ variant: 'warning', title, message })
  }, [])

  const clearError = useCallback(() => {
    setNotification(null)
  }, [])

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showWarning, clearError }}>
      {children}
      <NotificationModal notification={notification} onClose={clearError} />
    </ErrorContext.Provider>
  )
}
