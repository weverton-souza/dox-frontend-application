import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Customer, CustomerContact, Form, FormLink, MultiSendRecipient } from '@/types'
import { CUSTOMER_CONTACT_RELATION_LABELS } from '@/types'
import { getForms } from '@/lib/api/form-api'
import { getCustomerContacts } from '@/lib/api/customer-api'
import { multiSendFormLinks } from '@/lib/api/form-link-api'
import { useError } from '@/contexts/ErrorContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { getAvatarColor, getInitials } from '@/lib/avatar-utils'

interface MultiRespondentSendModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  initialFormId?: string
}

type Step = 'compose' | 'sending' | 'success'

interface RecipientRow {
  key: string
  selected: boolean
  type: 'customer' | 'contact'
  contactId?: string
  displayName: string
  relationLabel?: string
}

const EXPIRES_OPTIONS = [
  { value: '72', label: '3 dias' },
  { value: '168', label: '7 dias' },
  { value: '336', label: '14 dias' },
  { value: '720', label: '30 dias' },
]

function formatRelation(contact: CustomerContact): string {
  if (contact.relationType === 'parent') return 'Filiação'
  return CUSTOMER_CONTACT_RELATION_LABELS[contact.relationType] ?? 'Contato'
}

export default function MultiRespondentSendModal({
  isOpen,
  onClose,
  customer,
  initialFormId,
}: MultiRespondentSendModalProps) {
  const { showError } = useError()
  const [step, setStep] = useState<Step>('compose')
  const [forms, setForms] = useState<Form[]>([])
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [loading, setLoading] = useState(false)
  const [formId, setFormId] = useState<string>('')
  const [expiresInHours, setExpiresInHours] = useState<number>(168)
  const [rows, setRows] = useState<RecipientRow[]>([])
  const [createdLinks, setCreatedLinks] = useState<FormLink[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    Promise.all([getForms(), getCustomerContacts(customer.id)])
      .then(([formList, contactList]) => {
        if (cancelled) return
        setForms(formList)
        setContacts(contactList)
        if (initialFormId && formList.some((f) => f.id === initialFormId)) {
          setFormId(initialFormId)
        } else if (formList.length > 0) {
          setFormId(formList[0].id)
        }
        const eligible = contactList.filter((c) => c.canReceiveForms)
        setRows([
          {
            key: 'customer',
            selected: true,
            type: 'customer',
            displayName: customer.data.name || 'Cliente',
          },
          ...eligible.map((c) => ({
            key: c.id,
            selected: false,
            type: 'contact' as const,
            contactId: c.id,
            displayName: c.name,
            relationLabel: formatRelation(c),
          })),
        ])
      })
      .catch((err) => showError(err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, customer.id, customer.data.name, initialFormId, showError])

  const selectedCount = useMemo(() => rows.filter((r) => r.selected).length, [rows])

  const toggleRow = useCallback((key: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, selected: !r.selected } : r)))
  }, [])

  const handleSend = useCallback(async () => {
    if (!formId || selectedCount === 0) return
    const recipients: MultiSendRecipient[] = rows
      .filter((r) => r.selected)
      .map((r) =>
        r.type === 'customer'
          ? { respondentType: 'customer' }
          : { respondentType: 'contact', customerContactId: r.contactId! },
      )
    setStep('sending')
    try {
      const links = await multiSendFormLinks(formId, customer.id, recipients, expiresInHours)
      setCreatedLinks(links)
      setStep('success')
    } catch (err) {
      showError(err)
      setStep('compose')
    }
  }, [formId, selectedCount, rows, customer.id, expiresInHours, showError])

  const handleCopy = useCallback(async (link: FormLink) => {
    const url = `${window.location.origin}/public/forms/${link.token}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedId(link.id)
    setTimeout(() => setCopiedId((curr) => (curr === link.id ? null : curr)), 2000)
  }, [])

  const handleClose = useCallback(() => {
    setStep('compose')
    setRows([])
    setCreatedLinks([])
    setCopiedId(null)
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enviar formulário" size="lg">
      <div className="p-5 space-y-4">
        {step === 'compose' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Formulário</label>
                  <Select
                    value={formId}
                    onChange={(v) => setFormId(v)}
                    options={forms.map((f) => ({ value: f.id, label: f.title || '(sem título)' }))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Respondentes</label>
                    <span className="text-xs text-gray-400">{selectedCount} selecionado{selectedCount === 1 ? '' : 's'}</span>
                  </div>
                  {rows.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum respondente disponível</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                      {rows.map((row) => {
                        const initials = getInitials(row.displayName || '?')
                        const avatarColor = getAvatarColor(row.displayName || row.key)
                        return (
                          <button
                            key={row.key}
                            type="button"
                            onClick={() => toggleRow(row.key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              row.selected ? 'bg-brand-50/60' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span
                              className={`shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-semibold text-white`}
                            >
                              {initials}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{row.displayName || '(sem nome)'}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {row.type === 'customer' ? 'Cliente' : row.relationLabel || 'Contato'}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                row.selected ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                              }`}
                            >
                              {row.selected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {contacts.filter((c) => !c.canReceiveForms).length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Contatos com "Receber formulários" desabilitado não aparecem na lista.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Validade</label>
                  <Select
                    value={String(expiresInHours)}
                    onChange={(v) => setExpiresInHours(Number(v))}
                    options={EXPIRES_OPTIONS}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button onClick={handleSend} disabled={!formId || selectedCount === 0}>
                    Enviar {selectedCount > 0 ? `${selectedCount} formulário${selectedCount === 1 ? '' : 's'}` : ''}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'sending' && (
          <div className="text-center py-10">
            <div className="mx-auto animate-spin w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full mb-4" />
            <p className="text-sm text-gray-600">Gerando links...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-3">
            <div className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {createdLinks.length} {createdLinks.length === 1 ? 'link gerado' : 'links gerados'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Compartilhe com cada respondente</p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {createdLinks.map((link) => {
                const url = `${window.location.origin}/public/forms/${link.token}`
                const isCopied = copiedId === link.id
                return (
                  <div key={link.id} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium text-gray-900 truncate flex-1">
                        {link.respondent.name || '(sem nome)'}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {link.respondent.type === 'customer' ? 'Cliente' : link.respondent.relationType
                          ? CUSTOMER_CONTACT_RELATION_LABELS[link.respondent.relationType as keyof typeof CUSTOMER_CONTACT_RELATION_LABELS] ?? 'Contato'
                          : 'Contato'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <input
                        type="text"
                        readOnly
                        value={url}
                        className="flex-1 bg-transparent text-xs text-gray-600 border-0 focus:ring-0 focus:outline-none truncate"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-brand-500 text-white hover:bg-brand-600'
                        }`}
                      >
                        {isCopied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
