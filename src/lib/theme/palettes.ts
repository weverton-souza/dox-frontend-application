import type { ThemePalette } from '@/types'

/**
 * Paleta 5×4 semântica — Clássico (Flat UI 2).
 * Colunas: 1=verde/amarelo · 2=teal/laranja · 3=azul/vermelho · 4=roxo/pink · 5=gray/dark
 * Linhas: L1/L2 frios (claro→escuro) · L3/L4 quentes (claro→escuro)
 */
export const CLASSICO_PALETTE: ThemePalette = {
  id: 'classico',
  name: 'Clássico',
  description: 'Azul corporativo DOX, paleta Flat UI 2',
  colors: [
    '#55EFC4', '#81ECEC', '#74B9FF', '#A29BFE', '#DFE6E9',
    '#00B894', '#00CEC9', '#0984E3', '#6C5CE7', '#B2BEC3',
    '#FFEAA7', '#FAB1A0', '#FF7675', '#FD79A8', '#636E72',
    '#FDCB6E', '#E17055', '#D63031', '#E84393', '#2D3436',
  ],
  chrome: {
    primary: '#163A5F',
    secondary: '#1E5F8C',
    surface: '#D6E8F5',
    border: '#D5D8DC',
    headerText: '#FFFFFF',
  },
}

export const ALL_PALETTES: readonly ThemePalette[] = [CLASSICO_PALETTE]
