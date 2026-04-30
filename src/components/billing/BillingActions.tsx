interface BillingActionsProps {
  onChangePlan: () => void
  onAddModule: () => void
  onCancel: () => void
}

export default function BillingActions({
  onChangePlan,
  onAddModule,
  onCancel,
}: BillingActionsProps) {
  return (
    <section>
      <header className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Gerenciar assinatura
        </h3>
        <p className="text-sm text-gray-600">
          Trocar de plano, adicionar módulos ou cancelar.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onChangePlan}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          Trocar de plano
        </button>
        <button
          type="button"
          onClick={onAddModule}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          Adicionar módulo
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Cancelar assinatura
        </button>
      </div>
    </section>
  )
}
