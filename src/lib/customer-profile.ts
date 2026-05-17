import type { CustomerProfile } from '@/lib/api/billing-api'

export function isCustomerProfileComplete(profile: CustomerProfile | null | undefined): boolean {
  if (!profile) return false
  return Boolean(
    profile.postalCode &&
      profile.address &&
      profile.addressNumber &&
      profile.province &&
      profile.mobilePhone,
  )
}
