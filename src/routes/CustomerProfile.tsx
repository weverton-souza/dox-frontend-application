import { useState, useEffect, useCallback, useOptimistic, startTransition } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import type {
  Customer,
  CustomerData,
  CustomerNote,
  CustomerEvent,
  CustomerEventType,
  AggregatedFormGroup,
  AggregatedRespondent,
  FormLinkStatus,
  Report,
} from '@/types'
import {
  createEmptyCustomerEvent,
  CUSTOMER_EVENT_TYPE_LABELS,
  CUSTOMER_EVENT_TYPE_COLORS,
  CUSTOMER_CONTACT_RELATION_LABELS,
} from '@/types'
import {
  getCustomer,
  updateCustomer,
  getCustomerNotes,
  createCustomerNote,
  deleteCustomerNote as apiDeleteCustomerNote,
  getCustomerEvents,
  createCustomerEvent,
  deleteCustomerEvent as apiDeleteCustomerEvent,
} from '@/lib/api/customer-api'
import { getReportsByCustomer } from '@/lib/api/report-api'
import { revokeFormLink, resendFormLinkInvite } from '@/lib/api/form-link-api'
import { MAX_MANUAL_RESENDS } from '@/types'
import { getAggregatedForms } from '@/lib/api/customer-forms-api'
import { formatDateTime, calculateAge, getNowIso, todayIso } from '@/lib/utils'
import { useCreateReport } from '@/lib/hooks/use-create-report'
import { useCustomerLabel } from '@/lib/hooks/useCustomerLabel'
import { useError } from '@/contexts/ErrorContext'
import NewReportModal from '@/components/NewReportModal'
import MultiRespondentSendModal from '@/components/form-builder/MultiRespondentSendModal'
import FormLinkHistoryModal from '@/components/form-builder/FormLinkHistoryModal'
import Input from '@/components/ui/Input'
import DatePicker from '@/components/ui/DatePicker'
import TextArea from '@/components/ui/TextArea'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import ListCard, { ListCardPill } from '@/components/ui/ListCard'
import CustomerContactsTab from '@/components/customer/CustomerContactsTab'
import AssessmentsTab from '@/components/assessments/AssessmentsTab'
import ClinicalTab from '@/components/customers/ClinicalTab'
import { TrashIcon } from '@/components/icons'
import { getAvatarColor, getInitials } from '@/lib/avatar-utils'

// ========== Types ==========

type ProfileSection = 'personal' | 'clinical' | 'contacts' | 'reports' | 'assessments' | 'forms' | 'notes' | 'timeline'

interface TabItem {
  key: ProfileSection
  label: string
  icon: React.ReactNode
}

// ========== Tabs config ==========

