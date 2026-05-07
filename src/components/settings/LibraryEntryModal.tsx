import { useState, useEffect } from 'react'
import type { ContentLibraryEntry, ContentLibraryRequest } from '@/lib/api/content-library-api'
import { createContentLibraryEntry, updateContentLibraryEntry } from '@/lib/api/content-library-api'
import { useError } from '@/contexts/ErrorContext'
import type { SlateContent } from '@/types'
import PlateEditorComponent, { EMPTY_SLATE_CONTENT } from '@/components/ui/PlateEditor'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TagsInput, { parseTagsString, tagsToString } from '@/components/ui/TagsInput'

interface LibraryEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: ContentLibraryEntry | null
  defaultType: string
  knownTags: string[]
  onSaved: () => void
}

const TYPE_OPTIONS = [
  { value: 'reference', label: 'Referência' },
  { value: 'instrument', label: 'Instrumento' },
  { value: 'procedure', label: 'Procedimento' },
  { value: 'general', label: 'Geral' },
]

interface FormState {
  type: string
  title: string
  content: SlateContent
  authors: string
  year: string
  instrument: string
  category: string
  tags: string[]
}

const EMPTY_STATE: FormState = {
  type: 'reference',
  title: '',
  content: EMPTY_SLATE_CONTENT,
  authors: '',
  year: '',
  instrument: '',
  category: '',
  tags: [],
}

export default function LibraryEntryModal({
  isOpen,
  onClose,
  entry,
  defaultType,
  knownTags,
  onSaved,
}: LibraryEntryModalProps) {
  const { showError } = useError()
  const [form, setForm] = useState<FormState>(EMPTY_STATE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (entry) {
      setForm({
        type: entry.type || 'reference',
        title: entry.title,
        content: (entry.content as SlateContent) ?? EMPTY_SLATE_CONTENT,
        authors: entry.authors ?? '',
        year: entry.year != null ? String(entry.year) : '',
        instrument: entry.instrument ?? '',
        category: entry.category ?? '',
        tags: parseTagsString(entry.tags),
      })
    } else {
      setForm({ ...EMPTY_STATE, type: defaultType })
    }
  }, [isOpen, entry, defaultType])

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isValid = form.title.trim().length > 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    try {
      const yearNum = form.year.trim() ? Number(form.year.trim()) : null
      const payload: ContentLibraryRequest = {
        title: form.title.trim(),
        content: form.content as unknown[],
        type: form.type,
        category: form.category.trim() || undefined,
        instrument: form.instrument.trim() || null,
        authors: form.authors.trim() || null,
        year: yearNum != null && !isNaN(yearNum) ? yearNum : null,
        tags: tagsToString(form.tags),
      }
      if (entry) {
        await updateContentLibraryEntry(entry.id, payload)
      } else {
        await createContentLibraryEntry(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Editar conteúdo' : 'Novo conteúdo'} size="xl">
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
          <Select
            label="Tipo"
            value={form.type}
            onChange={(value) => update('type', value)}
            options={TYPE_OPTIONS}
          />
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Ex: WAIS-III, Anamnese clínica, Atenção sustentada…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Autores"
            value={form.authors}
            onChange={(e) => update('authors', e.target.value)}
            placeholder="Ex: Wechsler, D."
          />
          <Input
            label="Ano"
            value={form.year}
            onChange={(e) => update('year', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Ex: 2017"
          />
          <Input
            label="Instrumento (sigla)"
            value={form.instrument}
            onChange={(e) => update('instrument', e.target.value)}
            placeholder="Ex: WAIS-III"
          />
        </div>

        <TagsInput
          label="Tags"
          tags={form.tags}
          onChange={(value) => update('tags', value)}
          placeholder="Ex: infantil, atenção, neuropsicologia…"
          suggestions={knownTags}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Conteúdo
          </label>
          <PlateEditorComponent
            content={form.content}
            onChange={(value) => update('content', value)}
            placeholder="Digite o conteúdo que será inserido nos relatórios…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!isValid || saving}>
          {saving ? 'Salvando…' : entry ? 'Salvar alterações' : 'Criar'}
        </Button>
      </div>
    </Modal>
  )
}
