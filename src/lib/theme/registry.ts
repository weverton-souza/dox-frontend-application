import type { ThemePalette } from '@/types'
import { ALL_PALETTES, CLASSICO_PALETTE } from './palettes'

export function listPalettes(): readonly ThemePalette[] {
  return ALL_PALETTES
}

export function getPalette(id: string): ThemePalette {
  return ALL_PALETTES.find((p) => p.id === id) ?? CLASSICO_PALETTE
}

export { CLASSICO_PALETTE }
