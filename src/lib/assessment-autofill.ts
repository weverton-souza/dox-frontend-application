import type { Assessment, AssessmentEntry, Block, ScoreTableData, ChartData } from '@/types'

export interface AutofillMatch {
  blockId: string
  blockType: 'score-table' | 'chart'
  blockTitle: string
  data: ScoreTableData | ChartData
  sourceInstrument: string
  sourceDate: string
}

function blockTemplateId(data: ScoreTableData | ChartData | null | undefined): string | null {
  return data?.templateId ?? null
}

function blockTitle(type: 'score-table' | 'chart', data: ScoreTableData | ChartData): string {
  return data.title?.trim() || (type === 'score-table' ? 'Tabela' : 'Gráfico')
}

/**
 * Cruza os blocos de tabela/gráfico do laudo (que carregam templateId vindo do template)
 * com as entries de avaliação do paciente (cujo `block` carrega o mesmo templateId).
 * Para cada bloco, escolhe a entry mais recente (avaliação com maior appliedAt).
 */
export function findAutofillMatches(blocks: Block[], assessments: Assessment[]): AutofillMatch[] {
  type Candidate = { entry: AssessmentEntry; appliedAt: string; instrument: string }
  const byTemplateId = new Map<string, Candidate>()

  for (const assessment of assessments) {
    for (const entry of assessment.entries) {
      if (entry.entryType !== 'table' && entry.entryType !== 'chart') continue
      const tplId = blockTemplateId(entry.block as ScoreTableData | ChartData | null)
      if (!tplId || !entry.block) continue
      const existing = byTemplateId.get(tplId)
      if (!existing || assessment.appliedAt.localeCompare(existing.appliedAt) > 0) {
        byTemplateId.set(tplId, {
          entry,
          appliedAt: assessment.appliedAt,
          instrument: entry.instrumentName || assessment.title,
        })
      }
    }
  }

  const matches: AutofillMatch[] = []
  for (const block of blocks) {
    if (block.type !== 'score-table' && block.type !== 'chart') continue
    const data = block.data as ScoreTableData | ChartData
    const tplId = blockTemplateId(data)
    if (!tplId) continue
    const candidate = byTemplateId.get(tplId)
    if (!candidate || !candidate.entry.block) continue
    matches.push({
      blockId: block.id,
      blockType: block.type,
      blockTitle: blockTitle(block.type, data),
      data: candidate.entry.block,
      sourceInstrument: candidate.instrument,
      sourceDate: candidate.appliedAt,
    })
  }
  return matches
}

/**
 * Aplica os matches selecionados: substitui o `data` dos blocos escolhidos pelo dado
 * preenchido da avaliação (clonado), preservando id/type/parentId/order do bloco do laudo.
 */
export function applyAutofillMatches(
  blocks: Block[],
  matches: AutofillMatch[],
  selectedBlockIds: Set<string>,
): Block[] {
  const byBlockId = new Map(matches.map((m) => [m.blockId, m]))
  return blocks.map((block) => {
    if (!selectedBlockIds.has(block.id)) return block
    const match = byBlockId.get(block.id)
    if (!match) return block
    return { ...block, data: structuredClone(match.data) }
  })
}
