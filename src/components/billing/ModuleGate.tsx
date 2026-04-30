import type { ReactNode } from 'react'
import type { ModuleId } from '@/types'
import { useModule } from '@/lib/hooks/use-modules'

interface ModuleGateProps {
  module: ModuleId
  fallback?: ReactNode
  readOnlyFallback?: ReactNode
  children: ReactNode
}

export default function ModuleGate({ module, fallback, readOnlyFallback, children }: ModuleGateProps) {
  const { hasAccess, accessLevel, loading } = useModule(module)

  if (loading) return <>{children}</>

  if (!hasAccess) {
    return <>{fallback ?? null}</>
  }

  if (accessLevel === 'READ_ONLY' && readOnlyFallback) {
    return <>{readOnlyFallback}</>
  }

  return <>{children}</>
}

interface UpgradePromptProps {
  module: ModuleId
}

export function UpgradePrompt({ module }: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Recurso não incluído no plano</h3>
      <p className="mt-1 max-w-md text-sm text-gray-600">
        O módulo <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">{module}</code>{' '}
        não está ativo na sua assinatura. Atualize seu plano para liberar esse recurso.
      </p>
      <a
        href="/settings/billing"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
      >
        Ir para Cobrança
      </a>
    </div>
  )
}
