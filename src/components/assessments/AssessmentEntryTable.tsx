import type { AssessmentEntry, ScoreTableData } from '@/types'
import { createEmptyScoreTableData } from '@/types'
import ScoreTableBlock from '@/components/blocks/ScoreTableBlock'

interface AssessmentEntryTableProps {
  entry: AssessmentEntry
  onChange: (entry: AssessmentEntry) => void
}

export default function AssessmentEntryTable({ entry, onChange }: AssessmentEntryTableProps) {
  const data: ScoreTableData = (entry.block as ScoreTableData) ?? createEmptyScoreTableData()

  const handleBlockChange = (next: ScoreTableData) => {
    onChange({ ...entry, block: next })
  }

  return (
    <div>
      <ScoreTableBlock data={data} onChange={handleBlockChange} />
    </div>
  )
}
