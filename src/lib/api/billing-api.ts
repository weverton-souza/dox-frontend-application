import type {
  AccessibleModule,
  ApiNfseInvoice,
  ApiPayment,
  ApiSubscription,
  Bundle,
  ModuleCatalogEntry,
  ModuleId,
  PriceBreakdown,
} from '@/types'
import { api } from '@/lib/api/api-client'

export async function listModuleCatalog(): Promise<ModuleCatalogEntry[]> {
  const { data } = await api.get<ModuleCatalogEntry[]>('/modules/catalog')
  return data
}

export async function listActiveModules(): Promise<ModuleCatalogEntry[]> {
  const { data } = await api.get<ModuleCatalogEntry[]>('/modules/active')
  return data
}

export async function listAccessibleModules(): Promise<AccessibleModule[]> {
  const { data } = await api.get<AccessibleModule[]>('/modules/accessible')
  return data
}

export async function listBundles(): Promise<Bundle[]> {
  const { data } = await api.get<Bundle[]>('/bundles')
  return data
}

export async function getBundle(id: string): Promise<Bundle> {
  const { data } = await api.get<Bundle>(`/bundles/${id}`)
  return data
}

export async function getSubscription(): Promise<ApiSubscription | null> {
  const { data } = await api.get<ApiSubscription | null>('/billing/subscription')
  return data
}

export interface SubscribeBundleRequest {
  bundleId: string
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  customerName: string
  customerCpfCnpj: string
  customerEmail?: string
  creditCardToken?: string
}

export async function subscribeBundle(req: SubscribeBundleRequest): Promise<ApiSubscription> {
  const { data } = await api.post<ApiSubscription>('/billing/subscribe-bundle', req)
  return data
}

export interface SubscribeModulesRequest extends Omit<SubscribeBundleRequest, 'bundleId'> {
  moduleIds: ModuleId[]
}

export async function subscribeModules(req: SubscribeModulesRequest): Promise<ApiSubscription> {
  const { data } = await api.post<ApiSubscription>('/billing/subscribe-modules', req)
  return data
}

export async function addModule(moduleId: ModuleId): Promise<ApiSubscription> {
  const { data } = await api.patch<ApiSubscription>('/billing/subscription/modules/add', { moduleId })
  return data
}

export async function removeModule(moduleId: ModuleId): Promise<ApiSubscription> {
  const { data } = await api.patch<ApiSubscription>('/billing/subscription/modules/remove', { moduleId })
  return data
}

export async function cancelSubscription(reason?: string): Promise<ApiSubscription> {
  const { data } = await api.delete<ApiSubscription>('/billing/subscription', { data: { reason } })
  return data
}

export async function reactivateSubscription(): Promise<ApiSubscription> {
  const { data } = await api.post<ApiSubscription>('/billing/subscription/reactivate')
  return data
}

export async function listPayments(from?: string, to?: string): Promise<ApiPayment[]> {
  const { data } = await api.get<ApiPayment[]>('/billing/payments', { params: { from, to } })
  return data
}

export async function listInvoices(): Promise<ApiNfseInvoice[]> {
  const { data } = await api.get<ApiNfseInvoice[]>('/billing/invoices')
  return data
}

export async function pricePreview(
  moduleIds: ModuleId[],
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY',
  bundleId?: string,
): Promise<PriceBreakdown> {
  const { data } = await api.get<PriceBreakdown>('/billing/price-preview', {
    params: { moduleIds, cycle, bundleId },
  })
  return data
}

export interface TokenizeCreditCardRequest {
  cardHolderName: string
  cardNumber: string
  cardExpiryMonth: string
  cardExpiryYear: string
  cardCcv: string
  billingName: string
  billingEmail: string
  billingCpfCnpj: string
  billingPostalCode: string
  billingAddressNumber: string
  billingAddressComplement?: string
  billingPhone?: string
  billingMobilePhone?: string
  makeDefault?: boolean
}

export interface TokenizedCard {
  token: string
  brand: string
  last4: string
}

export async function tokenizeCreditCard(req: TokenizeCreditCardRequest): Promise<TokenizedCard> {
  const { data } = await api.post<TokenizedCard>('/billing/credit-card/tokenize', req)
  return data
}
