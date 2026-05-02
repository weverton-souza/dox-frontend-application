import { useState, useEffect, useCallback } from 'react'
import type { PatientContact, PatientContactRelationType } from '@/types'
import { PATIENT_CONTACT_RELATION_LABELS, createEmptyPatientContact } from '@/types'
import {
  getPatientContacts,
  createPatientContact,
  updatePatientContact,
  deletePatientContact,
} from '@/lib/api/customer-api'
import { useError } from '@/contexts/ErrorContext'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import { applyMask } from '@/lib/masks'
import { getAvatarColor, getInitials } from '@/lib/avatar-utils'

type RelationCategory = 'family' | 'legal' | 'education' | 'health' | 'other'

const CATEGORY_BY_TYPE: Record<PatientContactRelationType, RelationCategory> = {
  PARENT: 'family',
  MOTHER: 'family',
  FATHER: 'family',
  SPOUSE: 'family',
  CHILD: 'family',
  SIBLING: 'family',
  GRANDPARENT: 'family',
  UNCLE_AUNT: 'family',
  LEGAL_GUARDIAN: 'legal',
  TEACHER: 'education',
  SCHOOL: 'education',
  DOCTOR: 'health',
  THERAPIST: 'health',
  FRIEND: 'other',
  OTHER: 'other',
}

// Mapeia valores antigos (PT/intermediários) para os novos enums (EN).
// Backend Kotlin é strict, então isso protege dados criados em versões anteriores.
const LEGACY_RELATION_MAP: Record<string, PatientContactRelationType> = {
  FILIACAO: 'PARENT',
  MAE: 'MOTHER',
  PAI: 'FATHER',
  RESPONSAVEL_LEGAL: 'LEGAL_GUARDIAN',
  CONJUGE: 'SPOUSE',
  FILHO: 'CHILD',
  IRMAO: 'SIBLING',
  AVO: 'GRANDPARENT',
  TIO: 'UNCLE_AUNT',
  PROFESSOR: 'TEACHER',
  ESCOLA: 'SCHOOL',
  MEDICO: 'DOCTOR',
  TERAPEUTA: 'THERAPIST',
  AMIGO: 'FRIEND',
  OUTRO: 'OTHER',
}

function normalizeRelation(raw: string): PatientContactRelationType {
  if (raw in PATIENT_CONTACT_RELATION_LABELS) return raw as PatientContactRelationType
  if (raw in LEGACY_RELATION_MAP) return LEGACY_RELATION_MAP[raw]
  return 'OTHER'
}

const CATEGORY_PILL_CLASS: Record<RelationCategory, string> = {
  family: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/60',
  legal: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60',
  education: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/60',
  health: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60',
  other: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
}
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { TrashIcon } from '@/components/icons'

interface PatientContactsTabProps {
  customerId: string
}

const RELATION_OPTIONS = (Object.keys(PATIENT_CONTACT_RELATION_LABELS) as PatientContactRelationType[]).map((value) => ({
  value,
  label: PATIENT_CONTACT_RELATION_LABELS[value],
}))

export default function PatientContactsTab({ customerId }: PatientContactsTabProps) {
  const { showError } = useError()
  const [contacts, setContacts] = useState<PatientContact[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PatientContact | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPatientContacts(customerId)
      setContacts(data)
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }, [customerId, showError])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = useCallback(async (contact: PatientContact) => {
    try {
      const payload = {
        name: contact.name,
        relationType: contact.relationType,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes,
        canReceiveForms: contact.canReceiveForms,
      }
      const exists = contacts.some((c) => c.id === contact.id)
      if (exists) {
        await updatePatientContact(customerId, contact.id, payload)
      } else {
        await createPatientContact(customerId, payload)
      }
      setEditing(null)
      await load()
    } catch (err) {
      showError(err)
    }
  }, [contacts, customerId, load, showError])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deletePatientContact(customerId, id)
      await load()
    } catch (err) {
      showError(err)
    }
  }, [customerId, load, showError])

  const { confirmId: confirmDeleteId, requestDelete, confirmDelete, cancelDelete } = useConfirmDelete(handleDelete)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contatos do Paciente</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pessoas próximas ao paciente que podem receber formulários — mãe, pai, professor, etc.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing(createEmptyPatientContact(customerId))}>
          + Novo Contato
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
          <p className="text-sm text-gray-400">Carregando…</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
          <p className="text-sm text-gray-500">Nenhum contato cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {contacts.map((contact) => {
            const normalizedRelation = normalizeRelation(contact.relationType as unknown as string)
            const category = CATEGORY_BY_TYPE[normalizedRelation]
            const pillClass = CATEGORY_PILL_CLASS[category]
            const relationLabel = PATIENT_CONTACT_RELATION_LABELS[normalizedRelation]
            const avatarColor = getAvatarColor(contact.name || '?')
            const initials = getInitials(contact.name || '?')
            return (
              <div
                key={contact.id}
                className="relative rounded-xl border border-gray-200 bg-white p-4 group hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setEditing(contact)}
                  className="w-full text-left flex items-start gap-3"
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} text-white text-sm font-semibold flex items-center justify-center shadow-sm`}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {contact.name || '(sem nome)'}
                      </p>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pillClass}`}>
                        {relationLabel}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      {contact.email && (
                        <span className="inline-flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="inline-flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {applyMask(contact.phone, 'phone')}
                        </span>
                      )}
                    </div>

                    {contact.notes && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {contact.notes}
                      </p>
                    )}

                    {!contact.canReceiveForms && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                        Não recebe formulários
                      </div>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => requestDelete(contact.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Excluir contato"
                >
                  <TrashIcon />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <ContactFormModal
        contact={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        isOpen={!!confirmDeleteId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message="Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita."
      />
    </div>
  )
}

interface ContactFormModalProps {
  contact: PatientContact | null
  onClose: () => void
  onSave: (contact: PatientContact) => void
}

function ContactFormModal({ contact, onClose, onSave }: ContactFormModalProps) {
  const [draft, setDraft] = useState<PatientContact | null>(contact)

  useEffect(() => {
    setDraft(contact)
  }, [contact])

  if (!draft) return null

  const update = (patch: Partial<PatientContact>) => setDraft({ ...draft, ...patch })

  return (
    <Modal
      isOpen={!!contact}
      onClose={onClose}
      title={contact && draft.name ? 'Editar contato' : 'Novo contato'}
      size="md"
    >
      <div className="p-4 space-y-4">
        <Input
          label="Nome"
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="ex: Maria Silva"
        />

        <Select
          label="Tipo de relação"
          value={draft.relationType}
          onChange={(value) => update({ relationType: value as PatientContactRelationType })}
          options={RELATION_OPTIONS}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email"
            type="email"
            value={draft.email ?? ''}
            onChange={(e) => update({ email: e.target.value || null })}
            placeholder="exemplo@email.com"
          />
          <Input
            label="Telefone"
            mask="phone"
            value={draft.phone ?? ''}
            onChange={(e) => update({ phone: e.target.value || null })}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Observações
          </label>
          <textarea
            value={draft.notes ?? ''}
            onChange={(e) => update({ notes: e.target.value || null })}
            placeholder="Informações adicionais sobre este contato"
            rows={3}
            className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-[15px] text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.canReceiveForms}
            onChange={(e) => update({ canReceiveForms: e.target.checked })}
            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">Pode receber formulários</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
