import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Laudo,
  LaudoTemplate,
  Professional,
  Block,
  ContactType,
  CONTACT_TYPE_OPTIONS,
  createEmptyContactItem,
} from '@/types'
import {
  getLaudos,
  saveLaudo,
  deleteLaudo,
  getProfessional,
  saveProfessional,
  getCustomTemplates,
  deleteCustomTemplate,
} from '@/lib/storage'
import { getAllTemplates } from '@/lib/default-templates'
import { createBlock, paginate } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils'
import { fileToBase64DataUrl, resizeImageToBase64 } from '@/lib/image-utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'

export default function LaudoList() {
  const navigate = useNavigate()

  const [laudos, setLaudos] = useState<Laudo[]>([])
  const [professional, setProfessional] = useState<Professional>(getProfessional())
  const [customTemplates, setCustomTemplates] = useState<LaudoTemplate[]>([])
  const [showNewModal, setShowNewModal] = useState(false)
  const [showProfessionalModal, setShowProfessionalModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Load data
  useEffect(() => {
    setLaudos(getLaudos())
    setCustomTemplates(getCustomTemplates())
  }, [])

  const allTemplates = getAllTemplates(customTemplates)

  const handleCreateFromScratch = useCallback(() => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const identificationBlock = createBlock('identification', 0)

    const laudo: Laudo = {
      id,
      createdAt: now,
      updatedAt: now,
      status: 'rascunho',
      patientName: '',
      blocks: [identificationBlock],
    }

    saveLaudo(laudo)
    setShowNewModal(false)
    navigate(`/laudo/${id}`)
  }, [navigate])

  const handleCreateFromTemplate = useCallback(
    (template: LaudoTemplate) => {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()

      const blocks: Block[] = template.blocks.map((tb) => ({
        id: crypto.randomUUID(),
        type: tb.type,
        order: tb.order,
        data: JSON.parse(JSON.stringify(tb.data)),
        collapsed: false,
      }))

      const laudo: Laudo = {
        id,
        createdAt: now,
        updatedAt: now,
        status: 'rascunho',
        patientName: '',
        blocks,
      }

      saveLaudo(laudo)
      setShowNewModal(false)
      navigate(`/laudo/${id}`)
    },
    [navigate]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteLaudo(id)
      setLaudos(getLaudos())
      setConfirmDeleteId(null)
    },
    []
  )

  const handleDeleteTemplate = useCallback(
    (id: string) => {
      deleteCustomTemplate(id)
      setCustomTemplates(getCustomTemplates())
    },
    []
  )

  const handleSaveProfessional = useCallback(() => {
    saveProfessional(professional)
    setShowProfessionalModal(false)
  }, [professional])

  const sortedLaudos = useMemo(
    () => [...laudos].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    [laudos]
  )

  const paginatedPage = useMemo(
    () => paginate(sortedLaudos, currentPage, pageSize),
    [sortedLaudos, currentPage, pageSize]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-700">NeuroHub</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Montagem de laudos neuropsicológicos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pacientes')}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Pacientes
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfessionalModal(true)}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Profissional
              </span>
            </Button>
            <Button onClick={() => setShowNewModal(true)}>
              + Novo Laudo
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        {laudos.length > 0 && (
          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-1.5">
              <label htmlFor="page-size-laudos" className="text-sm text-gray-400">
                Por página:
              </label>
              <select
                id="page-size-laudos"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(0)
                }}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                {[10, 25, 50].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {laudos.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="18" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="9" y1="15" x2="15" y2="15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum laudo ainda
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Crie seu primeiro laudo para começar
            </p>
            <Button onClick={() => setShowNewModal(true)} size="lg">
              + Novo Laudo
            </Button>
          </div>
        ) : (
          /* Laudo list */
          <>
          <div className="space-y-3">
            {paginatedPage.content.map((laudo) => (
              <div
                key={laudo.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => navigate(`/laudo/${laudo.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {laudo.patientName || 'Paciente sem nome'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatDateTime(laudo.updatedAt)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {laudo.blocks.length} {laudo.blocks.length === 1 ? 'bloco' : 'blocos'}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                    laudo.status === 'finalizado'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {laudo.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDeleteId(laudo.id)
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  title="Excluir laudo"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <Pagination
            page={paginatedPage}
            onPageChange={setCurrentPage}
          />
          </>
        )}
      </main>

      {/* New Laudo Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Novo Laudo"
        size="md"
      >
        <div className="p-4 space-y-4">
          {/* From scratch */}
          <button
            type="button"
            onClick={handleCreateFromScratch}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all text-left"
          >
            <div className="p-3 rounded-lg bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Começar do zero</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Laudo vazio com bloco de identificação
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase font-medium">ou use um template</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Templates */}
          <div className="space-y-2">
            {allTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => handleCreateFromTemplate(template)}
                  className="flex-1 flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-left"
                >
                  <div className="p-3 rounded-lg bg-brand-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {template.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {template.blocks.length} blocos
                    </p>
                  </div>
                </button>
                {!template.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Excluir template"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Confirmar exclusão"
        size="sm"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza de que deseja excluir este laudo? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Professional Modal */}
      <Modal
        isOpen={showProfessionalModal}
        onClose={() => setShowProfessionalModal(false)}
        title="Configurações do Profissional"
        size="lg"
      >
        <ProfessionalModalContent
          professional={professional}
          onChange={setProfessional}
          onSave={handleSaveProfessional}
          onCancel={() => setShowProfessionalModal(false)}
        />
      </Modal>
    </div>
  )
}

// ========== Professional Modal Content ==========

function ProfessionalModalContent({
  professional,
  onChange,
  onSave,
  onCancel,
}: {
  professional: Professional
  onChange: (p: Professional) => void
  onSave: () => void
  onCancel: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const dataUrl = await fileToBase64DataUrl(file)
        const resized = await resizeImageToBase64(dataUrl)
        onChange({ ...professional, logo: resized })
      } catch (err) {
        alert((err as Error).message)
      }
      // Reset input so re-uploading same file works
      e.target.value = ''
    },
    [professional, onChange]
  )

  const handleRemoveLogo = useCallback(() => {
    onChange({ ...professional, logo: undefined })
  }, [professional, onChange])

  const handleAddContact = useCallback(() => {
    onChange({
      ...professional,
      contactItems: [...(professional.contactItems ?? []), createEmptyContactItem()],
    })
  }, [professional, onChange])

  const handleRemoveContact = useCallback(
    (id: string) => {
      onChange({
        ...professional,
        contactItems: (professional.contactItems ?? []).filter((c) => c.id !== id),
      })
    },
    [professional, onChange]
  )

  const handleUpdateContact = useCallback(
    (id: string, field: 'type' | 'value', value: string) => {
      onChange({
        ...professional,
        contactItems: (professional.contactItems ?? []).map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        ),
      })
    },
    [professional, onChange]
  )

  const sectionHeader = 'text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3'

  return (
    <div className="p-4 space-y-6">
      {/* Section 1: Basic Data */}
      <div>
        <h3 className={sectionHeader}>Dados Básicos</h3>
        <div className="space-y-3">
          <Input
            label="Nome"
            value={professional.name}
            onChange={(e) => onChange({ ...professional, name: e.target.value })}
            placeholder="Nome completo"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CRP"
              value={professional.crp}
              onChange={(e) => onChange({ ...professional, crp: e.target.value })}
              placeholder="CRP"
            />
            <Input
              label="Especialização"
              value={professional.specialization}
              onChange={(e) => onChange({ ...professional, specialization: e.target.value })}
              placeholder="Especialização"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Logo */}
      <div>
        <h3 className={sectionHeader}>Logo (cabeçalho do documento)</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        {professional.logo ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={professional.logo}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Trocar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
                <span className="text-red-500">Remover</span>
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all text-sm text-gray-500 hover:text-brand-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Enviar logo (PNG, JPG — máx. 500KB)
          </button>
        )}
      </div>

      {/* Section 3: Contacts / Social */}
      <div>
        <h3 className={sectionHeader}>Contatos e Redes Sociais (rodapé do documento)</h3>
        <div className="space-y-2">
          {(professional.contactItems ?? []).map((item) => (
            <div key={item.id} className="flex items-end gap-2">
              <div className="w-36 shrink-0">
                <Select
                  value={item.type}
                  onChange={(value) => handleUpdateContact(item.id, 'type', value as ContactType)}
                  options={CONTACT_TYPE_OPTIONS}
                />
              </div>
              <div className="flex-1">
                <Input
                  value={item.value}
                  onChange={(e) => handleUpdateContact(item.id, 'value', e.target.value)}
                  placeholder={getContactPlaceholder(item.type)}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveContact(item.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0 mb-px"
                title="Remover"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddContact}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium py-1 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar contato
          </button>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSave}>Salvar</Button>
      </div>
    </div>
  )
}

function getContactPlaceholder(type: ContactType): string {
  switch (type) {
    case 'instagram': return '@usuario'
    case 'linkedin': return 'linkedin.com/in/usuario'
    case 'facebook': return 'facebook.com/usuario'
    case 'website': return 'www.seusite.com.br'
    case 'phone': return '(00) 00000-0000'
    case 'email': return 'email@exemplo.com'
  }
}
