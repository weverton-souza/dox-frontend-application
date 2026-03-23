import { useRef, useMemo } from 'react'
import type { InfoBoxData, VariableInfo } from '@/types'
import { isSlateContent, slateContentToPlainText } from '@/types'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import VariablePicker from '@/components/editor/VariablePicker'

interface InfoBoxBlockProps {
  data: InfoBoxData
  onChange: (data: InfoBoxData) => void
  variables?: VariableInfo[]
}

export default function InfoBoxBlock({ data, onChange, variables }: InfoBoxBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const contentText = useMemo(() => {
    if (isSlateContent(data.content)) return slateContentToPlainText(data.content)
    return typeof data.content === 'string' ? data.content : ''
  }, [data.content])

  const handleContentChange = (value: string) => {
    onChange({ ...data, content: value })
  }

  const handleInsertVariable = (key: string) => {
    const el = textareaRef.current
    if (!el) {
      handleContentChange(contentText + `{{${key}}}`)
      return
    }

    const start = el.selectionStart
    const end = el.selectionEnd
    const before = contentText.slice(0, start)
    const after = contentText.slice(end)
    const insertion = `{{${key}}}`
    handleContentChange(before + insertion + after)

    requestAnimationFrame(() => {
      el.focus()
      const pos = start + insertion.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="space-y-4">
      <Input
        label="Label"
        value={data.label}
        onChange={(e) => onChange({ ...data, label: e.target.value })}
        placeholder="Label (ex: Impressão Diagnóstica)"
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
          {variables && variables.length > 0 && (
            <VariablePicker
              variables={variables}
              onInsert={handleInsertVariable}
            />
          )}
        </div>
        <TextArea
          ref={textareaRef}
          value={contentText}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Conteúdo..."
        />
      </div>

      {/* Preview */}
      {(data.label || contentText) && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Pré-visualização
          </p>
          <div className="border-l-4 border-brand-500 bg-brand-50 rounded-r-lg p-4">
            {data.label && (
              <p className="font-semibold text-brand-700 text-sm mb-1">
                {data.label}
              </p>
            )}
            {contentText && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {contentText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
