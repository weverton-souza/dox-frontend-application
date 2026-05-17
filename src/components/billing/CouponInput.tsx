import { useState } from 'react'

interface CouponInputProps {
  applied?: { code: string; description: string } | null
  onApply: (code: string) => Promise<void>
  onClear: () => void
  disabled?: boolean
}

export default function CouponInput({ applied, onApply, onClear, disabled }: CouponInputProps) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApply() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await onApply(trimmed)
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cupom inválido')
    } finally {
      setSubmitting(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-success">
            Cupom aplicado
          </span>
          <span className="text-sm font-medium text-gray-900">{applied.code}</span>
          <span className="text-xs text-gray-600">{applied.description}</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          Remover
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="coupon" className="text-xs font-medium text-gray-700">
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleApply()
            }
          }}
          placeholder="Ex: WELCOME20"
          disabled={disabled || submitting}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-wide focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || submitting || !code.trim()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
