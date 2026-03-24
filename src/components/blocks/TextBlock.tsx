import { useCallback, useMemo } from 'react'
import type { TextBlockData, SlateContent } from '@/types'
import { isSlateContent, htmlToSlateContent } from '@/types'
import PlateEditorComponent, { EMPTY_SLATE_CONTENT } from '@/components/ui/PlateEditor'

interface TextBlockProps {
  data: TextBlockData
  onChange: (data: TextBlockData) => void
}

export default function TextBlock({ data, onChange }: TextBlockProps) {
  const updateField = useCallback(
    (field: keyof TextBlockData, value: string | boolean | SlateContent) => {
      onChange({ ...data, [field]: value })
    },
    [data, onChange]
  )

  const slateContent = useMemo<SlateContent>(() => {
    if (isSlateContent(data.content)) return data.content
    if (typeof data.content === 'string' && data.content) return htmlToSlateContent(data.content)
    return EMPTY_SLATE_CONTENT
  }, [data.content])

  return (
    <div className="space-y-4">
      <PlateEditorComponent
        label="Conteúdo"
        content={slateContent}
        onChange={(value) => updateField('content', value)}
        placeholder="Conteúdo da seção..."
      />
    </div>
  )
}
