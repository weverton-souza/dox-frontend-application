import { useState } from 'react'
import type { CustomerData, Diagnosis, MedicationEntry } from '@/types'
import { useError } from '@/contexts/ErrorContext'
import { getCustomerFileDownloadUrl } from '@/lib/api/customer-file-api'
import Button from '@/components/ui/Button'
import AttachmentChip from '@/components/ui/AttachmentChip'
import {
  AlertTriangleIcon,
  ClipboardListIcon,
  PaperclipIcon,
  PillIcon,
  PlusIcon,
  StethoscopeIcon,
  TrashIcon,
} from '@/components/icons'
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

interface ClinicalCardShellProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  attachmentCount?: number
  onDownloadAttachment?: (e: React.MouseEvent) => void
  onEdit: () => void
  onClear: () => void
  clearTitle: string
  children: React.ReactNode
}

function ClinicalCardShell({
  icon,
  title,
  subtitle,
  attachmentCount = 0,
  onDownloadAttachment,
  onEdit,
  onClear,
  clearTitle,
  children,
}: ClinicalCardShellProps) {
  const hasAttachment = attachmentCount > 0
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit()
        }
      }}
      className="bg-white border border-gray-200 rounded-xl px-5 py-4 cursor-pointer hover:border-brand-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-gray-100 text-gray-600">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              {hasAttachment && (
                <button
                  type="button"
                  onClick={(e) => {
                    if (onDownloadAttachment) {
                      e.stopPropagation()
                      onDownloadAttachment(e)
                    }
                  }}
                  title={
                    onDownloadAttachment
                      ? 'Baixar anexo'
                      : `${attachmentCount} ${attachmentCount === 1 ? 'anexo' : 'anexos'}`
                  }
                  aria-label={
                    onDownloadAttachment
                      ? 'Baixar anexo'
                      : `${attachmentCount} ${attachmentCount === 1 ? 'anexo' : 'anexos'}`
                  }
                  className="inline-flex items-center gap-0.5 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-700"
                >
                  <PaperclipIcon size={16} />
                  {attachmentCount > 1 && (
                    <span className="text-xs font-medium">{attachmentCount}</span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
                title={clearTitle}
                aria-label={clearTitle}
                className="rounded-md p-1.5 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  )
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

function anamnesisFields(data: CustomerData): string {
  const parts: string[] = []
  if (data.chiefComplaint?.trim()) parts.push('Queixa')
  if (data.anamnesisHistory?.trim()) parts.push('Histórico')
  if (data.familyHistory?.trim()) parts.push('Antecedentes familiares')
  return parts.join(' · ')
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

  async function clearAnamnesis() {
    if (!window.confirm('Excluir todo o registro de anamnese?\n\nEsta ação não pode ser desfeita.')) return
    try {
      await onSavePatch({
        chiefComplaint: undefined,
        anamnesisHistory: undefined,
        familyHistory: undefined,
        anamnesisAttachmentFileId: undefined,
      })
    } catch (err) {
      showError(err)
    }
  }

  async function clearDiagnoses() {
    if (!window.confirm('Excluir todos os diagnósticos?\n\nEsta ação não pode ser desfeita.')) return
    try {
      await onSavePatch({ activeDiagnoses: [], diagnosis: undefined })
    } catch (err) {
      showError(err)
    }
  }

  async function clearMedications() {
    if (!window.confirm('Excluir todas as medicações?\n\nEsta ação não pode ser desfeita.')) return
    try {
      await onSavePatch({ medicationsList: [], medications: undefined })
    } catch (err) {
      showError(err)
    }
  }

  async function clearAllergies() {
    if (!window.confirm('Excluir todas as alergias?\n\nEsta ação não pode ser desfeita.')) return
    try {
      await onSavePatch({ allergies: [] })
    } catch (err) {
      showError(err)
    }
  }

  async function clearReferral() {
    if (!window.confirm('Excluir o encaminhamento?\n\nEsta ação não pode ser desfeita.')) return
    try {
      await onSavePatch({ referralDoctor: undefined, referralAttachmentFileId: undefined })
    } catch (err) {
      showError(err)
    }
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
        <h2 className="text-lg font-semibold text-gray-900">Dados clínicos</h2>
        <Button onClick={() => setPickerOpen(true)} disabled={saving}>
          <PlusIcon size={16} />
          <span>Novo registro</span>
        </Button>
      </div>

      {isEmpty && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-sm text-gray-500">
          Nenhum registro clínico ainda. Clique em "Novo registro" pra começar.
        </div>
      )}

      {hasAnamnesis(data) && (
        <ClinicalCardShell
          icon={<ClipboardListIcon size={20} />}
          title="Anamnese"
          subtitle={anamnesisFields(data)}
          attachmentCount={data.anamnesisAttachmentFileId ? 1 : 0}
          onDownloadAttachment={
            data.anamnesisAttachmentFileId
              ? (e) => handleDownload(e, data.anamnesisAttachmentFileId!)
              : undefined
          }
          onEdit={() => setEditing('anamnesis')}
          onClear={clearAnamnesis}
          clearTitle="Excluir anamnese"
        >
          <div className="space-y-1 text-sm text-gray-700">
            {data.chiefComplaint && (
              <div className="line-clamp-2">
                <span className="text-xs text-gray-500">Queixa: </span>
                {data.chiefComplaint}
              </div>
            )}
            {data.anamnesisHistory && (
              <div className="line-clamp-2">
                <span className="text-xs text-gray-500">Histórico: </span>
                {data.anamnesisHistory}
              </div>
            )}
            {data.familyHistory && (
              <div className="line-clamp-2">
                <span className="text-xs text-gray-500">Antecedentes: </span>
                {data.familyHistory}
              </div>
            )}
          </div>
        </ClinicalCardShell>
      )}

      {(diagnoses.length > 0 || legacyDiagnosis) && (
        <ClinicalCardShell
          icon={<StethoscopeIcon size={20} />}
          title="Diagnósticos"
          subtitle={
            diagnoses.length > 0
              ? `${diagnoses.length} ${diagnoses.length === 1 ? 'diagnóstico registrado' : 'diagnósticos registrados'}`
              : 'Registro em texto livre'
          }
          attachmentCount={diagnoses.filter((d) => d.attachmentFileId).length}
          onEdit={() => setEditing('diagnoses')}
          onClear={clearDiagnoses}
          clearTitle="Excluir todos os diagnósticos"
        >
          {diagnoses.length > 0 ? (
            <ul className="space-y-1.5">
              {diagnoses.map((d, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                    {formatDiagnosisLabel(d)}
                  </span>
                  {d.attachmentFileId && (
                    <AttachmentChip onClick={(e) => handleDownload(e, d.attachmentFileId!)} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-700">{legacyDiagnosis}</div>
          )}
        </ClinicalCardShell>
      )}

      {(meds.length > 0 || legacyMedications) && (
        <ClinicalCardShell
          icon={<PillIcon size={20} />}
          title="Medicações"
          subtitle={
            meds.length > 0
              ? `${meds.length} ${meds.length === 1 ? 'medicação em uso' : 'medicações em uso'}`
              : 'Registro em texto livre'
          }
          attachmentCount={meds.filter((m) => m.attachmentFileId).length}
          onEdit={() => setEditing('medications')}
          onClear={clearMedications}
          clearTitle="Excluir todas as medicações"
        >
          {meds.length > 0 ? (
            <ul className="space-y-1.5">
              {meds.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                    {formatMedicationLabel(m)}
                  </span>
                  {m.attachmentFileId && (
                    <AttachmentChip onClick={(e) => handleDownload(e, m.attachmentFileId!)} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-700">{legacyMedications}</div>
          )}
        </ClinicalCardShell>
      )}

      {allergies.length > 0 && (
        <ClinicalCardShell
          icon={<AlertTriangleIcon size={20} />}
          title="Alergias"
          subtitle={`${allergies.length} ${allergies.length === 1 ? 'alergia registrada' : 'alergias registradas'}`}
          onEdit={() => setEditing('allergies')}
          onClear={clearAllergies}
          clearTitle="Excluir todas as alergias"
        >
          <div className="flex flex-wrap gap-1.5">
            {allergies.map((a, i) => (
              <span key={i} className="inline-flex px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                {a}
              </span>
            ))}
          </div>
        </ClinicalCardShell>
      )}

      {data.referralDoctor?.trim() && (
        <ClinicalCardShell
          icon={<StethoscopeIcon size={20} />}
          title="Encaminhamento"
          subtitle="Profissional solicitante"
          attachmentCount={data.referralAttachmentFileId ? 1 : 0}
          onDownloadAttachment={
            data.referralAttachmentFileId
              ? (e) => handleDownload(e, data.referralAttachmentFileId!)
              : undefined
          }
          onEdit={() => setEditing('referral')}
          onClear={clearReferral}
          clearTitle="Excluir encaminhamento"
        >
          <div className="text-sm text-gray-700">{data.referralDoctor}</div>
        </ClinicalCardShell>
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
