import { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react'
import type { NotificationVariant } from '@/components/ui/NotificationModal'

interface NotificationBannerProps {
  variant: NotificationVariant
  title: string
  message?: string
  dismissable?: boolean
  onDismiss?: () => void
  action?: { label: string; onClick: () => void }
  className?: string
}

const VARIANT_STYLES: Record<NotificationVariant, {
  bg: string
  border: string
  titleColor: string
  messageColor: string
  dismissColor: string
  color: string
  Icon: typeof CheckCircle2
}> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    titleColor: 'text-emerald-900',
    messageColor: 'text-emerald-800/80',
    dismissColor: 'text-emerald-700/60 hover:text-emerald-900',
    color: '#34C759',
    Icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    titleColor: 'text-amber-900',
    messageColor: 'text-amber-800/80',
    dismissColor: 'text-amber-800/60 hover:text-amber-900',
    color: '#FF9500',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    titleColor: 'text-red-900',
    messageColor: 'text-red-800/80',
    dismissColor: 'text-red-700/60 hover:text-red-900',
    color: '#FF3B30',
    Icon: XCircle,
  },
}

export default function NotificationBanner({
  variant,
  title,
  message,
  dismissable = false,
  onDismiss,
  action,
  className = '',
}: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const styles = VARIANT_STYLES[variant]

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`${styles.bg} ${styles.border} border rounded-lg px-4 py-3 flex items-center gap-3 ${className}`}
    >
      <styles.Icon size={20} color={styles.color} strokeWidth={2.2} className="shrink-0" />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${styles.titleColor} leading-snug`}>{title}</p>
        {message && (
          <p className={`text-xs mt-0.5 ${styles.messageColor} leading-relaxed`}>{message}</p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={`shrink-0 text-xs font-semibold ${styles.titleColor} hover:underline px-2 py-1`}
        >
          {action.label}
        </button>
      )}

      {dismissable && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar aviso"
          className={`shrink-0 ${styles.dismissColor} transition-colors`}
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      )}
    </div>
  )
}
