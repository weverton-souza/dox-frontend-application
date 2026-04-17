import type { Block, SectionData } from '@/types'
import { buildBlockTree } from '@/lib/utils'
import type { TreeNode } from '@/lib/utils'

const NUMBERING_PREFIX_REGEX = /^\d+(\.\d+)*\s+/

export function stripNumberingPrefix(title: string): string {
  return title.replace(NUMBERING_PREFIX_REGEX, '')
}

export function hasNumberingPrefix(title: string): boolean {
  return NUMBERING_PREFIX_REGEX.test(title)
}

/** Ativa se pelo menos uma section tem prefixo numérico. */
export function isNumberingActive(blocks: Block[]): boolean {
  for (const block of blocks) {
    if (block.type !== 'section') continue
    const title = (block.data as SectionData).title ?? ''
    if (hasNumberingPrefix(title)) return true
  }
  return false
}

/** Remove prefixos numéricos de todas as sections. Retorna nova lista. */
export function removeNumbering(blocks: Block[]): Block[] {
  return blocks.map((b) => {
    if (b.type !== 'section') return b
    const data = b.data as SectionData
    const stripped = stripNumberingPrefix(data.title ?? '')
    if (stripped === data.title) return b
    return { ...b, data: { ...data, title: stripped } }
  })
}

/** Aplica numeração hierárquica ABNT (sem ponto) em todas as sections, respeitando a ordem da árvore. */
export function applyNumbering(blocks: Block[]): Block[] {
  const tree = buildBlockTree(blocks)
  const numberByBlockId = new Map<string, string>()

  function walk(nodes: TreeNode[], prefix: string) {
    let counter = 0
    for (const node of nodes) {
      if (node.block.type !== 'section') continue
      counter++
      const number = prefix ? `${prefix}.${counter}` : `${counter}`
      numberByBlockId.set(node.block.id, number)
      if (node.children.length > 0) walk(node.children, number)
    }
  }

  walk(tree, '')

  return blocks.map((b) => {
    if (b.type !== 'section') return b
    const data = b.data as SectionData
    const number = numberByBlockId.get(b.id)
    if (!number) return b
    const stripped = stripNumberingPrefix(data.title ?? '').trim()
    const newTitle = stripped ? `${number} ${stripped}` : number
    if (newTitle === data.title) return b
    return { ...b, data: { ...data, title: newTitle } }
  })
}

/** Se a numeração está ativa, retorna `applyNumbering(blocks)`. Caso contrário, retorna `blocks` inalterado. */
export function maybeRenumber(blocks: Block[]): Block[] {
  if (!isNumberingActive(blocks)) return blocks
  return applyNumbering(blocks)
}
