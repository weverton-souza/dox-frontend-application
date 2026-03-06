import { LaudoVersion } from '@/types'
import { readFromStorage } from '@/lib/storage-utils'

const VERSION_KEY_PREFIX = 'neurohub_versions_'
const MAX_VERSIONS_PER_LAUDO = 20

function getStorageKey(laudoId: string): string {
  return `${VERSION_KEY_PREFIX}${laudoId}`
}

export function getVersionHistory(laudoId: string): LaudoVersion[] {
  return readFromStorage<LaudoVersion>(getStorageKey(laudoId))
}

export function saveVersion(version: LaudoVersion): void {
  const versions = getVersionHistory(version.laudoId)
  versions.unshift(version) // mais recente primeiro

  // Limitar a MAX_VERSIONS_PER_LAUDO
  const trimmed = versions.slice(0, MAX_VERSIONS_PER_LAUDO)
  localStorage.setItem(getStorageKey(version.laudoId), JSON.stringify(trimmed))
}

export function deleteVersionHistory(laudoId: string): void {
  localStorage.removeItem(getStorageKey(laudoId))
}
