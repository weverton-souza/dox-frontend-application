import { useRef } from 'react'
import { digitsOnly, fetchAddressByCep, formatCep, formatPhoneBr } from '@/lib/validators'
import { formatDocument, isValidDocumentFormat, sanitizeDocument } from '@/lib/cpf-cnpj'

export interface BillingAddress {
  mobilePhone: string
  postalCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
}

export const EMPTY_BILLING_ADDRESS: BillingAddress = {
  mobilePhone: '',
  postalCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
}

export function isValidCpfCnpj(raw: string): boolean {
  return isValidDocumentFormat(raw)
}

export function isBillingAddressValid(addr: BillingAddress): boolean {
  const phone = digitsOnly(addr.mobilePhone)
  const cep = digitsOnly(addr.postalCode)
  return (
    (phone.length === 10 || phone.length === 11) &&
    cep.length === 8 &&
    addr.street.trim().length > 0 &&
    addr.number.trim().length > 0 &&
    addr.neighborhood.trim().length > 0
  )
}

interface BillingProfileFormProps {
  name: string
  cpfCnpj: string
  email: string
  address: BillingAddress
  onChangeName: (v: string) => void
  onChangeCpfCnpj: (v: string) => void
  onChangeEmail: (v: string) => void
  onChangeAddress: (v: BillingAddress) => void
}

export default function BillingProfileForm({
  name,
  cpfCnpj,
  email,
  address,
  onChangeName,
  onChangeCpfCnpj,
  onChangeEmail,
  onChangeAddress,
}: BillingProfileFormProps) {
  const lastLookedUpCep = useRef<string>('')

  function updateAddress<K extends keyof BillingAddress>(key: K, v: BillingAddress[K]) {
    onChangeAddress({ ...address, [key]: v })
  }

  async function handleCepChange(raw: string) {
    const formatted = formatCep(raw)
    const cleaned = digitsOnly(formatted)
    onChangeAddress({ ...address, postalCode: formatted })
    if (cleaned.length === 8 && cleaned !== lastLookedUpCep.current) {
      lastLookedUpCep.current = cleaned
      const found = await fetchAddressByCep(cleaned)
      if (found) {
        onChangeAddress({
          ...address,
          postalCode: formatted,
          street: found.street || address.street,
          neighborhood: found.neighborhood || address.neighborhood,
        })
      }
    }
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <legend className="text-sm font-semibold text-gray-700">Dados de cobrança</legend>
      <Field label="Nome completo ou razão social" id="billing-name">
        <input
          id="billing-name"
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>
      <Field label="CPF ou CNPJ" id="billing-cpfcnpj">
        <input
          id="billing-cpfcnpj"
          type="text"
          inputMode="text"
          value={formatDocument(cpfCnpj)}
          onChange={(e) => onChangeCpfCnpj(sanitizeDocument(e.target.value))}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          maxLength={18}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>
      <Field label="E-mail" id="billing-email">
        <input
          id="billing-email"
          type="email"
          value={email}
          onChange={(e) => onChangeEmail(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>
      <Field label="Celular" id="billing-mobile">
        <input
          id="billing-mobile"
          type="text"
          inputMode="numeric"
          autoComplete="tel-national"
          value={address.mobilePhone}
          onChange={(e) => updateAddress('mobilePhone', formatPhoneBr(e.target.value))}
          placeholder="(11) 99999-9999"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>

      <div className="grid grid-cols-[140px_1fr] gap-3">
        <Field label="CEP" id="billing-cep">
          <input
            id="billing-cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={address.postalCode}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
        <Field label="Rua" id="billing-street">
          <input
            id="billing-street"
            type="text"
            autoComplete="address-line1"
            value={address.street}
            onChange={(e) => updateAddress('street', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-3">
        <Field label="Número" id="billing-number">
          <input
            id="billing-number"
            type="text"
            value={address.number}
            onChange={(e) => updateAddress('number', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
        <Field label="Complemento (opcional)" id="billing-comp">
          <input
            id="billing-comp"
            type="text"
            value={address.complement}
            onChange={(e) => updateAddress('complement', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </Field>
      </div>

      <Field label="Bairro" id="billing-neighborhood">
        <input
          id="billing-neighborhood"
          type="text"
          value={address.neighborhood}
          onChange={(e) => updateAddress('neighborhood', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Field>
    </fieldset>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  )
}
