import { api } from './api-client'
import type { AggregatedFormGroup, ComparisonResult } from '@/types'

export async function getAggregatedForms(customerId: string): Promise<AggregatedFormGroup[]> {
  const { data } = await api.get<AggregatedFormGroup[]>(`/customers/${customerId}/forms/aggregated`)
  return data
}

export async function getFormComparison(
  customerId: string,
  formId: string,
  versionId: string,
): Promise<ComparisonResult> {
  const { data } = await api.get<ComparisonResult>(
    `/customers/${customerId}/forms/${formId}/comparison`,
    { params: { versionId } },
  )
  return data
}
