import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type {
  Customer,
  CustomerData,
  CustomerNote,
  CustomerEvent,
  CustomerEventType,
  Report,
} from '@/types'
import {
  createEmptyCustomerEvent,
  CUSTOMER_EVENT_TYPE_LABELS,
  CUSTOMER_EVENT_TYPE_COLORS,
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
import { formatDateTime } from '@/lib/utils'
import { createReportFromCustomer, createReportFromTemplate } from '@/lib/report-utils'
import { useError } from '@/contexts/ErrorContext'
import NewReportModal from '@/components/NewReportModal'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import StatusBadge from '@/components/ui/StatusBadge'
import ListCard, { ListCardPill } from '@/components/ui/ListCard'
import { TrashIcon } from '@/components/icons'

// ========== Types ==========

type ProfileSection = 'personal' | 'contact' | 'clinical' | 'reports' | 'notes' | 'timeline'

interface TabItem {
  key: ProfileSection
  label: string
  icon: React.ReactNode
}

// ========== Avatar ==========

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-teal-400 to-teal-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
  'from-indigo-400 to-indigo-600',
  'from-emerald-400 to-emerald-600',
  'from-cyan-400 to-cyan-600',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

// ========== Tabs config ==========

const TABS: TabItem[] = [
  { key: 'personal', label: 'Dados Pessoais', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { key: 'contact', label: 'Contato', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
  { key: 'clinical', label: 'Dados Clínicos', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { key: 'reports', label: 'Relatórios', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { key: 'notes', label: 'Notas', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { key: 'timeline', label: 'Histórico', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
]

const EVENT_TYPE_OPTIONS: { value: CustomerEventType; label: string }[] = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'retorno', label: 'Retorno' },
  { value: 'avaliacao', label: 'Avaliação' },
  { value: 'laudo', label: 'Laudo' },
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

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showError } = useError()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [editData, setEditData] = useState<CustomerData | null>(null)
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Reports
  const [reports, setReports] = useState<Report[]>([])
  const [showNewReportModal, setShowNewReportModal] = useState(false)

  // Notes
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')

  // Timeline
  const [events, setEvents] = useState<CustomerEvent[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState<CustomerEvent | null>(null)

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
        updatedAt: new Date().toISOString(),
      }
      await updateCustomer(updated)
      setCustomer(updated)
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }, [customer, editData, showError])

  const handleCreateReport = useCallback(() => {
    if (!customer) return
    setShowNewReportModal(true)
  }, [customer])

  const handleCreateBlankReport = useCallback(async () => {
    if (!customer) return
    try {
      const report = await createReportFromCustomer(customer)
      navigate(`/reports/${report.id}`)
    } catch (err) {
      showError(err)
    }
  }, [customer, navigate, showError])

  const handleCreateFromTemplate = useCallback(async (template: import('@/types').ReportTemplate) => {
    if (!customer) return
    try {
      const report = await createReportFromTemplate(customer, template)
      navigate(`/reports/${report.id}`)
    } catch (err) {
      showError(err)
    }
  }, [customer, navigate, showError])

  const handleAddNote = useCallback(async () => {
    if (!customer || !newNoteContent.trim()) return
    try {
      await createCustomerNote(customer.id, { content: newNoteContent.trim() })
      const updatedNotes = await getCustomerNotes(customer.id)
      setNotes(updatedNotes)
      setNewNoteContent('')
    } catch (err) {
      showError(err)
    }
  }, [customer, newNoteContent, showError])

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
          <p className="text-gray-500 text-sm">Cliente não encontrado</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => navigate('/customers')}
          >
            Voltar para Clientes
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
      <SectionCard title="Dados Pessoais" onSave={handleSaveSection} saving={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome completo" value={editData!.name} onChange={(e) => updateField('name', e.target.value)} />
          <Input label="CPF" value={editData!.cpf} onChange={(e) => updateField('cpf', e.target.value)} />
          <Input label="Data de Nascimento" type="date" value={editData!.birthDate} onChange={(e) => updateField('birthDate', e.target.value)} />
          <Input label="Idade" value={editData!.age} onChange={(e) => updateField('age', e.target.value)} placeholder="Ex: 32 anos e 4 meses" />
          <Input label="Escolaridade" value={editData!.education} onChange={(e) => updateField('education', e.target.value)} />
          <Input label="Profissão" value={editData!.profession} onChange={(e) => updateField('profession', e.target.value)} />
          <Input label="Nome da Mãe" value={editData!.motherName} onChange={(e) => updateField('motherName', e.target.value)} />
          <Input label="Nome do Pai" value={editData!.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} />
          <Input label="Responsável Legal" value={editData!.guardianName ?? ''} onChange={(e) => updateField('guardianName', e.target.value)} />
          <Input label="Parentesco" value={editData!.guardianRelationship ?? ''} onChange={(e) => updateField('guardianRelationship', e.target.value)} />
        </div>
      </SectionCard>
    )
  }

  function renderContactSection() {
    return (
      <SectionCard title="Contato" onSave={handleSaveSection} saving={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Telefone" value={editData!.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} placeholder="(31) 99999-0000" />
          <Input label="E-mail" type="email" value={editData!.email ?? ''} onChange={(e) => updateField('email', e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Rua / Endereço" value={editData!.addressStreet ?? ''} onChange={(e) => updateField('addressStreet', e.target.value)} />
          </div>
          <Input label="Cidade" value={editData!.addressCity ?? ''} onChange={(e) => updateField('addressCity', e.target.value)} />
          <Input label="Estado" value={editData!.addressState ?? ''} onChange={(e) => updateField('addressState', e.target.value)} />
          <Input label="CEP" value={editData!.addressZipCode ?? ''} onChange={(e) => updateField('addressZipCode', e.target.value)} placeholder="00000-000" />
        </div>
      </SectionCard>
    )
  }

  function renderClinicalSection() {
    return (
      <SectionCard title="Dados Clínicos" onSave={handleSaveSection} saving={saving}>
        <div className="space-y-4">
          <TextArea label="Queixa Principal" value={editData!.chiefComplaint ?? ''} onChange={(e) => updateField('chiefComplaint', e.target.value)} placeholder="Descreva a queixa principal do cliente..." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Diagnóstico" value={editData!.diagnosis ?? ''} onChange={(e) => updateField('diagnosis', e.target.value)} />
            <Input label="Médico Solicitante" value={editData!.referralDoctor ?? ''} onChange={(e) => updateField('referralDoctor', e.target.value)} />
          </div>
          <TextArea label="Medicações" value={editData!.medications ?? ''} onChange={(e) => updateField('medications', e.target.value)} placeholder="Liste as medicações em uso..." />
        </div>
      </SectionCard>
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
        {notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm text-gray-500">Nenhuma nota ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
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

  const sectionRenderers: Record<ProfileSection, () => React.ReactNode> = {
    personal: renderPersonalSection,
    contact: renderContactSection,
    clinical: renderClinicalSection,
    reports: renderReportsSection,
    notes: renderNotesSection,
    timeline: renderTimelineSection,
  }

  // ========== Main Render ==========

  return (
    <div className="flex-1 flex flex-col">
      {/* Profile hero */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/customers')}
              className="text-gray-400 hover:text-brand-600 transition-colors"
            >
              Clientes
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
            {/* Avatar */}
            <div className="shrink-0">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-gray-300/30`}>
                {initials}
              </div>
            </div>

            {/* Quick info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {customer.data.name || 'Cliente sem nome'}
              </h1>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {customer.data.profession && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                    {customer.data.profession}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{reports.length}</p>
                    <p className="text-xs text-gray-400 -mt-0.5">{reports.length === 1 ? 'relatório' : 'relatórios'}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{notes.length + events.length}</p>
                    <p className="text-xs text-gray-400 -mt-0.5">{notes.length + events.length === 1 ? 'registro' : 'registros'}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-xs text-gray-400">
                  Cadastrado em {formatDateTime(customer.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((tab) => {
              const isActive = activeSection === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                    ${isActive
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {sectionRenderers[activeSection]()}
        </div>
      </div>

      {customer && (
        <NewReportModal
          isOpen={showNewReportModal}
          onClose={() => setShowNewReportModal(false)}
          customer={customer}
          onSelectTemplate={handleCreateFromTemplate}
          onSelectBlank={handleCreateBlankReport}
        />
      )}
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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <div className="px-5 sm:px-6 py-5">
        {children}
      </div>
    </div>
  )
}
