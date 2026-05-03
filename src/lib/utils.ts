import {
  Block,
  BlockType,
  SectionData,
  ScoreTableData,
  ChartData,
  InfoBoxData,
  ReferencesData,
  ClosingPageData,
  Page,
  FormField,
  FormSectionGroup,
  createEmptyIdentificationData,
  createEmptyTextBlockData,
  createEmptyScoreTableData,
  createEmptyInfoBoxData,
  createEmptyChartData,
  createEmptyReferencesData,
  createEmptyClosingPageData,
  createEmptyCoverData,
  createEmptySectionData,
} from '@/types'
import type { Professional } from '@/types'

// ========== Tree Node (runtime hierarchy, not persisted) ==========

export interface TreeNode {
  block: Block
  children: TreeNode[]
  depth: number
}

export function buildBlockTree(blocks: Block[]): TreeNode[] {
  const childrenMap = new Map<string | null, Block[]>()
  for (const block of blocks) {
    const pid = block.parentId ?? null
    if (!childrenMap.has(pid)) childrenMap.set(pid, [])
    childrenMap.get(pid)!.push(block)
  }
  for (const arr of childrenMap.values()) arr.sort((a, b) => a.order - b.order)

  function build(block: Block, depth: number): TreeNode {
    const children = (childrenMap.get(block.id) || []).map(c => build(c, depth + 1))
    return { block, children, depth }
  }
  return (childrenMap.get(null) || []).map(b => build(b, 0))
}

export function flattenTree(nodes: TreeNode[]): Block[] {
  const result: Block[] = []
  for (const node of nodes) {
    result.push(node.block)
    result.push(...flattenTree(node.children))
  }
  return result
}

export function getDirectChildren(blocks: Block[], parentId: string | null): Block[] {
  return blocks.filter(b => (b.parentId ?? null) === parentId).sort((a, b) => a.order - b.order)
}

export function getDescendantIds(blocks: Block[], blockId: string): string[] {
  const childrenMap = new Map<string, Block[]>()
  for (const block of blocks) {
    const pid = block.parentId ?? ''
    if (!childrenMap.has(pid)) childrenMap.set(pid, [])
    childrenMap.get(pid)!.push(block)
  }

  const result: string[] = []
  function collect(id: string) {
    const children = childrenMap.get(id) || []
    for (const child of children) {
      result.push(child.id)
      collect(child.id)
    }
  }
  collect(blockId)
  return result
}

// ========== Block Factory ==========

