import React from 'react'
import { BlockType, SectionData, ScoreTableData, ChartData, InfoBoxData, ReferencesData, ClosingPageData } from '@/types'

// ========== Labels & Descriptions ==========

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  'identification': 'Identificação',
  'section': 'Seção',
  'text': 'Texto',
  'score-table': 'Tabela de Escores',
  'info-box': 'Info Box',
  'chart': 'Gráfico',
  'references': 'Referências',
  'closing-page': 'Termo de Entrega',
}

export const BLOCK_TYPE_DESCRIPTIONS: Record<BlockType, string> = {
  'identification': 'Dados do profissional, solicitante e paciente',
  'section': 'Título de seção ou subseção do relatório',
  'text': 'Bloco de texto com conteúdo editável',
  'score-table': 'Tabela com instrumentos e escores',
  'info-box': 'Caixa de destaque (impressão diagnóstica, nota clínica)',
  'chart': 'Gráfico de barras ou linha para visualização de escores',
  'references': 'Referências bibliográficas com formatação ABNT',
  'closing-page': 'Termo de entrega e ciência com assinaturas',
}

// ========== Colors ==========

export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  identification: 'bg-slate-100 text-slate-500',
  section: 'bg-slate-100 text-slate-500',
  text: 'bg-blue-50 text-blue-600',
  'score-table': 'bg-amber-50 text-amber-600',
  'info-box': 'bg-purple-50 text-purple-600',
  chart: 'bg-rose-50 text-rose-600',
  references: 'bg-slate-50 text-slate-500',
  'closing-page': 'bg-gray-100 text-gray-500',
}

// Border color for sections varies by depth — this is the default/fallback
export const BLOCK_TYPE_BORDER_COLORS: Record<BlockType, string> = {
  identification: 'border-l-slate-400',
  section: 'border-l-slate-400',
  text: 'border-l-blue-400',
  'score-table': 'border-l-amber-400',
  'info-box': 'border-l-purple-400',
  chart: 'border-l-rose-400',
  references: 'border-l-slate-300',
  'closing-page': 'border-l-gray-400',
}

// Section border color by depth in the tree (same hue, decreasing intensity)
export const SECTION_DEPTH_BORDER_COLORS = [
  'border-l-slate-400',  // depth 0
  'border-l-slate-300',  // depth 1
  'border-l-slate-200',  // depth 2+
]

export function getSectionBorderColor(depth: number): string {
  return SECTION_DEPTH_BORDER_COLORS[Math.min(depth, SECTION_DEPTH_BORDER_COLORS.length - 1)]
}

// ========== Block Title Extraction ==========

/**
 * Extracts a human-readable title from a block's data.
 * Falls back to BLOCK_TYPE_LABELS when no title is set.
 */
export function getBlockTitle(block: { type: string; data: unknown }): string {
  switch (block.type) {
    case 'section': return (block.data as SectionData).title || BLOCK_TYPE_LABELS.section
    case 'text': return BLOCK_TYPE_LABELS.text
    case 'score-table': return (block.data as ScoreTableData).title || BLOCK_TYPE_LABELS['score-table']
    case 'chart': return (block.data as ChartData).title || BLOCK_TYPE_LABELS.chart
    case 'info-box': return (block.data as InfoBoxData).label || BLOCK_TYPE_LABELS['info-box']
    case 'references': return (block.data as ReferencesData).title || BLOCK_TYPE_LABELS.references
    case 'closing-page': return (block.data as ClosingPageData).title || BLOCK_TYPE_LABELS['closing-page']
    case 'identification': return BLOCK_TYPE_LABELS.identification
    default: return block.type
  }
}

// ========== Icons ==========

function blockIcon(size: number, children: React.ReactNode) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

export function getBlockTypeIcon(type: BlockType, size: number = 24): React.ReactNode {
  switch (type) {
    case 'identification':
      return blockIcon(size, <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>)
    case 'section':
      return blockIcon(size, <>
        <path d="M4 6h16" />
        <path d="M4 12h10" />
        <path d="M4 18h7" />
      </>)
    case 'text':
      return blockIcon(size, <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </>)
    case 'score-table':
      return blockIcon(size, <>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </>)
    case 'info-box':
      return blockIcon(size, <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>)
    case 'chart':
      return blockIcon(size, <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>)
    case 'references':
      return blockIcon(size, <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </>)
    case 'closing-page':
      return blockIcon(size, <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
      </>)
  }
}
