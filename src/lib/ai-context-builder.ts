import type {
  Block,
  ScoreTableData,
  ChartData,
  QuantitativeDataPayload,
  ComputedTableData,
  ComputedTableRow,
  ComputedChartData,
  ComputedChartSeries,
} from '@/types'
import { computeCellDisplayValue, isFormulaColumn } from '@/lib/docx-engine/table/formula-engine'
import { isFormula } from '@/lib/docx-engine/table/formula-engine'

export function buildQuantitativePayload(blocks: Block[]): QuantitativeDataPayload {
  const tables: ComputedTableData[] = []
  const charts: ComputedChartData[] = []

  for (const block of blocks) {
    if (block.type === 'score-table') {
      const data = block.data as ScoreTableData
      tables.push(buildComputedTable(block.id, data))
    } else if (block.type === 'chart') {
      const data = block.data as ChartData
      charts.push(buildComputedChart(block.id, data))
    }
  }

  return { tables, charts }
}

function buildComputedTable(blockId: string, data: ScoreTableData): ComputedTableData {
  const dataStatus = classifyTableData(data)

  const rows: ComputedTableRow[] = data.rows.map(row => {
    const labelCol = data.columns[0]
    const label = row.values[labelCol?.id] ?? ''

    const values: Record<string, string> = {}
    for (const col of data.columns) {
      if (col.id === labelCol?.id) continue
      values[col.label] = computeCellDisplayValue(data, row.id, col.id)
    }

    return { label, values }
  })

  return {
    blockId,
    title: data.title,
    category: '',
    dataStatus,
    rows: dataStatus === 'empty' ? [] : rows,
  }
}

function buildComputedChart(blockId: string, data: ChartData): ComputedChartData {
  const dataStatus = classifyChartData(data)

  const series: ComputedChartSeries[] = data.series.map(s => {
    const values: Record<string, number> = {}
    for (const cat of data.categories) {
      const val = cat.values[s.id]
      if (val !== undefined && val !== 0) {
        values[cat.label] = val
      }
    }
    return { label: s.label, values }
  })

  return {
    blockId,
    title: data.title,
    dataStatus,
    series: dataStatus === 'empty' ? [] : series,
  }
}

export function classifyTableData(data: ScoreTableData): 'complete' | 'partial' | 'empty' {
  const inputColumns = data.columns.filter(col => !isFormulaColumn(col))

  if (inputColumns.length === 0) return 'empty'

  let filledCells = 0
  let totalCells = 0

  for (const row of data.rows) {
    for (const col of inputColumns) {
      totalCells++
      const raw = row.values[col.id] ?? ''
      if (raw !== '' && !isFormula(raw)) {
        filledCells++
      }
    }
  }

  if (filledCells === 0) return 'empty'
  if (filledCells === totalCells) return 'complete'
  return 'partial'
}

export function classifyChartData(data: ChartData): 'complete' | 'partial' | 'empty' {
  let hasAnyValue = false
  let allFilled = true

  for (const cat of data.categories) {
    for (const series of data.series) {
      const val = cat.values[series.id]
      if (val !== undefined && val !== 0) {
        hasAnyValue = true
      } else {
        allFilled = false
      }
    }
  }

  if (!hasAnyValue) return 'empty'
  if (allFilled) return 'complete'
  return 'partial'
}

export interface EmptyDataBlocks {
  tables: string[]
  charts: string[]
}

export function getEmptyDataBlocks(blocks: Block[]): EmptyDataBlocks {
  const tables: string[] = []
  const charts: string[] = []

  for (const block of blocks) {
    if (block.type === 'score-table') {
      const data = block.data as ScoreTableData
      if (classifyTableData(data) === 'empty') {
        tables.push(data.title || 'Tabela sem título')
      }
    } else if (block.type === 'chart') {
      const data = block.data as ChartData
      if (classifyChartData(data) === 'empty') {
        charts.push(data.title || 'Gráfico sem título')
      }
    }
  }

  return { tables, charts }
}

export function countFillableBlocks(blocks: Block[]): number {
  return blocks.filter(b => b.type === 'text' || b.type === 'info-box').length
}

export function countFilledBlocks(blocks: Block[]): number {
  return blocks.filter(b => {
    if (b.type === 'text') {
      const data = b.data as { content?: string | unknown[] }
      if (!data.content) return false
      if (typeof data.content === 'string') return data.content.trim().length > 0
      if (Array.isArray(data.content)) return data.content.length > 0
    }
    if (b.type === 'info-box') {
      const data = b.data as { content?: string }
      return data.content ? data.content.trim().length > 0 : false
    }
    return false
  }).length
}

export function countAnsweredFields(
  answers: { value?: string; selectedOptionIds?: string[]; scaleValue?: number | null }[],
  totalFields: number,
): { answered: number; total: number; percentage: number } {
  const answered = answers.filter(a => {
    if (a.value && a.value.trim()) return true
    if (a.selectedOptionIds && a.selectedOptionIds.length > 0) return true
    if (a.scaleValue !== null && a.scaleValue !== undefined) return true
    return false
  }).length

  return {
    answered,
    total: totalFields,
    percentage: totalFields > 0 ? Math.round((answered / totalFields) * 100) : 0,
  }
}
