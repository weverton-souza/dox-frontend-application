import { InfoBoxData } from '@/types'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'

interface InfoBoxBlockProps {
  data: InfoBoxData
  onChange: (data: InfoBoxData) => void
}

export default function InfoBoxBlock({ data, onChange }: InfoBoxBlockProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Label"
        value={data.label}
        onChange={(e) => onChange({ ...data, label: e.target.value })}
        placeholder="Label (ex: Impressão Diagnóstica)"
      />

      <TextArea
        label="Conteúdo"
        value={data.content}
        onChange={(e) => onChange({ ...data, content: e.target.value })}
        placeholder="Conteúdo..."
      />

      {/* Preview */}
      {(data.label || data.content) && (
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
            {data.content && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {data.content}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