export function createBlock(type: BlockType, order: number, professional?: Professional, parentId: string | null = null): Block {
  const id = crypto.randomUUID()
  let data

  switch (type) {
    case 'identification':
      data = createEmptyIdentificationData(professional ?? { name: '', crp: '', specialization: '' })
      break
    case 'section':
      data = createEmptySectionData()
      break
    case 'text':
      data = createEmptyTextBlockData()
      break
    case 'score-table':
      data = createEmptyScoreTableData()
      break
    case 'info-box':
      data = createEmptyInfoBoxData()
      break
    case 'chart':
      data = createEmptyChartData()
      break
    case 'references':
      data = createEmptyReferencesData()
      break
    case 'closing-page':
      data = createEmptyClosingPageData()
      break
    case 'cover':
      data = createEmptyCoverData()
      break
  }

  return {
    id,
    type,
    parentId,
    order,
    data,
    collapsed: false,
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function calculateAge(birthDateStr: string): string {
  if (!birthDateStr) return ''
  const birth = new Date(birthDateStr + 'T00:00:00')
  if (isNaN(birth.getTime())) return ''
  const today = new Date()
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (today.getDate() < birth.getDate()) months--
  if (months < 0) { years--; months += 12 }
  if (years <= 0 && months <= 0) return ''
  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/**
 * Computes contextual labels and section grouping for a sorted list of blocks.
 * Returns a map of blockId -> BlockMeta where:
 *  - label: the contextual label (e.g. "Anamnese > Dados Pessoais")
 *  - section: the parent section title (from the most recent text block with title)
 *  - sectionBlockId: the block ID that defines the current section
 *  - isSection: whether this block defines a new section
 */
export interface BlockMeta {
  label: string
  sectionTitle: string
  section: string
  sectionBlockId: string
  isSection: boolean
}

export function computeBlockMetas(blocks: Block[]): Record<string, BlockMeta> {
  const tree = buildBlockTree(blocks)
  const result: Record<string, BlockMeta> = {}

  function walk(nodes: TreeNode[], parentTitle: string, parentSectionId: string) {
    for (const node of nodes) {
      const { block, children, depth: _depth } = node
      let label = ''
      let sectionTitle = ''
      let isSection = false

      switch (block.type) {
        case 'identification': {
          label = 'Identificação'
          sectionTitle = 'Identificação'
          isSection = true
          break
        }
        case 'section': {
          const d = block.data as SectionData
          const title = d.title || 'Seção'
          label = parentTitle ? `${parentTitle} > ${title}` : title
          sectionTitle = title
          isSection = true
          break
        }
        case 'closing-page': {
          const d = block.data as ClosingPageData
          label = d.title || 'Termo de Entrega'
          sectionTitle = d.title || 'Termo de Entrega'
          isSection = true
          break
        }
        case 'score-table': {
          const d = block.data as ScoreTableData
          label = d.title ? (parentTitle ? `${parentTitle} > ${d.title}` : d.title) : parentTitle
          break
        }
        case 'chart': {
          const d = block.data as ChartData
          label = d.title ? (parentTitle ? `${parentTitle} > ${d.title}` : d.title) : parentTitle
          break
        }
        case 'info-box': {
          const d = block.data as InfoBoxData
          label = d.label ? (parentTitle ? `${parentTitle} > ${d.label}` : d.label) : parentTitle
          break
        }
        case 'references': {
          const d = block.data as ReferencesData
          const t = d.title || 'Referências'
          label = parentTitle ? `${parentTitle} > ${t}` : t
          break
        }
        default: {
          label = parentTitle
          break
        }
      }

      const currentSectionId = isSection ? block.id : parentSectionId
      const currentTitle = isSection ? (sectionTitle || label) : parentTitle

      result[block.id] = {
        label,
        sectionTitle: isSection ? sectionTitle : parentTitle,
        section: parentTitle,
        sectionBlockId: currentSectionId,
        isSection,
      }

      if (children.length > 0) {
        walk(children, currentTitle, currentSectionId)
      }
    }
  }

  walk(tree, '', '')
  return result
}

// ========== Form Field Sections ==========

/**
 * Groups sorted form fields into section groups for rendering.
 * Fields before any section-header go into an "orphan" group (sectionField: null).
 */
export function buildFormSectionGroups(sortedFields: FormField[]): FormSectionGroup[] {
  const groups: FormSectionGroup[] = []
  let currentGroup: FormSectionGroup | null = null

  for (const field of sortedFields) {
    if (field.type === 'section-header') {
      currentGroup = {
        sectionFieldId: field.id,
        sectionTitle: field.label || 'Seção sem título',
        sectionField: field,
        children: [],
      }
      groups.push(currentGroup)
    } else {
      if (!currentGroup) {
        // Orphan group — fields before any section-header
        currentGroup = {
          sectionFieldId: '__orphan__',
          sectionTitle: '',
          sectionField: null,
          children: [],
        }
        groups.push(currentGroup)
      }
      currentGroup.children.push(field)
    }
  }

  return groups
}

// ========== Time ==========

/** Centraliza acesso a Date.now()/new Date() para facilitar mock em testes. */
export function getNow(): Date {
  return new Date()
}

/** ISO 8601 do "agora" — usado em timestamps de eventos, criação, error logs. */
export function getNowIso(): string {
  return getNow().toISOString()
}

// ========== JSON safety ==========

/** Parse JSON com fallback se for inválido (localStorage corrompido, API drift). */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Stringify JSON com fallback se houver referência circular ou erro inesperado. */
export function safeJsonStringify(value: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(value)
  } catch {
    return fallback
  }
}

// ========== Pagination ==========

export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const safePage = Math.min(Math.max(0, page), totalPages - 1)
  const start = safePage * size
  const content = items.slice(start, start + size)

  return {
    content,
    totalElements,
    totalPages,
    number: safePage,
    size,
    first: safePage === 0,
    last: safePage >= totalPages - 1,
    empty: content.length === 0,
  }
}
