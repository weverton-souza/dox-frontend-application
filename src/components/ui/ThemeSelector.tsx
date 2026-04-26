import { listPalettes, setPreferredPaletteId } from '@/lib/theme'
import { useActivePalette } from '@/lib/hooks/use-active-palette'

export default function ThemeSelector() {
  const active = useActivePalette()
  const palettes = listPalettes()

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Modelo do Relatório</label>
        <p className="text-xs text-gray-500 mt-0.5">
          A paleta escolhida aplica-se ao .docx e aos seletores de cor da app.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {palettes.map((palette) => {
          const isActive = palette.id === active.id
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => setPreferredPaletteId(palette.id)}
              className={`group text-left rounded-xl border p-3 transition-all ${
                isActive
                  ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${isActive ? 'text-brand-700' : 'text-gray-900'}`}>
                  {palette.name}
                </span>
                {isActive && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                    Ativo
                  </span>
                )}
              </div>

              <div className="flex gap-1 mb-2" aria-hidden="true">
                {[palette.chrome.primary, palette.chrome.secondary, palette.chrome.surface, palette.chrome.border].map((color, i) => (
                  <div
                    key={i}
                    className="h-5 flex-1 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-5 gap-0.5" aria-hidden="true">
                {palette.colors.slice(5, 10).map((color, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                {palette.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
