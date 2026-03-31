import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import type { ReferencesData } from '@/types'
import type { SlateContent } from '@/types'
import { slateContentToPlainText } from '@/types'
import PlateEditor, { EMPTY_SLATE_CONTENT } from '@/components/ui/PlateEditor'
import { getReferenceEntries } from '@/lib/api/reference-api'
import type { ReferenceEntry } from '@/lib/api/reference-api'

interface ReferencesBlockProps {
  data: ReferencesData
  onChange: (data: ReferencesData) => void
}

function migrateToSlateContent(references: string[] | SlateContent): SlateContent {
  if (Array.isArray(references) && references.length > 0 && typeof references[0] === 'object' && references[0] !== null && 'type' in references[0]) {
    return references as SlateContent
  }
  if (Array.isArray(references)) {
    const paragraphs = references.filter(r => r.trim()).map(ref => ({
      id: Math.random().toString(36).slice(2, 12),
      type: 'p' as const,
      children: [{ text: ref }],
    }))
    return paragraphs.length > 0 ? paragraphs : EMPTY_SLATE_CONTENT
  }
  return EMPTY_SLATE_CONTENT
}

export default function ReferencesBlock({ data, onChange }: ReferencesBlockProps) {
  const slateContent = useMemo(() => migrateToSlateContent(data.references), [data.references])

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ReferenceEntry[]>([])
  const [allEntries, setAllEntries] = useState<ReferenceEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSearch) return
    setLoadingEntries(true)
    getReferenceEntries()
      .then(setAllEntries)
      .catch(() => {})
      .finally(() => setLoadingEntries(false))
  }, [showSearch])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allEntries)
      return
    }
    const q = searchQuery.toLowerCase()
    setSearchResults(
      allEntries.filter(e =>
        e.text.toLowerCase().includes(q) ||
        e.instrument?.toLowerCase().includes(q) ||
        e.authors?.toLowerCase().includes(q)
      )
    )
  }, [searchQuery, allEntries])

  useEffect(() => {
    if (!showSearch) return
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSearch])

  const plainText = useMemo(() => slateContentToPlainText(slateContent), [slateContent])

  const addFromEntry = useCallback((entry: ReferenceEntry) => {
    if (plainText.includes(entry.text)) return
    const newParagraph = {
      id: Math.random().toString(36).slice(2, 12),
      type: 'p' as const,
      children: [{ text: entry.text }],
    }
    const isCurrentlyEmpty = slateContentToPlainText(slateContent).trim() === ''
    const updatedContent: SlateContent = isCurrentlyEmpty
      ? [newParagraph]
      : [...slateContent, newParagraph]
    onChange({ ...data, references: updatedContent })
  }, [data, onChange, slateContent, plainText])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Referências
        </label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <PlateEditor
            content={slateContent}
            onChange={(value: SlateContent) => onChange({ ...data, references: value })}
            placeholder="Digite ou busque referências bibliográficas..."
          />
        </div>

        {!showSearch ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium py-1 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Buscar e adicionar referência
            </button>
          </div>
        ) : (
          <div ref={searchRef} className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por autor, instrumento ou título..."
                className="w-full text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 placeholder:text-gray-400"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {loadingEntries ? (
                <div className="px-4 py-3 text-[13px] text-gray-400">Carregando...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-gray-400">Nenhuma referência encontrada</div>
              ) : (
                searchResults.map(entry => {
                  const alreadyAdded = plainText.includes(entry.text)
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        if (!alreadyAdded) addFromEntry(entry)
                      }}
                      className={`w-full text-left px-4 py-2.5 border-b border-gray-50 transition-colors ${
                        alreadyAdded
                          ? 'bg-brand-50/50'
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          alreadyAdded ? 'bg-brand-500' : 'border-[1.5px] border-gray-300'
                        }`}>
                          {alreadyAdded && (
                            <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[13px] leading-snug block ${alreadyAdded ? 'text-brand-700' : 'text-gray-700'}`}>
                            {entry.text}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {entry.instrument && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">
                                {entry.instrument}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            <div className="p-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowSearch(false); setSearchQuery('') }}
                className="text-[13px] text-brand-600 hover:text-brand-700 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hangingIndent !== false}
            onChange={(e) => onChange({ ...data, hangingIndent: e.target.checked })}
            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
          />
          <span className="text-[13px] text-gray-600">Recuo deslocado ABNT</span>
        </label>
        <p className="text-xs text-gray-400 italic">
          Formatação aplicada no documento exportado
        </p>
      </div>
    </div>
  )
}
