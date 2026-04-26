import { useSyncExternalStore } from 'react'
import type { ThemePalette } from '@/types'
import { getPalette, getPreferredPaletteId, subscribeToPaletteChange } from '@/lib/theme'

export function useActivePalette(): ThemePalette {
  const id = useSyncExternalStore(
    subscribeToPaletteChange,
    getPreferredPaletteId,
    () => 'classico',
  )
  return getPalette(id)
}
