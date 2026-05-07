import { useState, useRef, useCallback } from 'react'

interface TagsInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
  label?: string
  maxLength?: number
}

export default function TagsInput({
  tags,
  onChange,
  placeholder = 'Digite e pressione Enter',
  suggestions = [],
  label,
  maxLength = 30,
}: TagsInputProps) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback((value: string) => {
    const trimmed = value.trim().toLowerCase().slice(0, maxLength)
    if (!trimmed) return
    if (tags.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...tags, trimmed])
    setDraft('')
  }, [tags, onChange, maxLength])

  const removeTag = useCallback((tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }, [tags, onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s) && (draft === '' || s.toLowerCase().includes(draft.toLowerCase())))
    .slice(0, 6)

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="text-brand-500 hover:text-brand-700 transition-colors"
              aria-label={`Remover tag ${tag}`}
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            setTimeout(() => setFocused(false), 150)
            if (draft.trim()) addTag(draft)
            e.currentTarget.value = draft
          }}
          onFocus={() => setFocused(true)}
          placeholder={tags.length === 0 ? placeholder : ''}
          maxLength={maxLength}
          className="flex-1 min-w-[80px] outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>
      {focused && filteredSuggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Helpers pro formato string-CSV no backend
export function parseTagsString(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}

export function tagsToString(tags: string[]): string | null {
  const cleaned = tags.map((t) => t.trim()).filter(Boolean)
  return cleaned.length === 0 ? null : cleaned.join(',')
}
