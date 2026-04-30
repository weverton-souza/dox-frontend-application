import { useState, useCallback, useEffect } from 'react'
import type { Professional } from '@/types'
import { getProfessional, updateProfessional } from '@/lib/api/professional-api'
import { useError } from '@/contexts/ErrorContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TextArea from '@/components/ui/TextArea'

interface AccountFormProps {
  onSaved?: () => void
}

const COUNCIL_TYPE_OPTIONS = [
  { value: '', label: 'Selecione…' },
  { value: 'CRP', label: 'CRP — Conselho de Psicologia' },
  { value: 'CREA', label: 'CREA — Conselho de Engenharia' },
  { value: 'OAB', label: 'OAB — Ordem dos Advogados' },
  { value: 'CRM', label: 'CRM — Conselho de Medicina' },
  { value: 'CRO', label: 'CRO — Conselho de Odontologia' },
  { value: 'CRN', label: 'CRN — Conselho de Nutrição' },
  { value: 'CFFa', label: 'CFFa — Conselho de Fonoaudiologia' },
  { value: 'CRP-PED', label: 'Psicopedagogia' },
  { value: 'OUTRO', label: 'Outro' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Prefiro não informar' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'nao_binario', label: 'Não-binário' },
  { value: 'outro', label: 'Outro' },
]

const UF_OPTIONS = [
  { value: '', label: '—' },
  ...['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => ({ value: uf, label: uf })),
]

const sectionTitle = 'text-sm font-semibold text-gray-700 uppercase tracking-wide'
const sectionDivider = 'border-t border-gray-100 pt-6'

export default function AccountForm({ onSaved }: AccountFormProps) {
  const [professional, setProfessional] = useState<Professional>({
    name: '',
    crp: '',
    specialization: '',
  })
  const [saving, setSaving] = useState(false)
  const { showError } = useError()

  useEffect(() => {
    getProfessional().then(setProfessional).catch(showError)
  }, [showError])

  const update = useCallback((patch: Partial<Professional>) => {
    setProfessional((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await updateProfessional(professional)
      onSaved?.()
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }, [professional, onSaved, showError])

  return (
    <div className="space-y-8">
      {/* Identidade pessoal */}
      <section>
        <h4 className={sectionTitle}>Identidade pessoal</h4>
        <div className="mt-4 space-y-4">
          <Input
            label="Nome"
            value={professional.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Nome completo"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome social"
              value={professional.socialName ?? ''}
              onChange={(e) => update({ socialName: e.target.value })}
              placeholder="Como prefere ser chamado(a)"
            />
            <Select
              label="Gênero"
              value={professional.gender ?? ''}
              onChange={(value) => update({ gender: value })}
              options={GENDER_OPTIONS}
            />
          </div>
        </div>
      </section>

      {/* Identidade profissional */}
      <section className={sectionDivider}>
        <h4 className={sectionTitle}>Identidade profissional</h4>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px] gap-4">
            <Select
              label="Conselho"
              value={professional.councilType ?? ''}
              onChange={(value) => update({ councilType: value })}
              options={COUNCIL_TYPE_OPTIONS}
            />
            <Input
              label="Número do registro"
              value={professional.councilNumber ?? professional.crp ?? ''}
              onChange={(e) => update({ councilNumber: e.target.value, crp: e.target.value })}
              placeholder="Ex: 06/12345"
            />
            <Select
              label="UF"
              value={professional.councilState ?? ''}
              onChange={(value) => update({ councilState: value })}
              options={UF_OPTIONS}
            />
          </div>
          <Input
            label="Especialização"
            value={professional.specialization}
            onChange={(e) => update({ specialization: e.target.value })}
            placeholder="Ex: Neuropsicologia"
          />
        </div>
      </section>

      {/* Endereço de atendimento */}
      <section className={sectionDivider}>
        <h4 className={sectionTitle}>Endereço de atendimento</h4>
        <p className="mt-1 text-xs text-gray-500">
          Aparece no rodapé dos relatórios finalizados.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
          <Input
            label="Cidade"
            value={professional.addressCity ?? ''}
            onChange={(e) => update({ addressCity: e.target.value })}
            placeholder="Ex: Belo Horizonte"
          />
          <Select
            label="UF"
            value={professional.addressState ?? ''}
            onChange={(value) => update({ addressState: value })}
            options={UF_OPTIONS}
          />
        </div>
      </section>

      {/* Bio */}
      <section className={sectionDivider}>
        <h4 className={sectionTitle}>Sobre você</h4>
        <p className="mt-1 text-xs text-gray-500">
          Breve descrição que pode ser exibida em links públicos de formulários (até 500 caracteres).
        </p>
        <div className="mt-4">
          <TextArea
            value={professional.bio ?? ''}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder="Ex: Psicóloga clínica com foco em neuropsicologia infantil, mestre pela USP..."
            rows={4}
            maxLength={500}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {(professional.bio ?? '').length}/500
          </p>
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  )
}
