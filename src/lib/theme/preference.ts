const STORAGE_KEY = 'dox-preferred-palette'
const EVENT_NAME = 'dox-palette-changed'

export function getPreferredPaletteId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'classico'
  } catch {
    return 'classico'
  }
}

export function setPreferredPaletteId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  } catch {
    // ignore
  }
}

export function subscribeToPaletteChange(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(EVENT_NAME, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(EVENT_NAME, handler)
  }
}
