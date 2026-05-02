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
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-lg border border-gray-200 p-4 group hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(contact)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                      {PATIENT_CONTACT_RELATION_LABELS[contact.relationType]}
                    </span>
                    {!contact.canReceiveForms && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Não recebe formulários
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                  {contact.notes && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{contact.notes}</p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(contact.id)}
                  className="shrink-0 p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Excluir contato"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
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
