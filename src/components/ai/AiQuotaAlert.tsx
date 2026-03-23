import { useState } from 'react'

interface AiQuotaAlertProps {
  alertLevel: string
  alertMessage: string
  used?: number
  limit?: number
  overage?: number
}

export default function AiQuotaAlert({ alertLevel, alertMessage, overage }: AiQuotaAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const isOverage = alertLevel === 'OVERAGE'
  const isLimit = alertLevel === 'LIMIT_REACHED'

  const bgClass = isOverage || isLimit
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-blue-50 border-blue-200 text-blue-800'

  const iconColor = isOverage || isLimit ? 'text-amber-500' : 'text-blue-500'

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${bgClass}`}>
      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div className="flex-1 text-sm">
        <p>{alertMessage}</p>
        {isOverage && overage != null && overage > 0 && (
          <p className="text-xs mt-1 opacity-75">
            {overage} laudos excedentes este mês
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
