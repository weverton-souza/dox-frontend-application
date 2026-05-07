import { useEffect, useMemo, useState, useCallback } from 'react'
import type { ContentLibraryEntry } from '@/lib/api/content-library-api'
import { getContentLibrary, deleteContentLibraryEntry } from '@/lib/api/content-library-api'
import { useError } from '@/contexts/ErrorContext'
import { useConfirmDelete } from '@/lib/hooks/use-confirm-delete'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { EditIcon, TrashIcon } from '@/components/icons'
import LibraryEntryModal from '@/components/settings/LibraryEntryModal'
import { parseTagsString } from '@/components/ui/TagsInput'
import { isSlateContent, slateContentToPlainText } from '@/types'
import type { SlateContent } from '@/types'

const TYPE_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'reference', label: 'Referência' },
  { value: 'instrument', label: 'Instrumento' },
  { value: 'procedure', label: 'Procedimento' },
  { value: 'general', label: 'Geral' },
]

const TYPE_BADGE_COLORS: Record<string, string> = {
  reference: 'bg-purple-50 text-purple-600',
  instrument: 'bg-amber-50 text-amber-600',
  procedure: 'bg-blue-50 text-blue-600',
  general: 'bg-gray-100 text-gray-500',
}

const TYPE_LABELS: Record<string, string> = {
  reference: 'Referência',
  instrument: 'Instrumento',
  procedure: 'Procedimento',
  general: 'Geral',
}

function previewText(content: ContentLibraryEntry['content']): string {
  const candidate = content as unknown as SlateContent
  if (isSlateContent(candidate)) {
    return slateContentToPlainText(candidate).slice(0, 180)
  }
  return ''
}

export default function SettingsLibrary() {
  const { showError } = useError()
  const [entries, setEntries] = useState<ContentLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ContentLibraryEntry | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getContentLibrary()
      setEntries(data)
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(t)
  }, [search])

  const knownTags = useMemo(() => {
    const set = new Set<string>()
    for (const entry of entries) {
      for (const tag of parseTagsString(entry.tags)) set.add(tag)
    }
    return Array.from(set).sort()
  }, [entries])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: entries.length }
    for (const entry of entries) {
      const t = entry.type || 'general'
      c[t] = (c[t] || 0) + 1
    }
    return c
  }, [entries])

  const filtered = useMemo(() => {
    let list = entries
    if (activeTab !== 'all') {
      list = list.filter((e) => (e.type || 'general') === activeTab)
    }
    const q = debouncedSearch.trim().toLowerCase()
    if (q) {
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.instrument?.toLowerCase().includes(q) ||
        e.authors?.toLowerCase().includes(q) ||
        e.tags?.toLowerCase().includes(q),
      )
    }
    return list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  }, [entries, activeTab, debouncedSearch])

  const confirmDelete = useConfirmDelete(async (id) => {
    try {
      await deleteContentLibraryEntry(id)
      await load()
    } catch (err) {
      showError(err)
    }
  })

  const handleNew = () => {
    setEditingEntry(null)
    setShowModal(true)
  }

  const handleEdit = (entry: ContentLibraryEntry) => {
    setEditingEntry(entry)
    setShowModal(true)
  }

  const defaultTypeForNew = activeTab !== 'all' ? activeTab : 'reference'

  return (
    <div>
      <header className="border-b border-gray-200 pb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold text-gray-900">Biblioteca de conteúdo</h2>
          <p className="mt-1 text-sm text-gray-600">
            Trechos reusáveis (referências, instrumentos, procedimentos) que aparecem na busca dentro do editor de relatórios.
          </p>
        </div>
        <Button onClick={handleNew} className="shrink-0 whitespace-nowrap">+ Novo conteúdo</Button>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TYPE_TABS.map((tab) => {
          const isActive = activeTab === tab.value
          const count = counts[tab.value] ?? 0
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, autor, instrumento ou tag…"
          className="w-full h-10 pl-10 pr-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 outline-none transition-colors"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-500" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
            title={debouncedSearch ? 'Nenhum conteúdo encontrado' : 'Sua biblioteca está vazia'}
            message={debouncedSearch ? `Nenhum item para "${debouncedSearch}"` : 'Crie trechos reusáveis pra acelerar a redação dos relatórios'}
            buttonLabel={debouncedSearch ? undefined : '+ Novo conteúdo'}
            onAction={debouncedSearch ? undefined : handleNew}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((entry) => {
              const tags = parseTagsString(entry.tags)
              const typeKey = entry.type || 'general'
              const preview = previewText(entry.content)
              return (
                <li
                  key={entry.id}
                  className="group relative rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {entry.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${TYPE_BADGE_COLORS[typeKey] || TYPE_BADGE_COLORS.general}`}>
                          {TYPE_LABELS[typeKey] || typeKey}
                        </span>
                        {entry.instrument && (
                          <span className="text-xs text-gray-500">· {entry.instrument}</span>
                        )}
                        {entry.authors && (
                          <span className="text-xs text-gray-500">· {entry.authors}</span>
                        )}
                        {entry.year && (
                          <span className="text-xs text-gray-500">· {entry.year}</span>
                        )}
                      </div>
                      {preview && (
                        <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                          {preview}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        title="Editar"
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete.requestDelete(entry.id)}
                        title="Excluir"
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <LibraryEntryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        entry={editingEntry}
        defaultType={defaultTypeForNew}
        knownTags={knownTags}
        onSaved={load}
      />

      <ConfirmDeleteModal
        isOpen={confirmDelete.confirmId !== null}
        onConfirm={confirmDelete.confirmDelete}
        onClose={confirmDelete.cancelDelete}
        message="Esta ação não pode ser desfeita."
      />
    </div>
  )
}
