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
            className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
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
            w-full rounded-xl border px-4 py-3 text-[15px] leading-relaxed min-h-[120px] resize-none
            transition-colors duration-150 placeholder:text-gray-400
            focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
              : 'border-gray-200 hover:border-gray-300'}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p className="text-red-600 text-xs mt-1.5">{error}</p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

export default TextArea
