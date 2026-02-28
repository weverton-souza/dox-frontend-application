import { LaudoVersion } from '@/types'

const VERSION_KEY_PREFIX = 'neurohub_versions_'
const MAX_VERSIONS_PER_LAUDO = 20

function getStorageKey(laudoId: string): string {
  return `${VERSION_KEY_PREFIX}${laudoId}`
}

export function getVersionHistory(laudoId: string): LaudoVersion[] {
  const raw = localStorage.getItem(getStorageKey(laudoId))
  if (!raw) return []
  try {
    return JSON.parse(raw) as LaudoVersion[]
  } catch {
    return []
  }
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
