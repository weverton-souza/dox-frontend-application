import type { AssessmentEntry, ChartData } from '@/types'
import { createEmptyChartData } from '@/types'
import ChartBlock from '@/components/blocks/ChartBlock'

interface AssessmentEntryChartProps {
  entry: AssessmentEntry
  onChange: (entry: AssessmentEntry) => void
}

export default function AssessmentEntryChart({ entry, onChange }: AssessmentEntryChartProps) {
  const data: ChartData = (entry.block as ChartData) ?? createEmptyChartData()

  const handleBlockChange = (next: ChartData) => {
    onChange({ ...entry, block: next })
  }

  return (
    <div>
      <ChartBlock data={data} onChange={handleBlockChange} />
    </div>
  )
}
