import { useCallback, useMemo } from 'react'
import type { TextBlockData, SlateContent } from '@/types'
import { isSlateContent, htmlToSlateContent } from '@/types'
import Input from '@/components/ui/Input'
import PlateEditorComponent, { EMPTY_SLATE_CONTENT } from '@/components/ui/PlateEditor'

interface TextBlockModalProps {
  data: TextBlockData
  onChange: (data: TextBlockData) => void
}

export default function TextBlockModal({ data, onChange }: TextBlockModalProps) {
  const slateContent = useMemo<SlateContent>(() => {
    if (isSlateContent(data.content)) return data.content
    if (typeof data.content === 'string' && data.content) return htmlToSlateContent(data.content)
    return EMPTY_SLATE_CONTENT
  }, [data.content])

  const updateField = useCallback(
    (field: keyof TextBlockData, value: string | SlateContent) => {
      onChange({ ...data, [field]: value })
    },
    [data, onChange]
  )

  const blockRole = data.title ? 'section' : data.subtitle ? 'subsection' : 'content'

  return (
    <div className="space-y-4">
      {blockRole === 'section' && (
        <Input
          label="Título da seção"
          value={data.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Título da seção"
        />
      )}

      {blockRole === 'subsection' && (
        <Input
          label="Subtítulo"
          value={data.subtitle}
          onChange={(e) => updateField('subtitle', e.target.value)}
          placeholder="Subtítulo"
        />
      )}

      {blockRole === 'content' && (
        <PlateEditorComponent
          label="Conteúdo"
          content={slateContent}
          onChange={(value) => updateField('content', value)}
          placeholder="Conteúdo da seção..."
        />
      )}
    </div>
  )
}
