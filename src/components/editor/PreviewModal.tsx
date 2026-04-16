import Modal from '@/components/ui/Modal'
import DocxPreviewPanel from '@/components/editor/DocxPreviewPanel'
import type { Report } from '@/types'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  report: Report
  refreshKey: number
}

export default function PreviewModal({ isOpen, onClose, report, refreshKey }: PreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pré-visualização" size="2xl">
      <div className="h-[75vh]">
        <DocxPreviewPanel report={report} refreshKey={refreshKey} />
      </div>
    </Modal>
  )
}
