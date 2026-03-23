import AiSparkleIcon from './AiSparkleIcon'

interface AiUsageBadgeProps {
  used: number
  limit: number
  onClick?: () => void
}

export default function AiUsageBadge({ used, limit, onClick }: AiUsageBadgeProps) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0

  const colorClasses = percentage >= 100
    ? 'bg-red-50 text-red-700 border-red-200'
    : percentage >= 80
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${colorClasses}`}
      title={`${used} de ${limit} laudos do Assistente utilizados este mês`}
    >
      <AiSparkleIcon size={12} />
      <span>{used}/{limit}</span>
    </button>
  )
}
