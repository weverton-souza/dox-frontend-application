import { useCallback, useMemo, useState, useEffect } from 'react'
import type { TextBlockData, SlateContent } from '@/types'
import { isSlateContent, htmlToSlateContent, slateContentToPlainText } from '@/types'
import PlateEditorComponent, { EMPTY_SLATE_CONTENT } from '@/components/ui/PlateEditor'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { getContentLibrary } from '@/lib/api/content-library-api'
import type { ContentLibraryEntry } from '@/lib/api/content-library-api'

const TYPE_LABELS: Record<string, string> = {
  reference: 'Referência',
  instrument: 'Instrumento',
  procedure: 'Procedimento',
  general: 'Geral',
}

const TYPE_COLORS: Record<string, string> = {
  reference: 'bg-purple-50 text-purple-600',
  instrument: 'bg-amber-50 text-amber-600',
  procedure: 'bg-blue-50 text-blue-600',
  general: 'bg-gray-100 text-gray-500',
}

interface TextBlockProps {
  data: TextBlockData
  onChange: (data: TextBlockData) => void
  readOnly?: boolean
}

export default function TextBlock({ data, onChange, readOnly = false }: TextBlockProps) {
  const updateField = useCallback(
    (field: keyof TextBlockData, value: string | boolean | SlateContent) => {
      onChange({ ...data, [field]: value })
    },
    [data, onChange]
  )

  const slateContent = useMemo<SlateContent>(() => {
    if (isSlateContent(data.content)) return data.content
    if (typeof data.content === 'string' && data.content) return htmlToSlateContent(data.content)
    return EMPTY_SLATE_CONTENT
  }, [data.content])

  const [showLibrary, setShowLibrary] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [allEntries, setAllEntries] = useState<ContentLibraryEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<ContentLibraryEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  useEffect(() => {
    if (!showLibrary) return
    setLoadingEntries(true)
    getContentLibrary()
      .then(setAllEntries)
      .catch(() => {})
      .finally(() => setLoadingEntries(false))
  }, [showLibrary])

  useEffect(() => {
    let results = allEntries
    if (filterType) {
      results = results.filter(e => e.type === filterType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.instrument?.toLowerCase().includes(q) ||
        e.authors?.toLowerCase().includes(q) ||
        e.tags?.toLowerCase().includes(q)
      )
    }
    setFilteredEntries(results)
  }, [searchQuery, filterType, allEntries])

  const [insertedIds, setInsertedIds] = useState<Set<string>>(new Set())

  const insertSnippet = useCallback((entry: ContentLibraryEntry) => {
    if (insertedIds.has(entry.id)) return
    const entryNodes = entry.content as SlateContent
    const currentText = slateContentToPlainText(slateContent).trim()
    const updatedContent: SlateContent = currentText === ''
      ? entryNodes
      : [...slateContent, ...entryNodes]
    updateField('content', updatedContent)
    setInsertedIds(prev => new Set(prev).add(entry.id))
  }, [slateContent, updateField, insertedIds])

  const typeFilters = Object.keys(TYPE_LABELS)

  const closeLibrary = useCallback(() => {
    setShowLibrary(false)
    setSearchQuery('')
    setFilterType(null)
    setInsertedIds(new Set())
  }, [])

  return (
    <div className="space-y-4">
      <PlateEditorComponent
        label="Conteúdo"
        content={slateContent}
        onChange={(value) => updateField('content', value)}
        placeholder="Conteúdo da seção..."
        readOnly={readOnly}
      />

      {!readOnly && (
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium py-1 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Inserir da biblioteca
        </button>
      )}

      <Modal
        isOpen={showLibrary}
        onClose={closeLibrary}
        title="Biblioteca de Conteúdo"
        size="md"
      >
        <div className="px-5 pb-5">
          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, instrumento, autor ou tag..."
              className="w-full text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 placeholder:text-gray-400"
              autoFocus
            />
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterType(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filterType === null ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {typeFilters.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(filterType === t ? null : t)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                    filterType === t ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden max-h-[24rem] overflow-y-auto">
            {loadingEntries ? (
              <div className="px-4 py-6 text-[13px] text-gray-400 text-center">Carregando...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-gray-400 text-center">Nenhum conteúdo encontrado</div>
            ) : (
              filteredEntries.map(entry => {
                const alreadyInserted = insertedIds.has(entry.id)
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => insertSnippet(entry)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                      alreadyInserted ? 'bg-brand-50/50' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        alreadyInserted ? 'bg-brand-500' : 'border-[1.5px] border-gray-300'
                      }`}>
                        {alreadyInserted && (
                          <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[13px] font-medium ${alreadyInserted ? 'text-brand-700' : 'text-gray-800'}`}>{entry.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[entry.type] || TYPE_COLORS.general}`}>
                            {TYPE_LABELS[entry.type] || entry.type}
                          </span>
                        </div>
                        <span className="text-[12px] text-gray-500 line-clamp-2 leading-snug block">
                          {slateContentToPlainText(entry.content as SlateContent).slice(0, 150)}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {insertedIds.size > 0 && (
            <p className="text-[12px] text-gray-400 mt-3">
              {insertedIds.size} {insertedIds.size === 1 ? 'item inserido' : 'itens inseridos'}
            </p>
          )}

          <div className="flex justify-end mt-4">
            <Button
              onClick={closeLibrary}
            >
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
