import { useState } from 'react'
import ThemeSelector from '@/components/ui/ThemeSelector'
import DocumentBrandingForm from '@/components/settings/DocumentBrandingForm'

export default function SettingsGeneral() {
  const [savedAt, setSavedAt] = useState<number | null>(null)

  return (
    <div>
      <header className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">Geral</h2>
        <p className="mt-1 text-sm text-gray-600">
          Aparência do relatório e preferências da plataforma.
        </p>
      </header>

      {savedAt && (
        <div
          key={savedAt}
          className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Configurações salvas com sucesso.
        </div>
      )}

      <div className="mt-8 space-y-10">
        <ThemeSelector />
        <DocumentBrandingForm onSaved={() => setSavedAt(Date.now())} />
      </div>
    </div>
  )
}
