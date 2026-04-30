interface StatusBadgeProps {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
}

const VARIANT_STYLES: Record<StatusBadgeProps['variant'], string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  info: 'bg-brand-50 text-brand-700 border-brand-200',
}

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]}`}
    >
      {label}
    </span>
  )
}
