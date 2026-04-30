interface SettingsPlaceholderProps {
  title: string
  description?: string
}

export default function SettingsPlaceholder({
  title,
  description,
}: SettingsPlaceholderProps) {
  return (
    <div>
      <header className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </header>

      <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">Em breve</h3>
        <p className="mt-1 max-w-md text-sm text-gray-600">
          Esta seção está em desenvolvimento. Volte em breve para ver as
          configurações disponíveis.
        </p>
      </div>
    </div>
  )
}
