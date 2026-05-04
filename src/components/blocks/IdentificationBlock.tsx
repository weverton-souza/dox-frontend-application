import { useCallback, useMemo } from 'react'
import type { IdentificationData, IdentificationCustomerSnapshot, GuardianEntry, Professional, CustomerData, Solicitor, Customer } from '@/types'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'
import Select from '@/components/ui/Select'
import { CloseIcon } from '@/components/icons'

interface IdentificationBlockProps {
  data: IdentificationData
  onChange: (data: IdentificationData) => void
  customers?: Customer[]
  onCustomerSelected?: (customerId: string) => void
}

const sectionHeaderClass =
  'text-sm font-semibold text-brand-700 uppercase tracking-wide mb-3 pb-2 border-b border-brand-100'

const COUNCIL_TYPE_OPTIONS = [
  { value: '', label: 'Selecione…' },
  { value: 'CRP', label: 'CRP — Psicologia' },
  { value: 'CREA', label: 'CREA — Engenharia' },
  { value: 'OAB', label: 'OAB — Advocacia' },
  { value: 'CRM', label: 'CRM — Medicina' },
  { value: 'CRO', label: 'CRO — Odontologia' },
  { value: 'CRN', label: 'CRN — Nutrição' },
  { value: 'CFFa', label: 'CFFa — Fonoaudiologia' },
  { value: 'CRP-PED', label: 'Psicopedagogia' },
  { value: 'OUTRO', label: 'Outro' },
]

const UF_OPTIONS = [
  { value: '', label: '—' },
  ...['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => ({ value: uf, label: uf })),
]

function calculateAge(birthDate: string, referenceDate: string): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate + 'T00:00:00')
  const ref = referenceDate ? new Date(referenceDate + 'T00:00:00') : new Date()

  if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return ''
  if (ref < birth) return ''

  let years = ref.getFullYear() - birth.getFullYear()
  let months = ref.getMonth() - birth.getMonth()

  if (months < 0) {
    years--
    months += 12
  }

  if (ref.getDate() < birth.getDate()) {
    months--
    if (months < 0) {
      years--
      months += 12
    }
  }

  if (years === 0) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`
  }

  if (months === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`
  }

  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mes' : 'meses'}`
}

