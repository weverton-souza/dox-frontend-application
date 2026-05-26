import Modal from '@/components/ui/Modal'

export type ClinicalActionType =
  | 'anamnesis'
  | 'diagnoses'
  | 'medications'
  | 'allergies'
  | 'referral'

interface ClinicalActionOption {
  type: ClinicalActionType
  icon: string
  label: string
  description: string
}

const OPTIONS: ClinicalActionOption[] = [
  { type: 'anamnesis', icon: '📋', label: 'Anamnese', description: 'Queixa, histórico clínico e antecedentes familiares' },
  { type: 'diagnoses', icon: '🧠', label: 'Diagnóstico', description: 'CID + descrição clínica' },
  { type: 'medications', icon: '💊', label: 'Medicação', description: 'Nome, dose e frequência' },
  { type: 'allergies', icon: '⚠️', label: 'Alergia', description: 'Substâncias ou itens que causam reação' },
  { type: 'referral', icon: '🩺', label: 'Encaminhamento', description: 'Médico ou profissional solicitante' },
]

interface ClinicalActionPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: ClinicalActionType) => void
}

export default function ClinicalActionPicker({ isOpen, onClose, onSelect }: ClinicalActionPickerProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo registro clínico" size="md">
      <div className="space-y-1">
        {OPTIONS.map(opt => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onSelect(opt.type)}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-brand-50 transition-colors flex items-start gap-3"
          >
            <span className="text-xl shrink-0">{opt.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.description}</div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
