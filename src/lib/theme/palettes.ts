import type { ThemePalette } from '@/types'

/**
 * Paleta 5×4 semântica — Clássico (Flat UI 2).
 * Colunas: 1=verde/amarelo · 2=teal/laranja · 3=azul/vermelho · 4=roxo/pink · 5=gray/dark
 * Linhas: L1/L2 frios (claro→escuro) · L3/L4 quentes (claro→escuro)
 */
export const CLASSICO_PALETTE: ThemePalette = {
  id: 'classico',
  name: 'Clássico',
  description: 'Azul corporativo DOX, paleta Flat UI 2. Baseline histórico.',
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

/** Outono — matizes warm dessaturadas. Acolhedor, adulto, maduro. */
export const TERROSO_PALETTE: ThemePalette = {
  id: 'terroso',
  name: 'Terroso',
  description: 'Ocre, terracota, ferrugem, vinho, taupe. Acolhedor e maduro.',
  colors: [
    '#B5C693', '#9EBDA7', '#9FAEC0', '#B89FAE', '#D8CBB8',
    '#6B7F45', '#4E7569', '#4A6680', '#7D5668', '#9E8A6E',
    '#F4DDA0', '#EDC19A', '#DFA285', '#D4A397', '#9C8F7A',
    '#C68A2C', '#B25C2E', '#9E3E36', '#8C4A60', '#52382A',
  ],
  chrome: {
    primary: '#3E2B1F',
    secondary: '#8B5A3C',
    surface: '#F5EBD6',
    border: '#C8B998',
    headerText: '#FFFFFF',
  },
}

/** Inverno profundo — azuis-marinhos saturados. Forense, pericial, grave. */
export const GRAVE_PALETTE: ThemePalette = {
  id: 'grave',
  name: 'Grave',
  description: 'Azuis-marinhos saturados, vinhos escuros, carvão. Autoridade e objetividade.',
  colors: [
    '#7FB89F', '#7CB0B0', '#8CA8D0', '#AE98C0', '#CFCFCF',
    '#0A6040', '#004E58', '#1A3A7A', '#4D2E5E', '#1F1F1F',
    '#E6C78A', '#E88A78', '#E04C4C', '#D14D90', '#3A3A3A',
    '#9E7410', '#8A3A10', '#7F0E1A', '#5C1F54', '#0A0A0A',
  ],
  chrome: {
    primary: '#0F1F3A',
    secondary: '#1A3A7A',
    surface: '#D8DFEA',
    border: '#B8BFCC',
    headerText: '#FFFFFF',
  },
}

/** Verão — matizes cool dessaturadas e pálidas. Delicado, humanizado. */
export const SUAVE_PALETTE: ThemePalette = {
  id: 'suave',
  name: 'Suave',
  description: 'Azuis empoeirados, rosas-mauve, lavandas. Delicado e humanizado.',
  colors: [
    '#B8CFB8', '#BCD4D4', '#BCD0E0', '#CBBCD4', '#E0D8CF',
    '#7A9978', '#6E9692', '#708EA8', '#8E7A92', '#A09789',
    '#F0E8C0', '#E8C8B4', '#D8A4A4', '#D4A8B5', '#988878',
    '#B5A968', '#B88260', '#B26868', '#9A6876', '#5A5045',
  ],
  chrome: {
    primary: '#4A5D6C',
    secondary: '#708EA8',
    surface: '#E8EEF0',
    border: '#C7D0D6',
    headerText: '#FFFFFF',
  },
}

export const ALL_PALETTES: readonly ThemePalette[] = [
  CLASSICO_PALETTE,
  TERROSO_PALETTE,
  GRAVE_PALETTE,
  SUAVE_PALETTE,
]
