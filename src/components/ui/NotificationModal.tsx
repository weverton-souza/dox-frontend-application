import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export type NotificationVariant = 'success' | 'warning' | 'error'

export interface NotificationData {
  variant: NotificationVariant
  title: string
  message?: string
  details?: string[]
  confirmLabel?: string
}

interface NotificationModalProps {
  notification: NotificationData | null
  onClose: () => void
}

const VARIANT_STYLES: Record<NotificationVariant, { bg: string; color: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: 'bg-emerald-50', color: '#34C759', Icon: CheckCircle2 },
  warning: { bg: 'bg-amber-50', color: '#FF9500', Icon: AlertTriangle },
  error: { bg: 'bg-red-50', color: '#FF3B30', Icon: XCircle },
}

export default function NotificationModal({ notification, onClose }: NotificationModalProps) {
  useEffect(() => {
    if (!notification) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [notification, onClose])

  if (!notification) return null

  const { variant, title, message, details, confirmLabel = 'Entendi' } = notification
  const { bg, color, Icon } = VARIANT_STYLES[variant]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-[360px] max-w-[calc(100vw-32px)] p-6 text-center animate-[scaleIn_0.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
      >
        <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center mx-auto`}>
          <Icon size={28} color={color} strokeWidth={2.2} />
        </div>

        <h3 id="notification-title" className="text-base font-semibold text-gray-900 mt-4">
          {title}
        </h3>

        {message && (
          <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{message}</p>
        )}

        {details && details.length > 0 && (
          <ul className="mt-3 space-y-1 text-left bg-gray-50 border border-gray-100 rounded-lg p-3">
            {details.map((d, i) => (
              <li key={i} className="text-xs text-gray-600 list-disc list-inside">{d}</li>
            ))}
          </ul>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full px-4 py-2.5 bg-[#007AFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0066d6] transition-colors"
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px) }
          to { opacity: 1; transform: scale(1) translateY(0) }
        }
      `}</style>
    </div>,
    document.body,
  )
}
