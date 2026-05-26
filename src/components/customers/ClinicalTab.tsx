import { useState } from 'react'
import type { CustomerData, Diagnosis, MedicationEntry } from '@/types'
import { useError } from '@/contexts/ErrorContext'
import { getCustomerFileDownloadUrl } from '@/lib/api/customer-file-api'
import Button from '@/components/ui/Button'
import ClinicalActionPicker, { type ClinicalActionType } from './ClinicalActionPicker'
import AnamnesisEditorModal from './AnamnesisEditorModal'
import DiagnosesEditorModal from './DiagnosesEditorModal'
import MedicationsEditorModal from './MedicationsEditorModal'
import AllergiesEditorModal from './AllergiesEditorModal'
import ReferralEditorModal from './ReferralEditorModal'

interface ClinicalTabProps {
  customerId: string
  data: CustomerData
  saving: boolean
  onSavePatch: (patch: Partial<CustomerData>) => Promise<void>
}

function formatDiagnosisLabel(d: Diagnosis): string {
  return d.code ? `${d.code} · ${d.label}` : d.label
}

function formatMedicationLabel(m: MedicationEntry): string {
  return [m.name, m.dose, m.frequency].filter(Boolean).join(' ')
}

function hasAnamnesis(data: CustomerData): boolean {
  return !!(data.chiefComplaint?.trim() || data.anamnesisHistory?.trim() || data.familyHistory?.trim())
}

export default function ClinicalTab({ customerId, data, saving, onSavePatch }: ClinicalTabProps) {
  const { showError } = useError()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState<ClinicalActionType | null>(null)

  const diagnoses = data.activeDiagnoses ?? []
  const meds = data.medicationsList ?? []
  const allergies = data.allergies ?? []
  const legacyDiagnosis = data.diagnosis?.trim()
  const legacyMedications = data.medications?.trim()

  async function handleDownload(e: React.MouseEvent, fileId: string) {
    e.stopPropagation()
    try {
      const { url } = await getCustomerFileDownloadUrl(customerId, fileId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showError(err)
    }
  }

  function handlePick(type: ClinicalActionType) {
    setPickerOpen(false)
    setEditing(type)
  }

  const isEmpty =
    !hasAnamnesis(data) &&
    diagnoses.length === 0 && !legacyDiagnosis &&
    meds.length === 0 && !legacyMedications &&
    allergies.length === 0 &&
    !data.referralDoctor?.trim()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dados clínicos</h2>
          <p className="text-sm text-gray-600">
            Cada registro pode ter seu próprio anexo.
          </p>
        </div>
        <Button onClick={() => setPickerOpen(true)} disabled={saving}>
          + Novo registro
        </Button>
      </div>

      {isEmpty && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-sm text-gray-500">
          Nenhum registro clínico ainda. Clique em "Novo registro" pra começar.
        </div>
      )}

      {hasAnamnesis(data) && (
        <button
          type="button"
          onClick={() => setEditing('anamnesis')}
          className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="text-sm font-semibold text-gray-900">Anamnese</h3>
              {data.anamnesisAttachmentFileId && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDownload(e, data.anamnesisAttachmentFileId!)}
                  className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
                >
                  📎
                </span>
              )}
            </div>
            <span className="text-xs text-brand-600">Editar</span>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            {data.chiefComplaint && <div className="line-clamp-2"><span className="text-xs text-gray-500">Queixa: </span>{data.chiefComplaint}</div>}
            {data.anamnesisHistory && <div className="line-clamp-2"><span className="text-xs text-gray-500">Histórico: </span>{data.anamnesisHistory}</div>}
            {data.familyHistory && <div className="line-clamp-2"><span className="text-xs text-gray-500">Antecedentes: </span>{data.familyHistory}</div>}
          </div>
        </button>
      )}

      {(diagnoses.length > 0 || legacyDiagnosis) && (
        <button
          type="button"
          onClick={() => setEditing('diagnoses')}
          className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <h3 className="text-sm font-semibold text-gray-900">
                Diagnósticos{diagnoses.length > 0 && ` (${diagnoses.length})`}
              </h3>
            </div>
            <span className="text-xs text-brand-600">Editar</span>
          </div>
          {diagnoses.length > 0 ? (
            <ul className="space-y-1">
              {diagnoses.map((d, i) => (
                <li key={i} className="flex items-center justify-between text-sm text-gray-700">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs">
                    {formatDiagnosisLabel(d)}
                  </span>
                  {d.attachmentFileId && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleDownload(e, d.attachmentFileId!)}
                      className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
                    >
                      📎
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-700">{legacyDiagnosis}</div>
          )}
        </button>
      )}

      {(meds.length > 0 || legacyMedications) && (
        <button
          type="button"
          onClick={() => setEditing('medications')}
          className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💊</span>
              <h3 className="text-sm font-semibold text-gray-900">
                Medicações{meds.length > 0 && ` (${meds.length})`}
              </h3>
            </div>
            <span className="text-xs text-brand-600">Editar</span>
          </div>
          {meds.length > 0 ? (
            <ul className="space-y-1">
              {meds.map((m, i) => (
                <li key={i} className="flex items-center justify-between text-sm text-gray-700">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                    {formatMedicationLabel(m)}
                  </span>
                  {m.attachmentFileId && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleDownload(e, m.attachmentFileId!)}
                      className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
                    >
                      📎
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-700">{legacyMedications}</div>
          )}
        </button>
      )}

      {allergies.length > 0 && (
        <button
          type="button"
          onClick={() => setEditing('allergies')}
          className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-semibold text-gray-900">Alergias ({allergies.length})</h3>
            </div>
            <span className="text-xs text-brand-600">Editar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allergies.map((a, i) => (
              <span key={i} className="inline-flex px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs">
                {a}
              </span>
            ))}
          </div>
        </button>
      )}

      {data.referralDoctor?.trim() && (
        <button
          type="button"
          onClick={() => setEditing('referral')}
          className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🩺</span>
              <h3 className="text-sm font-semibold text-gray-900">Encaminhamento</h3>
              {data.referralAttachmentFileId && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDownload(e, data.referralAttachmentFileId!)}
                  className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
                >
                  📎
                </span>
              )}
            </div>
            <span className="text-xs text-brand-600">Editar</span>
          </div>
          <div className="text-sm text-gray-700">{data.referralDoctor}</div>
        </button>
      )}

      <ClinicalActionPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
      />

      <AnamnesisEditorModal
        isOpen={editing === 'anamnesis'}
        customerId={customerId}
        data={data}
        onClose={() => setEditing(null)}
        onSave={onSavePatch}
      />

      <DiagnosesEditorModal
        isOpen={editing === 'diagnoses'}
        customerId={customerId}
        initial={diagnoses}
        onClose={() => setEditing(null)}
        onSave={(list) => onSavePatch({ activeDiagnoses: list, diagnosis: undefined })}
      />

      <MedicationsEditorModal
        isOpen={editing === 'medications'}
        customerId={customerId}
        initial={meds}
        onClose={() => setEditing(null)}
        onSave={(list) => onSavePatch({ medicationsList: list, medications: undefined })}
      />

      <AllergiesEditorModal
        isOpen={editing === 'allergies'}
        initial={allergies}
        onClose={() => setEditing(null)}
        onSave={(list) => onSavePatch({ allergies: list })}
      />

      <ReferralEditorModal
        isOpen={editing === 'referral'}
        customerId={customerId}
        data={data}
        onClose={() => setEditing(null)}
        onSave={onSavePatch}
      />
    </div>
  )
}
