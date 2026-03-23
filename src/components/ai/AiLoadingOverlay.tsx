import type { AiGenerationProgress } from '@/types'
import Button from '@/components/ui/Button'
import AiSparkleIcon from '@/components/ai/AiSparkleIcon'
import { useRotatingMessage } from '@/lib/hooks/use-rotating-message'

interface AiLoadingOverlayProps {
  progress: AiGenerationProgress
  onCancel: () => void
  sectionNames: string[]
}

export default function AiLoadingOverlay({ progress, onCancel, sectionNames }: AiLoadingOverlayProps) {
  const { currentIndex, total, completedSections, failedSections, skippedSections } = progress
  const percentage = total > 0 ? Math.round((currentIndex / total) * 100) : 0

  const motivationalMessage = useRotatingMessage(percentage)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modal max-w-md w-full p-6">

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-1">
            <AiSparkleIcon size={18} />
            <h3 className="text-[17px] font-semibold text-gray-900">Assistente redigindo seu laudo</h3>
          </div>
          <p className="text-[13px] text-gray-500 font-medium">
            {currentIndex} de {total} seções
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[13px] text-gray-400 text-center mt-2 min-h-[20px] transition-opacity duration-300">
            {motivationalMessage}
          </p>
        </div>

        {/* Section list */}
        <div className="space-y-1 mb-5 max-h-64 overflow-y-auto">
          {sectionNames.map((name, i) => {
            const idx = i + 1
            const isCompleted = completedSections.has(name)
            const isFailed = failedSections.has(name)
            const isSkipped = skippedSections.has(name)
            const isCurrent = idx === currentIndex && !isCompleted && !isFailed && !isSkipped
            const isPending = !isCompleted && !isFailed && !isSkipped && !isCurrent

            return (
              <div
                key={name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-250 ${
                  isCurrent ? 'bg-brand-50' :
                  isCompleted || isSkipped ? 'opacity-60' :
                  ''
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {isCompleted && (
                    <svg className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isSkipped && (
                    <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isFailed && (
                    <svg className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isCurrent && (
                    <svg className="w-5 h-5 text-brand-600 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                    </svg>
                  )}
                  {isPending && (
                    <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <span className={`text-[15px] leading-snug ${
                  isCurrent ? 'text-gray-900 font-medium' :
                  isFailed ? 'text-red-600' :
                  isSkipped ? 'text-amber-600' :
                  isCompleted ? 'text-gray-500' :
                  'text-gray-400'
                }`}>
                  {name}
                </span>
                <span className={`ml-auto text-xs shrink-0 ${
                  isCurrent ? 'text-brand-600 font-medium' :
                  isFailed ? 'text-red-500' :
                  isSkipped ? 'text-amber-500' :
                  isCompleted ? 'text-gray-400' :
                  'text-gray-300'
                }`}>
                  {isCompleted && 'pronto'}
                  {isFailed && 'erro'}
                  {isSkipped && 'pulado'}
                  {isCurrent && 'redigindo'}
                  {isPending && 'pendente'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar redação
          </Button>
        </div>
      </div>
    </div>
  )
}
