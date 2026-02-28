import { forwardRef, TextareaHTMLAttributes, useEffect, useRef } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', id, value, onChange, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    const setRefs = (element: HTMLTextAreaElement | null) => {
      internalRef.current = element
      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
    }

    useEffect(() => {
      const textarea = internalRef.current
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [value])

    return (
      <div>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={setRefs}
          id={textareaId}
          value={value}
          onChange={onChange}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm min-h-[80px] resize-none
            focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none
            transition-colors placeholder:text-gray-400
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p className="text-red-600 text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

export default TextArea
