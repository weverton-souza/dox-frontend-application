import { useState, useEffect, useCallback } from 'react'
import type { CustomerContact, CustomerContactRelationType } from '@/types'
import { CUSTOMER_CONTACT_RELATION_LABELS, createEmptyCustomerContact } from '@/types'
import {
  getCustomerContacts,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
} from '@/lib/api/customer-api'
import { useError } from '@/contexts/ErrorContext'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { TrashIcon } from '@/components/icons'

interface FamilyAndGuardiansSectionProps {
  customerId: string
}

const FAMILY_TYPES: CustomerContactRelationType[] = ['parent', 'legal_guardian']

const TYPE_OPTIONS = FAMILY_TYPES.map((value) => ({
  value,
  label: CUSTOMER_CONTACT_RELATION_LABELS[value],
}))

export default function FamilyAndGuardiansSection({ customerId }: FamilyAndGuardiansSectionProps) {
  const { showError } = useError()
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [loading, setLoading] = useState(true)

  const [drafts, setDrafts] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCustomerContacts(customerId)
      setContacts(data.filter((c) => FAMILY_TYPES.includes(c.relationType)))
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }, [customerId, showError])

  useEffect(() => {
    load()
  }, [load])

  const handleAdd = useCallback(() => {
    const draft = createEmptyCustomerContact(customerId, 'parent')
    setContacts((prev) => [...prev, draft])
    setDrafts((prev) => new Set(prev).add(draft.id))
  }, [customerId])

  const handleUpdate = useCallback((id: string, patch: Partial<CustomerContact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const handleSave = useCallback(async (contact: CustomerContact) => {
    if (!contact.name.trim()) return
    const payload = {
      name: contact.name,
      relationType: contact.relationType,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      canReceiveForms: contact.canReceiveForms,
    }
    try {
      if (drafts.has(contact.id)) {
        const created = await createCustomerContact(customerId, payload)
        setContacts((prev) => prev.map((c) => (c.id === contact.id ? created : c)))
        setDrafts((prev) => {
          const next = new Set(prev)
          next.delete(contact.id)
          return next
        })
      } else {
        await updateCustomerContact(customerId, contact.id, payload)
      }
    } catch (err) {
      showError(err)
    }
  }, [drafts, customerId, showError])

  const handleRemove = useCallback(async (id: string) => {
    try {
      if (!drafts.has(id)) {
        await deleteCustomerContact(customerId, id)
      }
      setContacts((prev) => prev.filter((c) => c.id !== id))
      setDrafts((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (err) {
      showError(err)
    }
  }, [drafts, customerId, showError])

  const { confirmId, requestDelete, confirmDelete, cancelDelete } = useConfirmDelete(handleRemove)

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center">
        <p className="text-sm text-gray-400">Carregando…</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Filiação e responsáveis</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pessoas próximas ao paciente. Editar contatos completos na aba Contatos.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={handleAdd}>
          + Adicionar
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Nenhum cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-lg border border-gray-200 p-3 group">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                <Select
                  label="Tipo"
                  value={contact.relationType}
                  onChange={(value) => {
                    handleUpdate(contact.id, { relationType: value as CustomerContactRelationType })
                    handleSave({ ...contact, relationType: value as CustomerContactRelationType })
                  }}
                  options={TYPE_OPTIONS}
                />
                <Input
                  label="Nome"
                  value={contact.name}
                  onChange={(e) => handleUpdate(contact.id, { name: e.target.value })}
                  onBlur={() => handleSave(contact)}
                  placeholder="Nome completo"
                />
                <Input
                  label="Email"
                  type="email"
                  value={contact.email ?? ''}
                  onChange={(e) => handleUpdate(contact.id, { email: e.target.value || null })}
                  onBlur={() => handleSave(contact)}
                  placeholder="exemplo@email.com"
                />
                <Input
                  label="Telefone"
                  mask="phone"
                  value={contact.phone ?? ''}
                  onChange={(e) => handleUpdate(contact.id, { phone: e.target.value || null })}
                  onBlur={() => handleSave(contact)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => requestDelete(contact.id)}
                  className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Remover"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!confirmId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message="Tem certeza que deseja remover este contato? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