export default function IdentificationBlock({ data, onChange, customers, onCustomerSelected }: IdentificationBlockProps) {
  const hasSolicitor = !!data.solicitor

  const customerOptions = useMemo(() => {
    if (!customers || customers.length === 0) return []
    return customers.map((p) => ({
      value: p.id,
      label: p.data.name || 'Cliente sem nome',
    }))
  }, [customers])

  const handleSelectCustomer = useCallback(
    (customerId: string) => {
      if (!customerId || !customers) return
      const customer = customers.find((p) => p.id === customerId)
      if (!customer) return
      // Copy basic customer data; parents/guardians stay empty (parent component
      // can populate from PatientContacts via onCustomerSelected callback)
      onChange({
        ...data,
        customer: { ...customer.data, parents: [], guardians: [] },
      })
      onCustomerSelected?.(customerId)
    },
    [data, onChange, customers, onCustomerSelected]
  )

  const updateProfessional = useCallback(
    (field: keyof Professional, value: string) => {
      onChange({
        ...data,
        professional: { ...data.professional, [field]: value },
      })
    },
    [data, onChange]
  )

  const updateCustomer = useCallback(
    (field: keyof CustomerData, value: string) => {
      const updatedCustomer = { ...data.customer, [field]: value }

      // Auto-calculate age when birthDate changes
      if (field === 'birthDate') {
        updatedCustomer.age = calculateAge(value, data.date)
      }

      onChange({ ...data, customer: updatedCustomer })
    },
    [data, onChange]
  )

  const updateSnapshot = useCallback(
    (patch: Partial<IdentificationCustomerSnapshot>) => {
      onChange({ ...data, customer: { ...data.customer, ...patch } })
    },
    [data, onChange],
  )

  const addParent = useCallback(() => {
    updateSnapshot({ parents: [...(data.customer.parents ?? []), ''] })
  }, [data.customer.parents, updateSnapshot])

  const updateParent = useCallback(
    (index: number, value: string) => {
      const next = [...(data.customer.parents ?? [])]
      next[index] = value
      updateSnapshot({ parents: next })
    },
    [data.customer.parents, updateSnapshot],
  )

  const removeParent = useCallback(
    (index: number) => {
      updateSnapshot({ parents: (data.customer.parents ?? []).filter((_, i) => i !== index) })
    },
    [data.customer.parents, updateSnapshot],
  )

  const addGuardian = useCallback(() => {
    updateSnapshot({ guardians: [...(data.customer.guardians ?? []), { name: '', relationship: '' }] })
  }, [data.customer.guardians, updateSnapshot])

  const updateGuardian = useCallback(
    (index: number, patch: Partial<GuardianEntry>) => {
      const next = [...(data.customer.guardians ?? [])]
      next[index] = { ...next[index], ...patch }
      updateSnapshot({ guardians: next })
    },
    [data.customer.guardians, updateSnapshot],
  )

  const removeGuardian = useCallback(
    (index: number) => {
      updateSnapshot({ guardians: (data.customer.guardians ?? []).filter((_, i) => i !== index) })
    },
    [data.customer.guardians, updateSnapshot],
  )

  const updateSolicitor = useCallback(
    (field: keyof Solicitor, value: string) => {
      if (!data.solicitor) return
      onChange({
        ...data,
        solicitor: { ...data.solicitor, [field]: value },
      })
    },
    [data, onChange]
  )

  const toggleSolicitor = useCallback(
    (enabled: boolean) => {
      onChange({
        ...data,
        solicitor: enabled
          ? { name: '', crm: '', rqe: '', specialty: '' }
          : undefined,
      })
    },
    [data, onChange]
  )

  const updateField = useCallback(
    (field: 'date' | 'location', value: string) => {
      const updated = { ...data, [field]: value }

      // Recalculate age when report date changes
      if (field === 'date' && data.customer.birthDate) {
        updated.customer = {
          ...data.customer,
          age: calculateAge(data.customer.birthDate, value),
        }
      }

      onChange(updated)
    },
    [data, onChange]
  )

  return (
    <div className="space-y-6">
      {/* Profissional Responsável */}
      <section>
        <h3 className={sectionHeaderClass}>Profissional Responsável</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={data.professional.name}
              onChange={(e) => updateProfessional('name', e.target.value)}
              placeholder="Nome do profissional"
            />
            <Input
              label="Especialização"
              value={data.professional.specialization}
              onChange={(e) => updateProfessional('specialization', e.target.value)}
              placeholder="Ex: Neuropsicologia"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px] gap-4">
            <Select
              label="Conselho"
              value={data.professional.councilType ?? (data.professional.crp ? 'CRP' : '')}
              onChange={(value) => updateProfessional('councilType', value)}
              options={COUNCIL_TYPE_OPTIONS}
            />
            <Input
              label="Número do registro"
              value={data.professional.councilNumber ?? data.professional.crp ?? ''}
              onChange={(e) => {
                const value = e.target.value
                onChange({
                  ...data,
                  professional: {
                    ...data.professional,
                    councilNumber: value,
                    crp: value,
                  },
                })
              }}
              placeholder="Ex: 06/12345"
            />
            <Select
              label="UF"
              value={data.professional.councilState ?? ''}
              onChange={(value) => updateProfessional('councilState', value)}
              options={UF_OPTIONS}
            />
          </div>
        </div>
      </section>

      {/* Solicitante */}
      <section>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-brand-100">
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Solicitante
          </h3>
          <Toggle
            label="Incluir solicitante"
            checked={hasSolicitor}
            onChange={toggleSolicitor}
          />
        </div>
        {hasSolicitor && data.solicitor && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={data.solicitor.name}
              onChange={(e) => updateSolicitor('name', e.target.value)}
              placeholder="Nome do solicitante"
            />
            <Input
              label="CRM"
              value={data.solicitor.crm ?? ''}
              onChange={(e) => updateSolicitor('crm', e.target.value)}
              placeholder="CRM"
            />
            <Input
              label="RQE"
              value={data.solicitor.rqe ?? ''}
              onChange={(e) => updateSolicitor('rqe', e.target.value)}
              placeholder="RQE"
            />
            <Input
              label="Especialidade"
              value={data.solicitor.specialty ?? ''}
              onChange={(e) => updateSolicitor('specialty', e.target.value)}
              placeholder="Especialidade"
            />
          </div>
        )}
      </section>

      {/* Dados do Cliente */}
      <section>
        <h3 className={sectionHeaderClass}>Dados do Cliente</h3>
        {customerOptions.length > 0 && (
          <div className="mb-4">
            <Select
              value=""
              onChange={handleSelectCustomer}
              options={customerOptions}
              placeholder="Preencher com cliente cadastrado..."
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nome"
            value={data.customer.name}
            onChange={(e) => updateCustomer('name', e.target.value)}
            placeholder="Nome completo do cliente"
          />
          <Input
            label="CPF"
            value={data.customer.cpf}
            onChange={(e) => updateCustomer('cpf', e.target.value)}
            placeholder="000.000.000-00"
          />
          <Input
            label="Data de Nascimento"
            type="date"
            value={data.customer.birthDate}
            onChange={(e) => updateCustomer('birthDate', e.target.value)}
          />
          <Input
            label="Idade"
            value={data.customer.age}
            onChange={(e) => updateCustomer('age', e.target.value)}
            placeholder="Ex: 32 anos e 4 meses"
          />
          <Input
            label="Escolaridade"
            value={data.customer.education}
            onChange={(e) => updateCustomer('education', e.target.value)}
            placeholder="Escolaridade"
          />
          <Input
            label="Profissão"
            value={data.customer.profession}
            onChange={(e) => updateCustomer('profession', e.target.value)}
            placeholder="Profissão"
          />
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Filiação
            </span>
            <button
              type="button"
              onClick={addParent}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              + Adicionar filiação
            </button>
          </div>
          {(data.customer.parents ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 italic">Nenhuma filiação cadastrada.</p>
          ) : (
            (data.customer.parents ?? []).map((parent, index) => (
              <div key={`parent-${index}-${parent}`} className="flex items-center gap-2 group/p">
                <span className="text-xs text-gray-400 shrink-0 w-20">Filiação {index + 1}</span>
                <Input
                  value={parent}
                  onChange={(e) => updateParent(index, e.target.value)}
                  placeholder="Nome completo"
                />
                <button
                  type="button"
                  onClick={() => removeParent(index)}
                  className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/p:opacity-100 transition-all"
                  title="Remover"
                >
                  <CloseIcon />
                </button>
              </div>
            ))
          )}
          {(data.customer.parents ?? []).length > 4 && (
            <p className="text-xs text-amber-600">
              Atenção: o registro civil brasileiro aceita no máximo 4 filiações (Provimento CNJ 63/2017).
            </p>
          )}
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Responsáveis legais
            </span>
            <button
              type="button"
              onClick={addGuardian}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              + Adicionar responsável
            </button>
          </div>
          {(data.customer.guardians ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 italic">Nenhum responsável legal cadastrado.</p>
          ) : (
            (data.customer.guardians ?? []).map((guardian, index) => (
              <div key={`guardian-${index}-${guardian.name}`} className="grid grid-cols-[1fr_180px_auto] gap-2 items-center group/g">
                <Input
                  value={guardian.name}
                  onChange={(e) => updateGuardian(index, { name: e.target.value })}
                  placeholder={`Responsável ${index + 1}`}
                />
                <Input
                  value={guardian.relationship ?? ''}
                  onChange={(e) => updateGuardian(index, { relationship: e.target.value })}
                  placeholder="Ex: Avó, Tio, Tutor"
                />
                <button
                  type="button"
                  onClick={() => removeGuardian(index)}
                  className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/g:opacity-100 transition-all"
                  title="Remover"
                >
                  <CloseIcon />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Dados do Relatório */}
      <section>
        <h3 className={sectionHeaderClass}>Dados do Relatório</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data do Relatório"
            type="date"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
          />
          <Input
            label="Local"
            value={data.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="Ex: Belo Horizonte - MG"
          />
        </div>
      </section>
    </div>
  )
}
