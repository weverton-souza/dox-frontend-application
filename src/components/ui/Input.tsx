import { useCallback, type InputHTMLAttributes, type ChangeEvent, type Ref } from 'react'
import { applyMask, unmask } from '@/lib/masks'

type MaskType = 'cpf' | 'phone' | 'cep'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Aplica máscara visual. O value deve ser dígitos puros — onChange retorna dígitos puros. */
  mask?: MaskType
  ref?: Ref<HTMLInputElement>
}

export default function Input({
  label,
  error,
  className = '',
  id,
  mask,
  onChange,
  value,
  ref,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const displayValue = mask && typeof value === 'string' ? applyMask(value, mask) : value

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (mask) {
      const raw = unmask(e.target.value)
      e.target.value = raw
    }
    onChange?.(e)
  }, [mask, onChange])

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full h-10 rounded-xl border px-3.5 text-[15px]
          transition-colors duration-150 placeholder:text-gray-400
          focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-gray-200 hover:border-gray-300'}
          ${className}
        `.trim()}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
      {error && (
        <p className="text-red-600 text-xs mt-1.5">{error}</p>
      )}
    </div>
  )
}
