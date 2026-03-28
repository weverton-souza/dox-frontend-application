import AiSparkleIcon from './AiSparkleIcon'

interface AiRegenerateBarProps {
  regenerationsLeft: number
  regenerationLimit?: number
  onRegenerate: () => void
  loading?: boolean
}

export default function AiRegenerateBar({
  regenerationsLeft,
  regenerationLimit = 3,
  onRegenerate,
  loading = false,
}: AiRegenerateBarProps) {
  const canRegenerate = regenerationsLeft > 0 && !loading

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg mt-2">
      <AiSparkleIcon size={14} className="text-brand-600 shrink-0" />
      <span className="text-xs text-brand-700 font-medium">Gerado pelo Assistente</span>
      <div className="flex-1" />
      {canRegenerate ? (
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Regenerando...' : `Regenerar (${regenerationsLeft}/${regenerationLimit} restantes)`}
        </button>
      ) : (
        <span className="text-xs text-gray-400">Limite de regenerações atingido</span>
      )}
    </div>
  )
}
