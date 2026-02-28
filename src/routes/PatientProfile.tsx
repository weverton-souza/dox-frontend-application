import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Patient,
  PatientData,
  PatientNote,
  Laudo,
  createEmptyPatientNote,
  createEmptyIdentificationData,
} from '@/types'
import {
  getPatient,
  savePatient,
  getPatientNotes,
  savePatientNote,
  deletePatientNote,
  getLaudosByPatient,
  saveLaudo,
  getProfessional,
} from '@/lib/storage'
import { createBlock } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'

// ========== Types ==========

type ProfileSection = 'personal' | 'contact' | 'clinical' | 'laudos' | 'notes'

interface SectionMenuItem {
  key: ProfileSection
  label: string
  icon: React.ReactNode
}

// ========== Section Icons (inline SVG) ==========

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function StickyNoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

// ========== Section menu config ==========

const SECTION_MENU: SectionMenuItem[] = [
  { key: 'personal', label: 'Dados Pessoais', icon: <PersonIcon /> },
  { key: 'contact', label: 'Contato', icon: <PhoneIcon /> },
  { key: 'clinical', label: 'Dados Cl\u00ednicos', icon: <ClipboardIcon /> },
  { key: 'laudos', label: 'Laudos', icon: <FileTextIcon /> },
  { key: 'notes', label: 'Notas', icon: <StickyNoteIcon /> },
]

