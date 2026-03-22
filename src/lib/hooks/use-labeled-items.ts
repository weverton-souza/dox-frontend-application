import { useCallback } from 'react'
import type { TextBlockData, LabeledItem } from '@/types'

export function useLabeledItems(
  data: TextBlockData,
  onChange: (data: TextBlockData) => void
) {
  const addLabeledItem = useCallback(() => {
    onChange({
      ...data,
      labeledItems: [...data.labeledItems, { id: crypto.randomUUID(), label: '', text: '' }],
    })
  }, [data, onChange])

  const updateLabeledItem = useCallback(
    (index: number, field: keyof LabeledItem, value: string) => {
      const items = [...data.labeledItems]
      items[index] = { ...items[index], [field]: value }
      onChange({ ...data, labeledItems: items })
    },
    [data, onChange]
  )

  const removeLabeledItem = useCallback(
    (index: number) => {
      const items = data.labeledItems.filter((_, i) => i !== index)
      onChange({ ...data, labeledItems: items })
    },
    [data, onChange]
  )

  return { addLabeledItem, updateLabeledItem, removeLabeledItem }
}
