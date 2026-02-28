import { TextBlockData } from '@/types'
import RichTextEditor from '@/components/ui/RichTextEditor'
import Toggle from '@/components/ui/Toggle'
import { useLabeledItems } from '@/hooks/useLabeledItems'
import LabeledItemsList from '@/components/blocks/LabeledItemsList'

interface TextBlockModalProps {
  data: TextBlockData
  onChange: (data: TextBlockData) => void
}

export default function TextBlockModal({ data, onChange }: TextBlockModalProps) {
  const { addLabeledItem, updateLabeledItem, removeLabeledItem } = useLabeledItems(data, onChange)

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
        <LabeledItemsList
          items={data.labeledItems}
          onAdd={addLabeledItem}
          onUpdate={updateLabeledItem}
          onRemove={removeLabeledItem}
        />
      )}
    </div>
  )
}