// ========== Component ==========

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [editData, setEditData] = useState<PatientData | null>(null)
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal')
  const [saving, setSaving] = useState(false)

  // Laudos
  const [laudos, setLaudos] = useState<Laudo[]>([])

  // Notes
  const [notes, setNotes] = useState<PatientNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')

  // Load patient
  useEffect(() => {
    if (!id) return
    const p = getPatient(id)
    if (p) {
      setPatient(p)
      setEditData({ ...p.data })
      setLaudos(getLaudosByPatient(id))
      setNotes(getPatientNotes(id))
    }
  }, [id])

  // ========== Handlers ==========

  const updateField = useCallback(
    (field: keyof PatientData, value: string) => {
      setEditData((prev) => (prev ? { ...prev, [field]: value } : prev))
    },
    []
  )

  const handleSaveSection = useCallback(() => {
    if (!patient || !editData) return
    setSaving(true)
    const updated: Patient = {
      ...patient,
      data: { ...editData },
      updatedAt: new Date().toISOString(),
    }
    savePatient(updated)
    setPatient(updated)
    setTimeout(() => setSaving(false), 600)
  }, [patient, editData])

  const handleCreateLaudo = useCallback(() => {
    if (!patient) return
    const laudoId = crypto.randomUUID()
    const now = new Date().toISOString()
    const identificationBlock = createBlock('identification', 0)

    const professional = getProfessional()
    const identData = createEmptyIdentificationData(professional)
    identData.patient = { ...patient.data }
    identificationBlock.data = identData

    const laudo: Laudo = {
      id: laudoId,
      createdAt: now,
      updatedAt: now,
      status: 'rascunho',
      patientName: patient.data.name,
      patientId: patient.id,
      blocks: [identificationBlock],
    }

    saveLaudo(laudo)
    navigate(`/laudo/${laudoId}`)
  }, [patient, navigate])

  const handleAddNote = useCallback(() => {
    if (!patient || !newNoteContent.trim()) return
    const note = createEmptyPatientNote(patient.id)
    note.content = newNoteContent.trim()
    savePatientNote(note)
    setNotes(getPatientNotes(patient.id))
    setNewNoteContent('')
  }, [patient, newNoteContent])

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      if (!patient) return
      deletePatientNote(noteId)
      setNotes(getPatientNotes(patient.id))
    },
    [patient]
  )

  // ========== Not found ==========

  if (!patient || !editData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Paciente n\u00e3o encontrado</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => navigate('/pacientes')}
          >
            Voltar para Pacientes
          </Button>
        </div>
      </div>
    )
  }

  // ========== Avatar initial ==========

  const initial = patient.data.name
    ? patient.data.name.charAt(0).toUpperCase()
    : '?'

  // ========== Render sections ==========

  function renderPersonalSection() {
    return (
      <SectionCard title="Dados Pessoais" onSave={handleSaveSection} saving={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome completo"
            value={editData!.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Input
            label="CPF"
            value={editData!.cpf}
            onChange={(e) => updateField('cpf', e.target.value)}
          />
          <Input
            label="Data de Nascimento"
            type="date"
            value={editData!.birthDate}
            onChange={(e) => updateField('birthDate', e.target.value)}
          />
          <Input
            label="Idade"
            value={editData!.age}
            onChange={(e) => updateField('age', e.target.value)}
            placeholder="Ex: 32 anos e 4 meses"
          />
          <Input
            label="Escolaridade"
            value={editData!.education}
            onChange={(e) => updateField('education', e.target.value)}
          />
          <Input
            label="Profiss\u00e3o"
            value={editData!.profession}
            onChange={(e) => updateField('profession', e.target.value)}
          />
          <Input
            label="Nome da M\u00e3e"
            value={editData!.motherName}
            onChange={(e) => updateField('motherName', e.target.value)}
          />
          <Input
            label="Nome do Pai"
            value={editData!.fatherName}
            onChange={(e) => updateField('fatherName', e.target.value)}
          />
          <Input
            label="Respons\u00e1vel Legal"
            value={editData!.guardianName ?? ''}
            onChange={(e) => updateField('guardianName', e.target.value)}
          />
          <Input
            label="Parentesco"
            value={editData!.guardianRelationship ?? ''}
            onChange={(e) => updateField('guardianRelationship', e.target.value)}
          />
        </div>
      </SectionCard>
    )
  }

  function renderContactSection() {
    return (
      <SectionCard title="Contato" onSave={handleSaveSection} saving={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Telefone"
            value={editData!.phone ?? ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="(31) 99999-0000"
          />
          <Input
            label="E-mail"
            type="email"
            value={editData!.email ?? ''}
            onChange={(e) => updateField('email', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              label="Rua / Endere\u00e7o"
              value={editData!.addressStreet ?? ''}
              onChange={(e) => updateField('addressStreet', e.target.value)}
            />
          </div>
          <Input
            label="Cidade"
            value={editData!.addressCity ?? ''}
            onChange={(e) => updateField('addressCity', e.target.value)}
          />
          <Input
            label="Estado"
            value={editData!.addressState ?? ''}
            onChange={(e) => updateField('addressState', e.target.value)}
          />
          <Input
            label="CEP"
            value={editData!.addressZipCode ?? ''}
            onChange={(e) => updateField('addressZipCode', e.target.value)}
            placeholder="00000-000"
          />
        </div>
      </SectionCard>
    )
  }

  function renderClinicalSection() {
    return (
      <SectionCard title="Dados Cl\u00ednicos" onSave={handleSaveSection} saving={saving}>
        <div className="space-y-4">
          <TextArea
            label="Queixa Principal"
            value={editData!.chiefComplaint ?? ''}
            onChange={(e) => updateField('chiefComplaint', e.target.value)}
            placeholder="Descreva a queixa principal do paciente..."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Diagn\u00f3stico"
              value={editData!.diagnosis ?? ''}
              onChange={(e) => updateField('diagnosis', e.target.value)}
            />
            <Input
              label="M\u00e9dico Solicitante"
              value={editData!.referralDoctor ?? ''}
              onChange={(e) => updateField('referralDoctor', e.target.value)}
            />
          </div>
          <TextArea
            label="Medica\u00e7\u00f5es"
            value={editData!.medications ?? ''}
            onChange={(e) => updateField('medications', e.target.value)}
            placeholder="Liste as medica\u00e7\u00f5es em uso..."
          />
        </div>
      </SectionCard>
    )
  }

  function renderLaudosSection() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Laudos</h2>
          <Button size="sm" onClick={handleCreateLaudo}>
            + Novo Laudo
          </Button>
        </div>

        {laudos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <FileTextIcon />
            <p className="text-sm text-gray-500 mt-2">
              Nenhum laudo criado para este paciente
            </p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={handleCreateLaudo}>
              Criar primeiro laudo
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {laudos.map((laudo) => (
              <button
                key={laudo.id}
                onClick={() => navigate(`/laudo/${laudo.id}`)}
                className="w-full text-left rounded-lg border border-gray-200 p-3 hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {laudo.patientName || 'Sem nome'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Criado em {formatDateTime(laudo.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs text-gray-400">
                      {laudo.blocks.length} {laudo.blocks.length === 1 ? 'bloco' : 'blocos'}
                    </span>
                    <StatusBadge status={laudo.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderNotesSection() {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Notas de Acompanhamento</h2>

        {/* Add note */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <TextArea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Escreva uma nota de acompanhamento..."
            className="min-h-[60px]"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
            >
              Adicionar Nota
            </Button>
          </div>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm text-gray-500">Nenhuma nota ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-gray-200 p-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">
                      {formatDateTime(note.createdAt)}
                      {note.updatedAt !== note.createdAt && (
                        <span className="ml-1">(editado)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="shrink-0 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Excluir nota"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const sectionRenderers: Record<ProfileSection, () => React.ReactNode> = {
    personal: renderPersonalSection,
    contact: renderContactSection,
    clinical: renderClinicalSection,
    laudos: renderLaudosSection,
    notes: renderNotesSection,
  }

  // ========== Main Render ==========

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pacientes')}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Voltar"
          >
            <ChevronLeftIcon />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {patient.data.name || 'Paciente sem nome'}
            </h1>
            <p className="text-xs text-gray-500">
              Cadastrado em {formatDateTime(patient.createdAt)}
            </p>
          </div>
        </div>
      </header>

      {/* 2-column layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] shrink-0 border-r border-gray-200 bg-gray-50/50 overflow-y-auto">
          <div className="p-5">
            {/* Avatar + info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl font-semibold">
                {initial}
              </div>
              <h2 className="mt-3 text-sm font-semibold text-gray-900 leading-tight">
                {patient.data.name || 'Sem nome'}
              </h2>
              {patient.data.cpf && (
                <p className="text-xs text-gray-500 mt-0.5">
                  CPF: {patient.data.cpf}
                </p>
              )}
              {patient.data.age && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {patient.data.age}
                </p>
              )}
            </div>

            {/* Divider */}
            <hr className="my-4 border-gray-200" />

            {/* Section menu */}
            <nav className="space-y-0.5">
              {SECTION_MENU.map((item) => {
                const isActive = activeSection === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left
                      ${isActive
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `.trim()}
                  >
                    <span className={isActive ? 'text-brand-600' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {sectionRenderers[activeSection]()}
        </main>
      </div>
    </div>
  )
}

// ========== SectionCard helper ==========

function SectionCard({
  title,
  onSave,
  saving,
  children,
}: {
  title: string
  onSave: () => void
  saving: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      {children}
    </div>
  )
}
