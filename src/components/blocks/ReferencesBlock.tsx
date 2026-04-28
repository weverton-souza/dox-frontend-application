import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import type { ReferencesData, SlateContent, SlateNode } from '@/types'
import { slateContentToPlainText } from '@/types'
import PlateEditor, { EMPTY_SLATE_CONTENT } from '@/components/ui/PlateEditor'
import {
  getContentLibrary,
  createContentLibraryEntry,
  updateContentLibraryEntry,
  deleteContentLibraryEntry,
} from '@/lib/api/content-library-api'
import type { ContentLibraryEntry } from '@/lib/api/content-library-api'
import { TrashIcon, EditIcon } from '@/components/icons'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface ReferencesBlockProps {
  data: ReferencesData
  onChange: (data: ReferencesData) => void
  readOnly?: boolean
}

// ========== Slate helpers ==========

function createParagraph(text: string): SlateNode {
  return { type: 'p', children: [{ text }] }
}

function migrateToSlateNodes(references: string[] | SlateContent): SlateNode[] {
  if (Array.isArray(references) && references.length > 0 && typeof references[0] === 'object' && references[0] !== null && 'type' in references[0]) {
    return references as SlateNode[]
  }
  if (Array.isArray(references)) {
    return (references as string[]).filter(r => typeof r === 'string' && r.trim()).map(ref => createParagraph(ref))
  }
  return []
}

function nodeToText(node: SlateNode): string {
  if (!node.children) return ''
  return node.children.map((c: { text?: string }) => c.text ?? '').join('')
}

// ========== Library Entry Form ==========

