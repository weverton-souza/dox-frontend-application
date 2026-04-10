import { forwardRef, useCallback, type InputHTMLAttributes, type ChangeEvent } from 'react'
import { applyMask, unmask } from '@/lib/masks'

type MaskType = 'cpf' | 'phone' | 'cep'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Aplica máscara visual. O value deve ser dígitos puros — onChange retorna dígitos puros. */
  mask?: MaskType
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, mask, onChange, value, ...props }, ref) => {
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
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm
            focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none
            transition-colors placeholder:text-gray-400
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `.trim()}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p className="text-red-600 text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
