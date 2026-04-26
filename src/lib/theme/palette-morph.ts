import type { ThemePalette } from '@/types'
import { ALL_PALETTES } from './palettes'

/**
 * Morpha uma cor hex para o slot equivalente na paleta alvo.
 * Procura a cor nas paletas conhecidas; se achar, retorna o hex do mesmo slot
 * na paleta alvo. Se não achar (cor custom do usuário), retorna literal.
 * Preserva alpha se presente (formato #RRGGBBAA).
 */
export function morphHex(hex: string, targetPalette: ThemePalette): string {
  if (!hex || !hex.startsWith('#')) return hex
  const alpha = hex.length === 9 ? hex.slice(7) : ''
  const base = hex.slice(0, 7).toUpperCase()

  for (const source of ALL_PALETTES) {
    if (source.id === targetPalette.id) continue
    const idx = source.colors.findIndex((c) => c.toUpperCase() === base)
    if (idx !== -1) {
      const morphed = targetPalette.colors[idx]
      return morphed + alpha
    }
  }
  return hex
}
