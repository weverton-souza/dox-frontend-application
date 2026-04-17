import type { AiGenerationProgress } from '@/types'
import AiSparkleIcon from '@/components/ai/AiSparkleIcon'
import { useRotatingMessage } from '@/lib/hooks/use-rotating-message'

interface AiLoadingOverlayProps {
  progress: AiGenerationProgress
  onCancel: () => void
  sectionNames: string[]
}

export default function AiLoadingOverlay({ progress, onCancel, sectionNames }: AiLoadingOverlayProps) {
  const { currentIndex, total, completedSections, failedSections, skippedSections } = progress
  const displayTotal = total > 0 ? total : sectionNames.length
  const displayIndex = displayTotal > 0 ? Math.max(1, currentIndex) : 1
  const percentage = displayTotal > 0 ? Math.max(Math.round(100 / displayTotal), Math.round((currentIndex / displayTotal) * 100)) : 0

  const motivationalMessage = useRotatingMessage(percentage)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modal max-w-2xl w-full overflow-hidden">

        {/* Header */}
        <div className="text-center px-6 pt-6 pb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 mb-3">
            <AiSparkleIcon size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Redigindo seu relatório</h3>
          <p className="text-[13px] text-gray-400 mt-1">
            {displayIndex} de {displayTotal} seções
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-6 mb-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[12px] text-gray-400 text-center mt-2 min-h-[18px]">
            {motivationalMessage}
          </p>
        </div>

        {/* Section list — iOS grouped style */}
        <div className="mx-4 mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100 max-h-64 overflow-y-auto">
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
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 ${
                  isCurrent ? 'bg-brand-50/50' : ''
                }`}
              >
                {/* Status icon */}
                <div className="w-[22px] h-[22px] flex items-center justify-center shrink-0">
                  {isCompleted && (
                    <div className="w-[22px] h-[22px] rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="white">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {isSkipped && (
                    <div className="w-[22px] h-[22px] rounded-full bg-amber-100 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-amber-600">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {isFailed && (
                    <div className="w-[22px] h-[22px] rounded-full bg-red-100 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-red-600">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="w-[22px] h-[22px] rounded-full border-2 border-brand-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-brand-500 animate-[pulse_3s_ease-in-out_infinite]" />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-200" />
                  )}
                </div>

                {/* Section name */}
                <span className={`text-[15px] flex-1 leading-snug ${
                  isCurrent ? 'text-gray-900 font-medium' :
                  isCompleted ? 'text-gray-400' :
                  isFailed ? 'text-red-600' :
                  isSkipped ? 'text-amber-600' :
                  'text-gray-400'
                }`}>
                  {name}
                </span>

                {/* Status label */}
                {isCompleted && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">pronto</span>
                )}
                {isFailed && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">erro</span>
                )}
                {isSkipped && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">requer dados</span>
                )}
                {isCurrent && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium animate-[pulse_3s_ease-in-out_infinite]">redigindo</span>
                )}
                {isPending && (
                  <span className="text-[11px] text-gray-300">pendente</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 text-[15px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
          >
            Cancelar redação
          </button>
        </div>
      </div>
    </div>
  )
}
