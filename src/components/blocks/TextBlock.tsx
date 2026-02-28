import { useCallback } from 'react'
import { TextBlockData, LabeledItem } from '@/types'
import Input from '@/components/ui/Input'
import RichTextEditor from '@/components/ui/RichTextEditor'
import Toggle from '@/components/ui/Toggle'
import { useLabeledItems } from '@/hooks/useLabeledItems'
import LabeledItemsList from '@/components/blocks/LabeledItemsList'

interface TextBlockProps {
  data: TextBlockData
  onChange: (data: TextBlockData) => void
}

export default function TextBlock({ data, onChange }: TextBlockProps) {
  const updateField = useCallback(
    (field: keyof TextBlockData, value: string | boolean | LabeledItem[]) => {
      onChange({ ...data, [field]: value })
    },
    [data, onChange]
  )

  const { addLabeledItem, updateLabeledItem, removeLabeledItem } = useLabeledItems(data, onChange)

  // Regra de negócio: cada bloco de texto tem um único papel
  const blockRole = data.title ? 'section' : data.subtitle ? 'subsection' : 'content'

  return (
    <div className="space-y-4">
      {/* Seção → apenas título */}
      {blockRole === 'section' && (
        <Input
          label="Título da seção"
          value={data.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Título da seção"
        />
      )}

      {/* Subseção → apenas subtítulo */}
      {blockRole === 'subsection' && (
        <Input
          label="Subtítulo"
          value={data.subtitle}
          onChange={(e) => updateField('subtitle', e.target.value)}
          placeholder="Subtítulo"
        />
      )}

      {/* Conteúdo → textarea + labeled items (sem título nem subtítulo) */}
      {blockRole === 'content' && (
        <>
          <RichTextEditor
            label="Conteúdo"
            content={data.content}
            onChange={(html) => updateField('content', html)}
            placeholder="Conteúdo da seção..."
          />

          <div className="pt-2 border-t border-gray-100">
            <Toggle
              label="Usar itens com label"
              checked={data.useLabeledItems}
              onChange={(checked) => updateField('useLabeledItems', checked)}
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
        </>
      )}
    </div>
  )
}