const TABS: TabItem[] = [
  { key: 'personal', label: 'Dados Pessoais', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { key: 'clinical', label: 'Dados Clínicos', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { key: 'contacts', label: 'Pessoas Relacionadas', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: 'reports', label: 'Relatórios', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { key: 'assessments', label: 'Avaliações', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { key: 'forms', label: 'Formulários', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg> },
  { key: 'notes', label: 'Notas', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { key: 'timeline', label: 'Prontuário', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
]

const EVENT_TYPE_OPTIONS: { value: CustomerEventType; label: string }[] = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'retorno', label: 'Retorno' },
  { value: 'avaliacao', label: 'Avaliação' },
  { value: 'laudo', label: 'Relatório' },
  { value: 'observacao', label: 'Observação' },
]

// ========== Timeline helpers ==========

function groupEventsByMonth(events: CustomerEvent[]): { label: string; events: CustomerEvent[] }[] {
  const groups: Map<string, CustomerEvent[]> = new Map()

  for (const event of events) {
    const d = new Date(event.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(event)
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, evts]) => ({
      label: new Date(evts[0].date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      events: evts,
    }))
}

// ========== Component ==========

const VALID_SECTIONS: readonly ProfileSection[] = [
  'personal', 'clinical', 'contacts', 'reports', 'assessments', 'forms', 'notes', 'timeline',
]

function parseSection(raw: string | null): ProfileSection {
  if (raw && (VALID_SECTIONS as readonly string[]).includes(raw)) {
    return raw as ProfileSection
  }
  return 'personal'
}

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showError } = useError()
  const { singular: customerLabel, plural: customersLabel } = useCustomerLabel()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [editData, setEditData] = useState<CustomerData | null>(null)
  const [activeSection, setActiveSection] = useState<ProfileSection>(() => parseSection(searchParams.get('tab')))
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Reports
  const [reports, setReports] = useState<Report[]>([])
  const { isModalOpen: showNewReportModal, showModal: showReportModal, hideModal: hideReportModal, createBlank, createFromTemplate } = useCreateReport()

  // Notes
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [optimisticNotes, addOptimisticNote] = useOptimistic(
    notes,
    (current: CustomerNote[], optimistic: CustomerNote) => [optimistic, ...current],
  )

  // Timeline
  const [events, setEvents] = useState<CustomerEvent[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState<CustomerEvent | null>(null)

  // Forms
  const [formGroups, setFormGroups] = useState<AggregatedFormGroup[]>([])
  const [formsLoading, setFormsLoading] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  const handleSectionChange = useCallback((section: ProfileSection) => {
    setActiveSection(section)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (section === 'personal') next.delete('tab')
      else next.set('tab', section)
      return next
    }, { replace: true })
  }, [setSearchParams])

  // Load customer
  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const [p, customerReports, customerNotes, customerEvents] = await Promise.all([
          getCustomer(id!),
          getReportsByCustomer(id!),
          getCustomerNotes(id!),
          getCustomerEvents(id!),
        ])
        setCustomer(p)
        setEditData({ ...p.data })
        setReports(customerReports)
        setNotes(customerNotes)
        setEvents(customerEvents)
      } catch (err) {
        showError(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, showError])

  // ========== Handlers ==========

  const updateField = useCallback(
    (field: keyof CustomerData, value: string) => {
      setEditData((prev) => (prev ? { ...prev, [field]: value } : prev))
    },
    []
  )

  const handleSaveSection = useCallback(async () => {
    if (!customer || !editData) return
    setSaving(true)
    try {
      const updated: Customer = {
        ...customer,
        data: { ...editData },
        updatedAt: getNowIso(),
      }
      await updateCustomer(updated)
      setCustomer(updated)
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }, [customer, editData, showError])

  const handleSavePatch = useCallback(async (patch: Partial<CustomerData>) => {
    if (!customer || !editData) return
    setSaving(true)
    try {
      const mergedData: CustomerData = { ...editData, ...patch }
      const updated: Customer = {
        ...customer,
        data: mergedData,
        updatedAt: getNowIso(),
      }
      await updateCustomer(updated)
      setCustomer(updated)
      setEditData(mergedData)
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }, [customer, editData, showError])

  const handleCreateReport = useCallback(() => {
    if (!customer) return
    showReportModal(customer)
  }, [customer, showReportModal])

  const handleAddNote = useCallback(async () => {
    if (!customer || !newNoteContent.trim()) return
    const content = newNoteContent.trim()
    const now = getNowIso()
    const optimisticNote: CustomerNote = {
      id: `optimistic-${crypto.randomUUID()}`,
      customerId: customer.id,
      createdAt: now,
      updatedAt: now,
      content,
    }
    setNewNoteContent('')
    startTransition(async () => {
      addOptimisticNote(optimisticNote)
      try {
        await createCustomerNote(customer.id, { content })
        const updatedNotes = await getCustomerNotes(customer.id)
        setNotes(updatedNotes)
      } catch (err) {
        showError(err)
      }
    })
  }, [customer, newNoteContent, addOptimisticNote, showError])

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (!customer) return
      try {
        await apiDeleteCustomerNote(customer.id, noteId)
        const updatedNotes = await getCustomerNotes(customer.id)
        setNotes(updatedNotes)
      } catch (err) {
        showError(err)
      }
    },
    [customer, showError]
  )

  // Timeline handlers
  const handleOpenEventForm = useCallback(() => {
    if (!customer) return
    setNewEvent(createEmptyCustomerEvent(customer.id))
    setShowEventForm(true)
  }, [customer])

  const handleSaveEvent = useCallback(async () => {
    if (!customer || !newEvent || !newEvent.title.trim()) return
    try {
      await createCustomerEvent(customer.id, newEvent)
      const updatedEvents = await getCustomerEvents(customer.id)
      setEvents(updatedEvents)
      setShowEventForm(false)
      setNewEvent(null)
    } catch (err) {
      showError(err)
    }
  }, [customer, newEvent, showError])

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      if (!customer) return
      try {
        await apiDeleteCustomerEvent(customer.id, eventId)
        const updatedEvents = await getCustomerEvents(customer.id)
        setEvents(updatedEvents)
      } catch (err) {
        showError(err)
      }
    },
    [customer, showError]
  )

  // Forms handlers
  const loadFormGroups = useCallback(async () => {
    if (!customer) return
    setFormsLoading(true)
    try {
      const groups = await getAggregatedForms(customer.id)
      setFormGroups(groups)
    } catch (err) {
      showError(err)
    } finally {
      setFormsLoading(false)
    }
  }, [customer, showError])

  useEffect(() => {
    if (activeSection === 'forms' && customer) {
      loadFormGroups()
    }
  }, [activeSection, customer, loadFormGroups])

  const handleRevokeLink = useCallback(
    async (linkId: string) => {
      try {
        await revokeFormLink(linkId)
        await loadFormGroups()
      } catch (err) {
        showError(err)
      }
    },
    [loadFormGroups, showError]
  )

  const [resendingLinkId, setResendingLinkId] = useState<string | null>(null)
  const [historyTarget, setHistoryTarget] = useState<{ linkId: string; respondentName: string | null } | null>(null)

  const handleResendInvite = useCallback(
    async (linkId: string) => {
      const ok = window.confirm('Reenviar email de convite para este respondente?')
      if (!ok) return
      setResendingLinkId(linkId)
      try {
        await resendFormLinkInvite(linkId)
        await loadFormGroups()
      } catch (err) {
        showError(err)
      } finally {
        setResendingLinkId(null)
      }
    },
    [loadFormGroups, showError]
  )

  const handleSendModalClose = useCallback(() => {
    setShowSendModal(false)
    if (activeSection === 'forms') loadFormGroups()
  }, [activeSection, loadFormGroups])

  // ========== Loading / Not found ==========

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!customer || !editData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">{customerLabel} não encontrado(a)</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => navigate('/customers')}
          >
            Voltar para {customersLabel}
          </Button>
        </div>
      </div>
    )
  }

  // ========== Avatar ==========

  const initials = getInitials(customer.data.name || '?')
  const avatarColor = getAvatarColor(customer.data.name || customer.id)

  // ========== Render sections ==========

  function renderPersonalSection() {
    return (
      <div className="space-y-6">
        <SectionCard title="Identificação" onSave={handleSaveSection} saving={saving}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome completo" value={editData!.name} onChange={(e) => updateField('name', e.target.value)} />
            <Input label="CPF" value={editData!.cpf} onChange={(e) => updateField('cpf', e.target.value)} mask="cpf" />
            <DatePicker label="Data de Nascimento" value={editData!.birthDate} onChange={(value) => { updateField('birthDate', value); updateField('age', calculateAge(value)) }} min="1950-01-01" max={todayIso()} />
            <Input label="Idade" value={editData!.age} onChange={(e) => updateField('age', e.target.value)} placeholder="Ex: 32 anos e 4 meses" readOnly />
            <Input label="Escolaridade" value={editData!.education} onChange={(e) => updateField('education', e.target.value)} />
            <Input label="Profissão" value={editData!.profession} onChange={(e) => updateField('profession', e.target.value)} />
          </div>
        </SectionCard>

        <SectionCard title="Contato" onSave={handleSaveSection} saving={saving}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Telefone" value={editData!.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} mask="phone" />
            <Input label="E-mail" type="email" value={editData!.email ?? ''} onChange={(e) => updateField('email', e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Rua / Endereço" value={editData!.addressStreet ?? ''} onChange={(e) => updateField('addressStreet', e.target.value)} />
            </div>
            <Input label="Cidade" value={editData!.addressCity ?? ''} onChange={(e) => updateField('addressCity', e.target.value)} />
            <Input label="Estado" value={editData!.addressState ?? ''} onChange={(e) => updateField('addressState', e.target.value)} />
            <Input label="CEP" value={editData!.addressZipCode ?? ''} onChange={(e) => updateField('addressZipCode', e.target.value)} mask="cep" />
          </div>
        </SectionCard>
      </div>
    )
  }

  function renderClinicalSection() {
    if (!editData || !id) return null
    return (
      <ClinicalTab
        customerId={id}
        data={editData}
        saving={saving}
        onSavePatch={handleSavePatch}
      />
    )
  }

  function renderReportsSection() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Relatórios</h2>
          <Button size="sm" onClick={handleCreateReport}>+ Novo Relatório</Button>
        </div>
        {reports.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Nenhum relatório</p>
            <p className="text-xs text-gray-500 mt-1">Crie o primeiro relatório para este cliente</p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={handleCreateReport}>Criar relatório</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <ListCard
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                title={report.customerName || 'Relatório'}
                pills={
                  <>
                    <ListCardPill>{formatDateTime(report.createdAt)}</ListCardPill>
                    <ListCardPill>{report.blocks.length} {report.blocks.length === 1 ? 'bloco' : 'blocos'}</ListCardPill>
                  </>
                }
                badges={<StatusBadge status={report.status} />}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderContactsSection() {
    if (!id) return null
    return <CustomerContactsTab customerId={id} />
  }

  function renderFormsSection() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Formulários</h2>
          <Button size="sm" onClick={() => setShowSendModal(true)}>+ Enviar formulário</Button>
        </div>

        {formsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : formGroups.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M8 9h8"/>
                <path d="M8 13h8"/>
                <path d="M8 17h5"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Nenhum formulário enviado</p>
            <p className="text-xs text-gray-500 mt-1">Envie formulários para o cliente ou contatos cadastrados</p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setShowSendModal(true)}>Enviar formulário</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {formGroups.map((group) => {
              const answeredCount = group.respondents.filter((r) => r.status === 'answered').length
              const canOpen = answeredCount >= 1
              const buttonLabel = answeredCount >= 2 ? 'Comparar respostas' : 'Ver resposta'
              const goToView = () =>
                navigate(`/customers/${id}/forms/${group.form.id}/comparison?versionId=${group.version.id}`)
              return (
                <div key={`${group.form.id}:${group.version.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {group.form.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        v{group.version.versionLabel} · enviado em {formatDateTime(group.sentAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">
                        {group.respondents.length} respondente{group.respondents.length === 1 ? '' : 's'}
                      </span>
                      {canOpen && (
                        <Button variant="ghost" size="sm" onClick={goToView}>
                          {buttonLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {group.respondents.map((r) => {
                      const isAnswered = r.status === 'answered'
                      return (
                        <li
                          key={r.linkId}
                          onClick={isAnswered ? goToView : undefined}
                          className={`py-2.5 flex items-center gap-3 ${
                            isAnswered ? 'cursor-pointer hover:bg-gray-50/60 rounded-md -mx-2 px-2' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {r.respondentName || '(sem nome)'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatAggregatedLabel(r, customerLabel)} · {isAnswered && r.submittedAt
                                ? `respondido em ${formatDateTime(r.submittedAt)}`
                                : r.status === 'pending' && typeof r.progressPercent === 'number'
                                ? formatProgress(r)
                                : r.status === 'pending' && r.firstViewedAt
                                ? `visto em ${formatDateTime(r.firstViewedAt)}`
                                : `expira em ${formatDateTime(r.expiresAt)}`}
                            </p>
                            {r.status === 'pending' && typeof r.progressPercent === 'number' && (
                              <div className="mt-1.5 h-1 w-full max-w-xs bg-gray-100 rounded overflow-hidden">
                                <div
                                  className="h-full bg-brand-500 transition-all"
                                  style={{ width: `${r.progressPercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <FormLinkStatusPill status={r.status} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setHistoryTarget({ linkId: r.linkId, respondentName: r.respondentName })
                            }}
                            className="text-xs text-gray-400 hover:text-brand-600 px-2 py-1 rounded transition-colors"
                            title="Ver histórico de emails"
                          >
                            Histórico
                          </button>
                          {r.status === 'pending' && r.recipientEmail && r.manualResendCount < MAX_MANUAL_RESENDS && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResendInvite(r.linkId)
                              }}
                              disabled={resendingLinkId === r.linkId}
                              className="text-xs text-gray-500 hover:text-brand-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
                              title={`Reenviar email · ${MAX_MANUAL_RESENDS - r.manualResendCount} restante${MAX_MANUAL_RESENDS - r.manualResendCount === 1 ? '' : 's'}`}
                            >
                              {resendingLinkId === r.linkId ? 'Reenviando…' : 'Reenviar'}
                            </button>
                          )}
                          {r.status === 'pending' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRevokeLink(r.linkId)
                              }}
                              className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
                              title="Revogar link"
                            >
                              Revogar
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function renderNotesSection() {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Notas de Acompanhamento</h2>
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <TextArea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Escreva uma nota de acompanhamento..." className="min-h-[60px]" />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>Adicionar Nota</Button>
          </div>
        </div>
        {optimisticNotes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm text-gray-500">Nenhuma nota ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {optimisticNotes.map((note) => (
              <div key={note.id} className="rounded-lg border border-gray-200 p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">
                      {formatDateTime(note.createdAt)}
                      {note.updatedAt !== note.createdAt && <span className="ml-1">(editado)</span>}
                    </p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <button onClick={() => handleDeleteNote(note.id)} className="shrink-0 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" title="Excluir nota">
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

  function renderTimelineSection() {
    const grouped = groupEventsByMonth(events)

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Histórico</h2>
          <Button size="sm" onClick={handleOpenEventForm}>+ Novo Evento</Button>
        </div>

        {/* New event form */}
        {showEventForm && newEvent && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Novo evento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CustomerEventType })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                >
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Data e Hora"
                type="datetime-local"
                value={newEvent.date.slice(0, 16)}
                onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value).toISOString() })}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Título"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Ex: Primeira consulta de avaliação"
                />
              </div>
              <div className="sm:col-span-2">
                <TextArea
                  label="Descrição (opcional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Observações sobre o evento..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowEventForm(false); setNewEvent(null) }}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEvent} disabled={!newEvent.title.trim()}>
                Salvar Evento
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {events.length === 0 && !showEventForm ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Nenhum evento registrado</p>
            <p className="text-xs text-gray-400 mt-1">Registre consultas, retornos e avaliações</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={handleOpenEventForm}>
              Registrar primeiro evento
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Vertical timeline */}
                <ol className="relative border-l-2 border-gray-200 ml-3">
                  {group.events.map((event) => {
                    const dotColor = CUSTOMER_EVENT_TYPE_COLORS[event.type]
                    const typeLabel = CUSTOMER_EVENT_TYPE_LABELS[event.type]
                    const eventDate = new Date(event.date)
                    const timeStr = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    const dateStr = eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

                    return (
                      <li key={event.id} className="mb-6 ml-6 group">
                        {/* Dot */}
                        <span className={`absolute -left-[9px] w-4 h-4 rounded-full ${dotColor} ring-4 ring-white`} />

                        {/* Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Type badge + time */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${dotColor}`}>
                                  {typeLabel}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {dateStr} às {timeStr}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="text-sm font-medium text-gray-900">
                                {event.title}
                              </h4>

                              {/* Description */}
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="shrink-0 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Excluir evento"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderAssessmentsSection() {
    if (!id || !customer) return null
    return <AssessmentsTab customerId={id} customerName={customer.data.name ?? ''} />
  }

  const sectionRenderers: Record<ProfileSection, () => React.ReactNode> = {
    personal: renderPersonalSection,
    clinical: renderClinicalSection,
    contacts: renderContactsSection,
    reports: renderReportsSection,
    assessments: renderAssessmentsSection,
    forms: renderFormsSection,
    notes: renderNotesSection,
    timeline: renderTimelineSection,
  }

  // ========== Main Render ==========

  const lastSession = findLastSession(events)
  const ageShort = formatAgeShort(customer.data.age)

  return (
    <div className="flex-1 flex flex-col">
      {/* Profile hero */}
      <div className="bg-gradient-to-b from-gray-50/60 to-white border-b border-gray-200">
        {/* Breadcrumb */}
        <div className="max-w-page mx-auto px-page pt-5 pb-2">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/customers')}
              className="text-gray-400 hover:text-brand-600 transition-colors"
            >
              {customersLabel}
            </button>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-300">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900 font-medium truncate">
              {customer.data.name || 'Sem nome'}
            </span>
          </div>
        </div>

        {/* Profile card */}
        <div className="max-w-page mx-auto px-page py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="shrink-0">
              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-xl shadow-gray-300/40 ring-1 ring-black/5`}>
                {initials}
              </div>
            </div>

            {/* Quick info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 truncate" title={`Cadastrado em ${formatDateTime(customer.createdAt)}`}>
                {customer.data.name || `${customerLabel} sem nome`}
              </h1>

              {/* Pills row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {ageShort && (
                  <HeroPill variant="brand" icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  }>
                    {ageShort}
                  </HeroPill>
                )}
                {customer.data.profession && (
                  <HeroPill variant="neutral">
                    {customer.data.profession}
                  </HeroPill>
                )}
                {lastSession && (
                  <HeroPill variant="neutral" icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><polyline points="12 7 12 12 15 14"/></svg>
                  }>
                    Última sessão · {formatRelativeDate(lastSession)}
                  </HeroPill>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                <StatChip
                  count={reports.length}
                  label={reports.length === 1 ? 'relatório' : 'relatórios'}
                  tint="brand"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  }
                />
                <StatChip
                  count={notes.length + events.length}
                  label={notes.length + events.length === 1 ? 'registro' : 'registros'}
                  tint="amber"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-page mx-auto px-page">
          <nav className="flex gap-2 -mb-px overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeSection === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => handleSectionChange(tab.key)}
                  title={tab.label}
                  className={`
                    flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap rounded-t-md
                    transition-colors duration-200
                    ${isActive
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
                    }
                  `.trim()}
                >
                  <span className={isActive ? 'text-brand-600' : 'text-gray-400'}>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 bg-gray-50/50">
        <div className="max-w-page mx-auto px-page py-6">
          {sectionRenderers[activeSection]()}
        </div>
      </div>

      {customer && (
        <NewReportModal
          isOpen={showNewReportModal}
          onClose={hideReportModal}
          customer={customer}
          onSelectTemplate={createFromTemplate}
          onSelectBlank={createBlank}
        />
      )}

      {customer && showSendModal && (
        <MultiRespondentSendModal
          isOpen={showSendModal}
          onClose={handleSendModalClose}
          customer={customer}
        />
      )}

      <FormLinkHistoryModal
        isOpen={historyTarget !== null}
        onClose={() => setHistoryTarget(null)}
        linkId={historyTarget?.linkId ?? null}
        respondentName={historyTarget?.respondentName ?? null}
      />
    </div>
  )
}

// ========== Hero helpers ==========

const SESSION_EVENT_TYPES: ReadonlyArray<CustomerEventType> = ['consulta', 'retorno', 'avaliacao']

function findLastSession(events: CustomerEvent[]): string | null {
  const now = Date.now()
  const past = events
    .filter((e) => SESSION_EVENT_TYPES.includes(e.type) && new Date(e.date).getTime() <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return past[0]?.date ?? null
}

function formatAgeShort(age: string): string {
  const trimmed = age.trim()
  if (!trimmed) return ''
  const yearsMatch = trimmed.match(/(\d+)\s*ano/i)
  if (yearsMatch) return `${yearsMatch[1]} anos`
  return trimmed
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays < 1) return 'hoje'
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `há ${diffDays} dias`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? 'há 1 mês' : `há ${months} meses`
  }
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function HeroPill({
  children,
  icon,
  variant,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  variant: 'brand' | 'neutral'
}) {
  const styles = variant === 'brand'
    ? 'bg-brand-50 text-brand-700 border-brand-100'
    : 'bg-white text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles}`}>
      {icon && <span className="opacity-80">{icon}</span>}
      {children}
    </span>
  )
}

function StatChip({
  count,
  label,
  icon,
  tint,
}: {
  count: number
  label: string
  icon: React.ReactNode
  tint: 'brand' | 'amber'
}) {
  const iconBg = tint === 'brand' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'
  return (
    <div className="inline-flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold text-gray-900">{count}</p>
        <p className="text-xs text-gray-500 -mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ========== Forms helpers ==========

function formatProgress(r: AggregatedRespondent): string {
  const pct = r.progressPercent ?? 0
  const parts: string[] = [`${pct}% respondido`]
  if (typeof r.currentPageIndex === 'number' && typeof r.totalPages === 'number' && r.totalPages > 1) {
    parts.push(`página ${r.currentPageIndex + 1} de ${r.totalPages}`)
  }
  if (r.lastDraftSavedAt) {
    parts.push(formatRelativeTime(r.lastDraftSavedAt))
  }
  return parts.join(' · ')
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora há pouco'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `há ${diffHr}h`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return 'ontem'
  return `há ${diffDays} dias`
}

function formatAggregatedLabel(r: AggregatedRespondent, customerLabel: string): string {
  if (r.respondentType === 'customer') return customerLabel
  if (r.respondentType === 'professional') return 'Profissional'
  const rt = r.relationType as keyof typeof CUSTOMER_CONTACT_RELATION_LABELS | undefined
  if (rt && CUSTOMER_CONTACT_RELATION_LABELS[rt]) {
    return rt === 'parent' ? 'Filiação' : CUSTOMER_CONTACT_RELATION_LABELS[rt]
  }
  return 'Contato'
}

function FormLinkStatusPill({ status }: { status: FormLinkStatus }) {
  const config: Record<FormLinkStatus, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60' },
    answered: { label: 'Respondido', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60' },
    expired: { label: 'Expirado', className: 'bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200' },
  }
  const c = config[status] ?? { label: status, className: 'bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${c.className}`}>{c.label}</span>
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
        <Button size="sm" variant="secondary" onClick={onSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      <div className="px-6 sm:px-8 py-6">
        {children}
      </div>
    </div>
  )
}
