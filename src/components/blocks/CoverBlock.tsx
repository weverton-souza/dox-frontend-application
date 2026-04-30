import type { CoverData } from '@/types'
import Input from '@/components/ui/Input'

interface CoverBlockProps {
  data: CoverData
  onChange: (data: CoverData) => void
}

export default function CoverBlock({ data, onChange }: CoverBlockProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Título personalizado (opcional)"
        value={data.customTitle}
        onChange={(e) => onChange({ ...data, customTitle: e.target.value })}
        placeholder="RELATÓRIO PSICOLÓGICO"
      />

      <Input
        label="Subtítulo personalizado (opcional)"
        value={data.customSubtitle}
        onChange={(e) => onChange({ ...data, customSubtitle: e.target.value })}
        placeholder="Nome do cliente (automático se vazio)"
      />

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">Dica:</strong> os dados do profissional
          (nome, registro do conselho, especialização) e do cliente vêm automaticamente do cadastro.
          A capa aparece como primeira página do{' '}
          <code className="px-1 py-0.5 bg-gray-200 rounded">.docx</code>.
        </p>
      </div>
    </div>
  )
}
