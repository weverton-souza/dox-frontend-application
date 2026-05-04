import type { ReactNode } from 'react'
import type { SaveStatus } from '@/lib/hooks/use-auto-save'
import SaveStatusIndicator from '@/components/ui/SaveStatusIndicator'

interface EditorPageHeaderProps {
  onBack: () => void
  saveStatus?: SaveStatus
  showSaveStatus?: boolean
  center?: ReactNode
  right?: ReactNode
  /**
   * When true, the header replicates the content grid below
   * (sidebar spacer + sidebar column) so the back button aligns
   * horizontally with the center of the sidebar.
   */
  alignWithSidebar?: boolean
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 flex items-center gap-1.5 pl-2.5 pr-3 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm font-medium"
      title="Voltar"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
      </svg>
      Voltar
    </button>
  )
}

export default function EditorPageHeader({
  onBack,
  saveStatus,
  showSaveStatus = true,
  center,
  right,
  alignWithSidebar = false,
}: EditorPageHeaderProps) {
  const saveStatusNode = showSaveStatus && saveStatus ? (
    <SaveStatusIndicator status={saveStatus} showLabel={true} />
  ) : null

  if (alignWithSidebar) {
    return (
      <div className="sticky top-12 z-30 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-2.5">
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden lg:block lg:w-12 lg:shrink-0" aria-hidden="true" />
            <div className="flex items-center gap-2 lg:w-72 xl:w-80 lg:shrink-0 lg:justify-center">
              <BackButton onClick={onBack} />
              {saveStatusNode}
            </div>
            <div className="flex-1 flex items-center justify-start min-w-0">
              {center}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {right}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-12 z-30 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <BackButton onClick={onBack} />
            {saveStatusNode}
          </div>
          <div className="flex-1 flex items-center justify-center min-w-0">
            {center}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {right}
          </div>
        </div>
      </div>
    </div>
  )
}
