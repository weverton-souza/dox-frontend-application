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

interface RecipientOption {
  key: string
  type: 'customer' | 'contact'
  contactId?: string
  displayName: string
  relationLabel?: string
}

interface Envelope {
  id: string
  formId: string
  selectedKeys: Set<string>
}

interface EnvelopeResult {
  formId: string
  formTitle: string
  links: FormLink[]
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

function newEnvelope(formId: string, customerKey: string): Envelope {
  return {
    id: crypto.randomUUID(),
    formId,
    selectedKeys: new Set([customerKey]),
  }
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
  const [recipientOptions, setRecipientOptions] = useState<RecipientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [expiresInHours, setExpiresInHours] = useState<number>(168)
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [results, setResults] = useState<EnvelopeResult[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [partialError, setPartialError] = useState<string | null>(null)

  const customerKey = 'customer'

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    Promise.all([getForms(), getCustomerContacts(customer.id)])
      .then(([formList, contactList]) => {
        if (cancelled) return
        setForms(formList)
        const eligible = contactList.filter((c) => c.canReceiveForms)
        const options: RecipientOption[] = [
          {
            key: customerKey,
            type: 'customer',
            displayName: customer.data.name || 'Cliente',
          },
          ...eligible.map((c) => ({
            key: c.id,
            type: 'contact' as const,
            contactId: c.id,
            displayName: c.name,
            relationLabel: formatRelation(c),
          })),
        ]
        setRecipientOptions(options)

        const firstFormId =
          initialFormId && formList.some((f) => f.id === initialFormId)
            ? initialFormId
            : formList[0]?.id ?? ''
        setEnvelopes([newEnvelope(firstFormId, customerKey)])
      })
      .catch((err) => showError(err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, customer.id, customer.data.name, initialFormId, showError])

  const totalSelected = useMemo(
    () => envelopes.reduce((acc, env) => acc + env.selectedKeys.size, 0),
    [envelopes],
  )

  const canSend = useMemo(
    () => envelopes.length > 0 && envelopes.every((env) => env.formId && env.selectedKeys.size > 0),
    [envelopes],
  )

  const updateEnvelope = useCallback((id: string, patch: Partial<Envelope>) => {
    setEnvelopes((prev) => prev.map((env) => (env.id === id ? { ...env, ...patch } : env)))
  }, [])

  const toggleRecipient = useCallback((envelopeId: string, recipientKey: string) => {
    setEnvelopes((prev) =>
      prev.map((env) => {
        if (env.id !== envelopeId) return env
        const next = new Set(env.selectedKeys)
        if (next.has(recipientKey)) next.delete(recipientKey)
        else next.add(recipientKey)
        return { ...env, selectedKeys: next }
      }),
    )
  }, [])

  const handleAddEnvelope = useCallback(() => {
    const firstFormId = forms[0]?.id ?? ''
    setEnvelopes((prev) => [...prev, newEnvelope(firstFormId, customerKey)])
  }, [forms])

  const handleRemoveEnvelope = useCallback((id: string) => {
    setEnvelopes((prev) => (prev.length === 1 ? prev : prev.filter((env) => env.id !== id)))
  }, [])

  const handleSend = useCallback(async () => {
    if (!canSend) return
    setStep('sending')
    setPartialError(null)
    const collected: EnvelopeResult[] = []
    for (const env of envelopes) {
      const recipients: MultiSendRecipient[] = Array.from(env.selectedKeys).map((key) => {
        if (key === customerKey) return { respondentType: 'customer' }
        return { respondentType: 'contact', customerContactId: key }
      })
      const formTitle = forms.find((f) => f.id === env.formId)?.title || 'Formulário'
      try {
        const links = await multiSendFormLinks(env.formId, customer.id, recipients, expiresInHours)
        collected.push({ formId: env.formId, formTitle, links })
      } catch (err) {
        showError(err)
        if (collected.length > 0) {
          setPartialError(
            `Alguns envelopes foram enviados (${collected.length} de ${envelopes.length}). O envelope "${formTitle}" falhou — tente novamente.`,
          )
          setResults(collected)
          setStep('success')
        } else {
          setStep('compose')
        }
        return
      }
    }
    setResults(collected)
    setStep('success')
  }, [canSend, envelopes, forms, customer.id, expiresInHours, showError])

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
    setEnvelopes([])
    setResults([])
    setCopiedId(null)
    setPartialError(null)
    onClose()
  }, [onClose])

