// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SlateNode = Record<string, any>
export type SlateContent = SlateNode[]

/** Verifica se o conteúdo é Slate JSON (novo formato) */
export function isSlateContent(content: string | SlateContent): content is SlateContent {
  return Array.isArray(content)
}

/** Extrai texto puro de um SlateContent (para preview, busca, etc.) */
export function slateContentToPlainText(content: SlateContent): string {
  function extractText(nodes: SlateNode[]): string {
    return nodes
      .map((node) => {
        if (typeof node.text === 'string') return node.text
        if (Array.isArray(node.children)) return extractText(node.children)
        return ''
      })
      .join('')
  }
  return extractText(content)
}

/** Converte HTML legado para SlateContent (backward compat) */
export function htmlToSlateContent(html: string): SlateContent {
  if (!html || !html.trim()) return [{ type: 'p', children: [{ text: '' }] }]

  // Se não tem tags HTML, tratar como texto simples
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    const lines = html.split('\n').filter((l) => l.trim())
    if (lines.length === 0) return [{ type: 'p', children: [{ text: '' }] }]
    return lines.map((line) => ({ type: 'p', children: [{ text: line }] }))
  }

  // Parse HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const nodes: SlateNode[] = []

  for (const child of Array.from(doc.body.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const children = htmlElementToSlateChildren(el)
      nodes.push({ type: 'p', children: children.length > 0 ? children : [{ text: '' }] })
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      nodes.push({ type: 'p', children: [{ text: child.textContent }] })
    }
  }

  return nodes.length > 0 ? nodes : [{ type: 'p', children: [{ text: '' }] }]
}

/** Helper: converte filhos de um elemento HTML em Slate text nodes */
function htmlElementToSlateChildren(
  node: Node,
  marks: { bold?: true; italic?: true; underline?: true; strikethrough?: true } = {},
): SlateNode[] {
  const result: SlateNode[] = []

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (text) {
        const leaf: SlateNode = { text }
        if (marks.bold) leaf.bold = true
        if (marks.italic) leaf.italic = true
        if (marks.underline) leaf.underline = true
        if (marks.strikethrough) leaf.strikethrough = true
        result.push(leaf)
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
      const newMarks = { ...marks }
      if (tag === 'strong' || tag === 'b') newMarks.bold = true
      if (tag === 'em' || tag === 'i') newMarks.italic = true
      if (tag === 'u') newMarks.underline = true
      if (tag === 's' || tag === 'del' || tag === 'strike') newMarks.strikethrough = true
      result.push(...htmlElementToSlateChildren(el, newMarks))
    }
  }

  return result
}

/** Verifica se um SlateContent está efetivamente vazio */
export function isSlateContentEmpty(content: SlateContent): boolean {
  return slateContentToPlainText(content).trim() === ''
}
