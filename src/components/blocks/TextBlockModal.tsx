import { useCallback } from 'react'
import { TextBlockData, LabeledItem } from '@/types'
import RichTextEditor from '@/components/ui/RichTextEditor'
import TextArea from '@/components/ui/TextArea'
import Toggle from '@/components/ui/Toggle'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface TextBlockModalProps {
  data: TextBlockData
  onChange: (data: TextBlockData) => void
}

export default function TextBlockModal({ data, onChange }: TextBlockModalProps) {
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

  return (
    <div className="space-y-4">
      <RichTextEditor
        label="Conteúdo"
        content={data.content}
        onChange={(html) => onChange({ ...data, content: html })}
        placeholder="Conteúdo da seção..."
      />

      <div className="pt-2 border-t border-gray-100">
        <Toggle
          label="Usar itens com label"
          checked={data.useLabeledItems}
          onChange={(checked) => onChange({ ...data, useLabeledItems: checked })}
        />
      </div>

      {data.useLabeledItems && (
        <div className="space-y-3">
          {data.labeledItems.map((item, index) => (
            <div key={item.id ?? index} className="flex items-start gap-3">
              <div className="w-1/3">
                <Input
                  value={item.label}
                  onChange={(e) => updateLabeledItem(index, 'label', e.target.value)}
                  placeholder="Label (ex: Assistência)"
                />
              </div>
              <div className="flex-1">
                <TextArea
                  value={item.text}
                  onChange={(e) => updateLabeledItem(index, 'text', e.target.value)}
                  placeholder="Descrição..."
                />
              </div>
              <button
                type="button"
                onClick={() => removeLabeledItem(index)}
                className="mt-1 p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                title="Remover item"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          ))}

          <Button variant="ghost" size="sm" onClick={addLabeledItem}>
            + Adicionar item
          </Button>
        </div>
      )}
    </div>
  )
}