  const totalLinks = useMemo(
    () => results.reduce((acc, r) => acc + r.links.length, 0),
    [results],
  )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enviar formulários" size="xl">
      <div className="p-5 space-y-4">
        {step === 'compose' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {envelopes.map((env, idx) => (
                    <EnvelopeCard
                      key={env.id}
                      index={idx}
                      envelope={env}
                      forms={forms}
                      recipients={recipientOptions}
                      canRemove={envelopes.length > 1}
                      onChangeForm={(formId) => updateEnvelope(env.id, { formId })}
                      onToggleRecipient={(key) => toggleRecipient(env.id, key)}
                      onRemove={() => handleRemoveEnvelope(env.id)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddEnvelope}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-all"
                >
                  + Adicionar formulário
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Validade</label>
                  <Select
                    value={String(expiresInHours)}
                    onChange={(v) => setExpiresInHours(Number(v))}
                    options={EXPIRES_OPTIONS}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {envelopes.length} formulário{envelopes.length === 1 ? '' : 's'} · {totalSelected} link{totalSelected === 1 ? '' : 's'} a gerar
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSend} disabled={!canSend}>
                      Enviar {totalSelected > 0 ? `${totalSelected} link${totalSelected === 1 ? '' : 's'}` : ''}
                    </Button>
                  </div>
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
                {totalLinks} {totalLinks === 1 ? 'link gerado' : 'links gerados'} em {results.length} formulário{results.length === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Compartilhe com cada respondente</p>
            </div>

            {partialError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                {partialError}
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div key={result.formId} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 truncate">{result.formTitle}</p>
                    <p className="text-xs text-gray-500">{result.links.length} respondente{result.links.length === 1 ? '' : 's'}</p>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {result.links.map((link) => {
                      const url = `${window.location.origin}/public/forms/${link.token}`
                      const isCopied = copiedId === link.id
                      const respondentLabel = link.respondent.type === 'customer'
                        ? 'Cliente'
                        : link.respondent.relationType
                        ? CUSTOMER_CONTACT_RELATION_LABELS[link.respondent.relationType as keyof typeof CUSTOMER_CONTACT_RELATION_LABELS] ?? 'Contato'
                        : 'Contato'
                      return (
                        <li key={link.id} className="p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-medium text-gray-900 truncate flex-1">
                              {link.respondent.name || '(sem nome)'}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">{respondentLabel}</span>
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
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
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

interface EnvelopeCardProps {
  index: number
  envelope: Envelope
  forms: Form[]
  recipients: RecipientOption[]
  canRemove: boolean
  onChangeForm: (formId: string) => void
  onToggleRecipient: (key: string) => void
  onRemove: () => void
}

function EnvelopeCard({
  index,
  envelope,
  forms,
  recipients,
  canRemove,
  onChangeForm,
  onToggleRecipient,
  onRemove,
}: EnvelopeCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Formulário {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
          >
            Remover
          </button>
        )}
      </div>

      <Select
        value={envelope.formId}
        onChange={onChangeForm}
        options={forms.map((f) => ({ value: f.id, label: f.title || '(sem título)' }))}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Respondentes</span>
          <span className="text-xs text-gray-400">
            {envelope.selectedKeys.size} selecionado{envelope.selectedKeys.size === 1 ? '' : 's'}
          </span>
        </div>
        {recipients.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-3">Nenhum respondente disponível</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
            {recipients.map((row) => {
              const initials = getInitials(row.displayName || '?')
              const avatarColor = getAvatarColor(row.displayName || row.key)
              const selected = envelope.selectedKeys.has(row.key)
              return (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => onToggleRecipient(row.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    selected ? 'bg-brand-50/60' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-semibold text-white`}
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
                      selected ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                    }`}
                  >
                    {selected && (
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
      </div>
    </div>
  )
}
