import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Customer, CustomerData, Report, Page } from '@/types'
import { createEmptyCustomer } from '@/types'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/api/customer-api'
import { getReports } from '@/lib/api/report-api'
import { formatDateTime } from '@/lib/utils'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import { useCreateReport } from '@/lib/hooks/use-create-report'
import { useError } from '@/contexts/ErrorContext'
import NewReportModal from '@/components/NewReportModal'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import PageHeader from '@/components/layout/PageHeader'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import EmptyState from '@/components/ui/EmptyState'
import PageSizeSelector from '@/components/ui/PageSizeSelector'
import ListCard, { ListCardPill, ListCardAction } from '@/components/ui/ListCard'
import { DocumentPlusIcon, EditIcon, TrashIcon as ListTrashIcon } from '@/components/icons'
import { getAvatarColor, getInitials } from '@/lib/avatar-utils'

export default function CustomerList() {
  const navigate = useNavigate()
  const { showError } = useError()

  const [customersPage, setCustomersPage] = useState<Page<Customer> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [reports, setReports] = useState<Report[]>([])
  const [search, setSearch] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { reportCustomer, isModalOpen: isReportModalOpen, showModal: showReportModal, hideModal: hideReportModal, createBlank, createFromTemplate } = useCreateReport()

  // Debounce search to avoid firing on every keystroke
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(0)
    }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  const loadData = useCallback(async (page: number, size: number, searchTerm?: string) => {
    try {
      const [cPage, reportsPage] = await Promise.all([
        getCustomers(page, size, searchTerm),
        getReports(0, 200),
      ])
      setCustomersPage(cPage)
      setReports(reportsPage.content)
    } catch (err) {
      showError(err)
    }
  }, [showError])

  useEffect(() => { loadData(currentPage, pageSize, debouncedSearch || undefined) }, [loadData, currentPage, pageSize, debouncedSearch])

  // Count reports per customer
  const reportCountMap = useMemo(() => {
    const map: Record<string, Report[]> = {}
    for (const report of reports) {
      if (report.customerId) {
        if (!map[report.customerId]) map[report.customerId] = []
        map[report.customerId].push(report)
      }
    }
    return map
  }, [reports])

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }, [])

  const handleOpenNew = useCallback(() => {
    setEditingCustomer(createEmptyCustomer())
    setShowFormModal(true)
  }, [])

  const handleOpenEdit = useCallback((customer: Customer) => {
    setEditingCustomer({ ...customer, data: { ...customer.data } })
    setShowFormModal(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!editingCustomer) return
    try {
      const isNew = !customersPage?.content.find((p) => p.id === editingCustomer.id)
      if (isNew) {
        await createCustomer(editingCustomer)
      } else {
        await updateCustomer(editingCustomer)
      }
      await loadData(currentPage, pageSize, debouncedSearch || undefined)
      setShowFormModal(false)
      setEditingCustomer(null)
    } catch (err) {
      showError(err)
    }
  }, [editingCustomer, customersPage, loadData, currentPage, pageSize, debouncedSearch, showError])

  const handleDeleteCustomer = useCallback(async (id: string) => {
    try {
      await deleteCustomer(id)
      await loadData(currentPage, pageSize, debouncedSearch || undefined)
    } catch (err) {
      showError(err)
    }
  }, [loadData, currentPage, pageSize, debouncedSearch, showError])

  const { confirmId: confirmDeleteId, requestDelete: setConfirmDeleteId, confirmDelete, cancelDelete } = useConfirmDelete(handleDeleteCustomer)

  const updateEditingField = useCallback(
    (field: keyof CustomerData, value: string) => {
      if (!editingCustomer) return
      setEditingCustomer({
        ...editingCustomer,
        data: { ...editingCustomer.data, [field]: value },
      })
    },
    [editingCustomer]
  )

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro de clientes"
        actions={
          <Button onClick={handleOpenNew}>+ Novo Cliente</Button>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search + filters */}
        {customersPage && customersPage.totalElements > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou CPF..."
              />
            </div>
            <PageSizeSelector pageSize={pageSize} onChange={changePageSize} />
          </div>
        )}

        {!customersPage || (customersPage.totalElements === 0 && !debouncedSearch) ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            }
            title="Nenhum cliente cadastrado"
            message="Cadastre seu primeiro cliente para começar"
            buttonLabel="+ Novo Cliente"
            onAction={handleOpenNew}
          />
        ) : customersPage && customersPage.totalElements === 0 && debouncedSearch ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Nenhum cliente encontrado para "{search}"</p>
          </div>
        ) : customersPage ? (
          /* Customer list */
          <>
          <div className="space-y-3">
            {customersPage.content.map((customer) => {
              const customerReports = reportCountMap[customer.id] ?? []
              const isExpanded = expandedId === customer.id

              return (
                <div key={customer.id}>
                  <ListCard
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    avatar={
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(customer.data.name || customer.id)} flex items-center justify-center shadow-sm`}>
                        <span className="text-sm font-bold text-white">
                          {getInitials(customer.data.name || '?')}
                        </span>
                      </div>
                    }
                    title={customer.data.name || 'Cliente sem nome'}
                    pills={
                      <>
                        {customer.data.cpf && <ListCardPill>{customer.data.cpf}</ListCardPill>}
                        {customer.data.age && <ListCardPill>{customer.data.age}</ListCardPill>}
                        <ListCardPill>Atualizado {formatDateTime(customer.updatedAt)}</ListCardPill>
                      </>
                    }
                    badges={
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : customer.id) }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          customerReports.length > 0
                            ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        title={customerReports.length > 0 ? 'Ver relatórios vinculados' : 'Nenhum relatório vinculado'}
                      >
                        {customerReports.length} {customerReports.length === 1 ? 'relatório' : 'relatórios'}
                      </button>
                    }
                    actions={
                      <>
                        <ListCardAction onClick={() => showReportModal(customer)} title="Novo relatório" icon={<DocumentPlusIcon />} variant="brand" />
                        <ListCardAction onClick={() => handleOpenEdit(customer)} title="Editar cliente" icon={<EditIcon />} />
                        <ListCardAction onClick={() => setConfirmDeleteId(customer.id)} title="Excluir cliente" icon={<ListTrashIcon />} variant="danger" />
                      </>
                    }
                  />

                  {/* Expanded reports list */}
                  {isExpanded && customerReports.length > 0 && (
                    <div className="ml-4 mt-1 mb-2 border-l-2 border-brand-200 pl-4 space-y-1.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Relatórios vinculados
                      </p>
                      {customerReports
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((report) => (
                          <button
                            key={report.id}
                            type="button"
                            onClick={() => navigate(`/reports/${report.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-brand-300 transition-colors text-left"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="text-sm text-gray-700 flex-1 truncate">
                              {report.customerName || 'Sem nome'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              report.status === 'finalizado'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {report.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(report.updatedAt)}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Pagination
            page={customersPage}
            onPageChange={setCurrentPage}
          />
          </>
        ) : null}
      </main>

      {/* Customer Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingCustomer(null) }}
        title={editingCustomer?.createdAt === editingCustomer?.updatedAt && !customersPage?.content.find(p => p.id === editingCustomer?.id) ? 'Novo Cliente' : 'Editar Cliente'}
        size="lg"
      >
        {editingCustomer && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome"
                value={editingCustomer.data.name}
                onChange={(e) => updateEditingField('name', e.target.value)}
                placeholder="Nome completo do cliente"
              />
              <Input
                label="CPF"
                value={editingCustomer.data.cpf}
                onChange={(e) => updateEditingField('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
              <Input
                label="Data de Nascimento"
                type="date"
                value={editingCustomer.data.birthDate}
                onChange={(e) => updateEditingField('birthDate', e.target.value)}
              />
              <Input
                label="Idade"
                value={editingCustomer.data.age}
                onChange={(e) => updateEditingField('age', e.target.value)}
                placeholder="Ex: 32 anos e 4 meses"
              />
              <Input
                label="Escolaridade"
                value={editingCustomer.data.education}
                onChange={(e) => updateEditingField('education', e.target.value)}
                placeholder="Escolaridade"
              />
              <Input
                label="Profissão"
                value={editingCustomer.data.profession}
                onChange={(e) => updateEditingField('profession', e.target.value)}
                placeholder="Profissão"
              />
              <Input
                label="Nome da Mãe"
                value={editingCustomer.data.motherName}
                onChange={(e) => updateEditingField('motherName', e.target.value)}
                placeholder="Nome da mãe"
              />
              <Input
                label="Nome do Pai"
                value={editingCustomer.data.fatherName}
                onChange={(e) => updateEditingField('fatherName', e.target.value)}
                placeholder="Nome do pai"
              />
              <Input
                label="Responsável Legal (opcional)"
                value={editingCustomer.data.guardianName ?? ''}
                onChange={(e) => updateEditingField('guardianName', e.target.value)}
                placeholder="Nome do responsável"
              />
              <Input
                label="Grau de Parentesco"
                value={editingCustomer.data.guardianRelationship ?? ''}
                onChange={(e) => updateEditingField('guardianRelationship', e.target.value)}
                placeholder="Ex: Avó, Tio, Tutor"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="ghost" onClick={() => { setShowFormModal(false); setEditingCustomer(null) }}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!confirmDeleteId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message="Tem certeza de que deseja excluir este cliente? Esta ação não pode ser desfeita."
      />

      {reportCustomer && (
        <NewReportModal
          isOpen={isReportModalOpen}
          onClose={hideReportModal}
          customer={reportCustomer}
          onSelectTemplate={createFromTemplate}
          onSelectBlank={createBlank}
        />
      )}
    </>
  )
}