function LibraryEntryForm({ entry, onSave, onCancel }: {
  entry?: ContentLibraryEntry
  onSave: (data: { title: string; content: SlateContent; authors: string; instrument: string; year: string }) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState<SlateContent>(
    entry?.content ? entry.content as SlateContent : EMPTY_SLATE_CONTENT
  )
  const [authors, setAuthors] = useState(entry?.authors ?? '')
  const [instrument, setInstrument] = useState(entry?.instrument ?? '')
  const [year, setYear] = useState(entry?.year?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const contentText = useMemo(() => slateContentToPlainText(content).trim(), [content])

  const handleSubmit = async () => {
    if (!title.trim() || !contentText) return
    setSaving(true)
    try {
      await onSave({ title, content, authors, instrument, year })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-2 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Referência</label>
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <PlateEditor
            content={content}
            onChange={setContent}
            placeholder="Texto completo da referência (ABNT)..."

          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Título curto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: DSM-5"
        />
        <Input
          label="Autores"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Ex: APA"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Instrumento"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          placeholder="Ex: Manual diagnóstico"
        />
        <Input
          label="Ano"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Ex: 2013"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving || !title.trim() || !contentText}>
          {saving ? 'Salvando...' : entry ? 'Atualizar' : 'Salvar na biblioteca'}
        </Button>
      </div>
    </div>
  )
}

// ========== Main Component ==========

export default function ReferencesBlock({ data, onChange, readOnly = false }: ReferencesBlockProps) {
  const nodes = useMemo(() => migrateToSlateNodes(data.references), [data.references])

  // Library state
  const [showLibrary, setShowLibrary] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allEntries, setAllEntries] = useState<ContentLibraryEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ContentLibraryEntry | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const libraryRef = useRef<HTMLDivElement>(null)

  // Editing state for inline references
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editNode, setEditNode] = useState<SlateContent>(EMPTY_SLATE_CONTENT)
  const [showNewInput, setShowNewInput] = useState(false)
  const [newNode, setNewNode] = useState<SlateContent>(EMPTY_SLATE_CONTENT)

  // ========== Data operations ==========

  const updateNodes = useCallback((newNodes: SlateNode[]) => {
    const content: SlateContent = newNodes.length > 0 ? newNodes : EMPTY_SLATE_CONTENT
    onChange({ ...data, references: content })
  }, [data, onChange])

  const addReferenceNode = useCallback((node: SlateNode) => {
    updateNodes([...nodes, node])
  }, [nodes, updateNodes])

  const addReference = useCallback((text: string) => {
    if (!text.trim()) return
    updateNodes([...nodes, createParagraph(text.trim())])
  }, [nodes, updateNodes])

  const removeReference = useCallback((index: number) => {
    updateNodes(nodes.filter((_, i) => i !== index))
  }, [nodes, updateNodes])

  const handleStartEdit = useCallback((index: number) => {
    setEditingIndex(index)
    setEditNode([nodes[index]])
  }, [nodes])

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return
    const text = slateContentToPlainText(editNode).trim()
    if (text) {
      const updated = nodes.map((n, i) => i === editingIndex ? (editNode[0] ?? n) : n)
      updateNodes(updated)
    } else {
      removeReference(editingIndex)
    }
    setEditingIndex(null)
    setEditNode(EMPTY_SLATE_CONTENT)
  }, [editingIndex, editNode, nodes, updateNodes, removeReference])

  const handleAddNew = useCallback(() => {
    const text = slateContentToPlainText(newNode).trim()
    if (!text) return
    addReferenceNode(newNode[0] ?? createParagraph(text))
    setNewNode(EMPTY_SLATE_CONTENT)
    setShowNewInput(false)
  }, [newNode, addReferenceNode])

  // ========== Library operations ==========

  const loadEntries = useCallback(() => {
    setLoadingEntries(true)
    getContentLibrary(undefined, 'reference')
      .then(setAllEntries)
      .catch(() => {})
      .finally(() => setLoadingEntries(false))
  }, [])

  useEffect(() => {
    if (showLibrary) loadEntries()
  }, [showLibrary, loadEntries])

  useEffect(() => {
    if (!showLibrary) return
    function handleClickOutside(e: MouseEvent) {
      if (libraryRef.current && !libraryRef.current.contains(e.target as Node)) {
        setShowLibrary(false)
        setSearchQuery('')
        setShowEntryForm(false)
        setEditingEntry(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLibrary])

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return allEntries
    const q = searchQuery.toLowerCase()
    return allEntries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.instrument?.toLowerCase().includes(q) ||
      e.authors?.toLowerCase().includes(q)
    )
  }, [searchQuery, allEntries])

  const existingTexts = useMemo(() =>
    nodes.map(n => nodeToText(n).trim().toLowerCase()),
  [nodes])

  const addFromEntry = useCallback((entry: ContentLibraryEntry) => {
    const entryText = slateContentToPlainText(entry.content as SlateContent).trim()
    if (existingTexts.includes(entryText.toLowerCase())) return
    addReference(entryText)
  }, [existingTexts, addReference])

  const handleSaveLibraryEntry = useCallback(async (formData: { title: string; content: SlateContent; authors: string; instrument: string; year: string }) => {
    const payload = {
      title: formData.title.trim(),
      content: formData.content as unknown[],
      type: 'reference',
      category: '',
      instrument: formData.instrument.trim() || null,
      authors: formData.authors.trim() || null,
      year: formData.year ? parseInt(formData.year) || null : null,
    }

    if (editingEntry) {
      await updateContentLibraryEntry(editingEntry.id, payload)
    } else {
      await createContentLibraryEntry(payload)
    }

    setShowEntryForm(false)
    setEditingEntry(null)
    loadEntries()
  }, [editingEntry, loadEntries])

  const handleDeleteEntry = useCallback(async (id: string) => {
    await deleteContentLibraryEntry(id)
    setConfirmDeleteId(null)
    loadEntries()
  }, [loadEntries])



  // ========== Render ==========

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Referências
        </label>

        {/* Reference list */}
        <div className="space-y-1.5">
          {nodes.map((node, index) => {
            const text = nodeToText(node)
            if (!text.trim() && nodes.length > 1) return null

            if (editingIndex === index) {
              return (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 pt-2.5 w-5 text-right shrink-0">{index + 1}.</span>
                  <div className="flex-1 border border-brand-300 rounded-lg overflow-hidden">
                    <PlateEditor
                      content={editNode}
                      onChange={setEditNode}
                      placeholder="Referência bibliográfica..."
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" onClick={handleSaveEdit} className="px-2 py-1 text-xs font-medium rounded bg-brand-600 text-white hover:bg-brand-700">OK</button>
                    <button type="button" onClick={() => { setEditingIndex(null); setEditNode(EMPTY_SLATE_CONTENT) }} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                </div>
              )
            }

            return (
              <div key={index} className="group flex items-start gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs text-gray-400 pt-0.5 w-5 text-right shrink-0">{index + 1}.</span>
                <p
                  className={`flex-1 text-[13px] text-gray-700 leading-relaxed min-w-0 ${readOnly ? '' : 'cursor-text'}`}
                  onDoubleClick={readOnly ? undefined : () => handleStartEdit(index)}
                  title={readOnly ? undefined : 'Duplo clique para editar'}
                >
                  {text || <span className="italic text-gray-400">Referência vazia</span>}
                </p>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(index)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Editar"
                  >
                    <EditIcon size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              </div>
            )
          })}

          {nodes.length === 0 && (
            <p className="text-[13px] text-gray-400 italic py-2">Nenhuma referência adicionada</p>
          )}
        </div>

        {/* Add new reference */}
        {showNewInput ? (
          <div className="mt-2 flex items-start gap-2">
            <span className="text-xs text-gray-400 pt-2.5 w-5 text-right shrink-0">{nodes.length + 1}.</span>
            <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
              <PlateEditor
                content={newNode}
                onChange={setNewNode}
                placeholder="Digite a referência bibliográfica..."
                readOnly={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={handleAddNew}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => { setShowNewInput(false); setNewNode(EMPTY_SLATE_CONTENT) }}
                className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewInput(true)}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium py-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Adicionar referência
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium py-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Buscar na biblioteca
            </button>
          </div>
        )}

        {/* Library panel */}
        {showLibrary && (
          <div ref={libraryRef} className="mt-3 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por autor, instrumento ou título..."
                className="flex-1 text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 placeholder:text-gray-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setShowEntryForm(true); setEditingEntry(null) }}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 px-2.5 py-2 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
              >
                + Nova
              </button>
            </div>

            {/* Entry form */}
            {showEntryForm && (
              <div className="border-b border-gray-100">
                <LibraryEntryForm
                  entry={editingEntry ?? undefined}
                  onSave={handleSaveLibraryEntry}
                  onCancel={() => { setShowEntryForm(false); setEditingEntry(null) }}
                />
              </div>
            )}

            {/* Entry list */}
            <div className="max-h-60 overflow-y-auto">
              {loadingEntries ? (
                <div className="px-4 py-3 text-[13px] text-gray-400">Carregando...</div>
              ) : filteredEntries.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-gray-400">
                  {searchQuery ? 'Nenhuma referência encontrada' : 'Biblioteca vazia. Crie a primeira referência.'}
                </div>
              ) : (
                filteredEntries.map(entry => {
                  const entryText = slateContentToPlainText(entry.content as SlateContent).trim()
                  const alreadyAdded = existingTexts.includes(entryText.toLowerCase())

                  return (
                    <div
                      key={entry.id}
                      className={`px-4 py-2.5 border-b border-gray-50 transition-colors ${alreadyAdded ? 'bg-brand-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => { if (!alreadyAdded) addFromEntry(entry) }}
                          className="shrink-0 mt-0.5"
                          disabled={alreadyAdded}
                        >
                          <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors ${alreadyAdded ? 'bg-brand-500' : 'border-[1.5px] border-gray-300 hover:border-brand-400'}`}>
                            {alreadyAdded && (
                              <svg width="10" height="10" viewBox="0 0 20 20" fill="white">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[13px] leading-snug block ${alreadyAdded ? 'text-brand-700' : 'text-gray-700'}`}>
                            {entryText}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {entry.instrument && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">
                                {entry.instrument}
                              </span>
                            )}
                            {entry.authors && (
                              <span className="text-[10px] text-gray-400">{entry.authors}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {confirmDeleteId === entry.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-[11px] text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[11px] text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEditingEntry(entry); setShowEntryForm(true) }}
                                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Editar na biblioteca"
                              >
                                <EditIcon size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(entry.id)}
                                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                title="Excluir da biblioteca"
                              >
                                <TrashIcon size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowLibrary(false); setSearchQuery(''); setShowEntryForm(false); setEditingEntry(null); setConfirmDeleteId(null) }}
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
