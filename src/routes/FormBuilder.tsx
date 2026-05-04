import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import type {
  Form,
  FormField,
  FormFieldType,
} from '@/types'
import { createEmptyFormField } from '@/types'
import { getFormById, updateForm } from '@/lib/api/form-api'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import { useSortedFields } from '@/lib/hooks/use-sorted-fields'
import { getAllTemplates } from '@/lib/default-templates'
import { getReportTemplates } from '@/lib/api/template-api'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import SaveStatusIndicator from '@/components/ui/SaveStatusIndicator'
import SegmentedControl from '@/components/ui/SegmentedControl'
import QuestionCard from '@/components/form-builder/QuestionCard'
import FloatingToolbar from '@/components/form-builder/FloatingToolbar'
import TemplateLinkModal from '@/components/form-builder/TemplateLinkModal'
import FieldMappingEditor from '@/components/form-builder/FieldMappingEditor'
import FormPreview from '@/components/form-builder/FormPreview'
import SectionDeleteModal from '@/components/ui/SectionDeleteModal'
import SectionReorderModal from '@/components/form-builder/SectionReorderModal'
import GenerateFormLinkModal from '@/components/form-builder/GenerateFormLinkModal'
import ScoringTab from '@/components/form-builder/ScoringTab'
import SectionSidebar from '@/components/form-builder/SectionSidebar'

type ViewMode = 'editor' | 'preview' | 'mapping' | 'scoring'

/**
 * Garante que o form sempre comece com section-header.
 * Forms antigos sem secao ou com orfas (campos antes do primeiro
 * section-header) ganham uma secao 'Geral' no inicio que absorve
 * essas orfas.
 */
function ensureSectionsAtStart(form: Form): { form: Form; migrated: boolean } {
  const sorted = [...form.fields].sort((a, b) => a.order - b.order)

  if (sorted.length === 0) {
    const section = createEmptyFormField('section-header', 0)
    section.label = 'Seção 1'
    return { form: { ...form, fields: [section] }, migrated: true }
  }

  if (sorted[0].type === 'section-header') {
    return { form, migrated: false }
  }

  const newSection = createEmptyFormField('section-header', 0)
  const hasAnySection = sorted.some((f) => f.type === 'section-header')
  newSection.label = hasAnySection ? 'Geral' : 'Seção 1'

  const reordered = [newSection, ...sorted].map((f, i) => ({ ...f, order: i }))
  return { form: { ...form, fields: reordered }, migrated: true }
}

export default function FormBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<Form | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('editor')
  const [showTemplateLinkModal, setShowTemplateLinkModal] = useState(false)
  const [showSectionReorderModal, setShowSectionReorderModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  const updateFormFn = useCallback((data: Form) => updateForm(data), [])
  const { saveStatus, scheduleSave, forceSave } = useAutoSave<Form>(updateFormFn)
  const [templates, setTemplates] = useState(() => getAllTemplates([]))

  // Load form and templates
  useEffect(() => {
    if (!id) return
    Promise.all([getFormById(id), getReportTemplates()])
      .then(([raw, customTemplates]) => {
        if (raw) {
          const { form: normalized, migrated } = ensureSectionsAtStart(raw)
          setForm(normalized)
          if (migrated) scheduleSave(normalized)
          const firstSection = normalized.fields.find((f) => f.type === 'section-header')
          if (firstSection) setActiveSectionId(firstSection.id)
        } else {
          navigate('/forms')
        }
        setTemplates(getAllTemplates(customTemplates))
      })
      .catch(() => navigate('/forms'))
  }, [id, navigate, scheduleSave])

  const updateFormState = useCallback((patch: Partial<Form>) => {
    setForm((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      scheduleSave(updated)
      return updated
    })
  }, [scheduleSave])

  // Force save on navigation
  const handleBack = useCallback(async () => {
    if (form) await forceSave(form)
    navigate('/forms')
  }, [form, navigate, forceSave])

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const { sortedFields, sectionGroups } = useSortedFields(form?.fields)

  const sectionTabs = useMemo(
    () => sectionGroups
      .filter((g) => g.sectionField)
      .map((g) => ({ id: g.sectionFieldId, title: g.sectionTitle })),
    [sectionGroups],
  )

  const activeGroup = useMemo(
    () => sectionGroups.find((g) => g.sectionFieldId === activeSectionId) ?? null,
    [sectionGroups, activeSectionId],
  )

  const activeChildren = activeGroup?.children ?? []

  /** Reconstroi form.fields preservando outras secoes e substituindo os children da ativa. */
  const replaceActiveChildren = useCallback(
    (newChildren: FormField[]): FormField[] => {
      const out: FormField[] = []
      for (const group of sectionGroups) {
        if (group.sectionField) out.push(group.sectionField)
        if (group.sectionFieldId === activeSectionId) {
          out.push(...newChildren)
        } else {
          out.push(...group.children)
        }
      }
      return out.map((f, i) => ({ ...f, order: i }))
    },
    [sectionGroups, activeSectionId],
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !form || !activeGroup) return

    const oldIndex = activeGroup.children.findIndex((f) => f.id === active.id)
    const newIndex = activeGroup.children.findIndex((f) => f.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const newChildren = [...activeGroup.children]
    const [moved] = newChildren.splice(oldIndex, 1)
    newChildren.splice(newIndex, 0, moved)

    updateFormState({ fields: replaceActiveChildren(newChildren) })
  }, [form, activeGroup, replaceActiveChildren, updateFormState])

  // ─── Field CRUD ───────────────────────────────────────

  const addFieldAfterFocused = useCallback((type: FormFieldType) => {
    if (!form) return

    if (type === 'section-header') {
      const sorted = [...form.fields].sort((a, b) => a.order - b.order)
      const sectionCount = sorted.filter((f) => f.type === 'section-header').length
      const section = createEmptyFormField('section-header', sorted.length)
      section.label = `Seção ${sectionCount + 1}`
      const reordered = [...sorted, section].map((f, i) => ({ ...f, order: i }))
      updateFormState({ fields: reordered })
      setActiveSectionId(section.id)
      setFocusedFieldId(null)
      return
    }

    if (!activeGroup) return

    const newField = createEmptyFormField(type, 0)
    const focusedInActive = focusedFieldId
      ? activeGroup.children.some((c) => c.id === focusedFieldId)
      : false

    const newChildren = [...activeGroup.children]
    if (focusedInActive) {
      const idx = newChildren.findIndex((c) => c.id === focusedFieldId)
      newChildren.splice(idx + 1, 0, newField)
    } else {
      newChildren.push(newField)
    }

    updateFormState({ fields: replaceActiveChildren(newChildren) })
    setFocusedFieldId(newField.id)
  }, [form, activeGroup, focusedFieldId, replaceActiveChildren, updateFormState])

  const handleFieldUpdate = useCallback((updatedField: FormField) => {
    if (!form) return
    const fields = form.fields.map((f) =>
      f.id === updatedField.id ? updatedField : f
    )
    updateFormState({ fields })
  }, [form, updateFormState])

  const handleDuplicateField = useCallback((fieldId: string) => {
    if (!form) return
    const sorted = [...form.fields].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((f) => f.id === fieldId)
    if (idx < 0) return
    const original = sorted[idx]

    const duplicate: FormField = {
      ...original,
      id: crypto.randomUUID(),
      order: 0,
      options: original.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
    }

    const updated = [...sorted]
    updated.splice(idx + 1, 0, duplicate)
    const reordered = updated.map((f, i) => ({ ...f, order: i }))

    updateFormState({ fields: reordered })
    setFocusedFieldId(duplicate.id)
  }, [form, updateFormState])

  const handleRemoveField = useCallback((fieldId: string) => {
    if (!form) return
    const fields = form.fields
      .filter((f) => f.id !== fieldId)
      .map((f, i) => ({ ...f, order: i }))
    const fieldMappings = form.fieldMappings.filter((m) => m.fieldId !== fieldId)
    updateFormState({ fields, fieldMappings })
    if (focusedFieldId === fieldId) setFocusedFieldId(null)
    if (activeSectionId === fieldId) {
      const remainingSections = fields.filter((f) => f.type === 'section-header')
      setActiveSectionId(remainingSections[0]?.id ?? null)
    }
  }, [form, updateFormState, focusedFieldId, activeSectionId])

  // ─── Section delete with modal ────────────────────────

  const [sectionDeleteTarget, setSectionDeleteTarget] = useState<{
    sectionFieldId: string
    sectionTitle: string
    childFieldIds: string[]
  } | null>(null)

  const handleRemoveFieldOrSection = useCallback((fieldId: string) => {
    if (!form) return
    const field = form.fields.find((f) => f.id === fieldId)
    if (!field) return

    if (field.type === 'section-header') {
      const group = sectionGroups.find((g) => g.sectionFieldId === fieldId && g.sectionField)
      if (group && group.children.length > 0) {
        setSectionDeleteTarget({
          sectionFieldId: fieldId,
          sectionTitle: group.sectionTitle,
          childFieldIds: group.children.map((f) => f.id),
        })
        return
      }
    }
    handleRemoveField(fieldId)
  }, [form, sectionGroups, handleRemoveField])

  const handleDeleteAllSection = useCallback(() => {
    if (!form || !sectionDeleteTarget) return
    const idsToRemove = new Set([sectionDeleteTarget.sectionFieldId, ...sectionDeleteTarget.childFieldIds])
    const fields = form.fields
      .filter((f) => !idsToRemove.has(f.id))
      .map((f, i) => ({ ...f, order: i }))
    const fieldMappings = form.fieldMappings.filter((m) => !idsToRemove.has(m.fieldId))
    updateFormState({ fields, fieldMappings })
    setSectionDeleteTarget(null)
  }, [form, sectionDeleteTarget, updateFormState])

  const handleMoveAndDeleteSection = useCallback((targetSectionId: string) => {
    if (!form || !sectionDeleteTarget) return
    const sorted = [...form.fields].sort((a, b) => a.order - b.order)

    const targetGroup = sectionGroups.find((g) => g.sectionFieldId === targetSectionId)
    if (!targetGroup) return

    const targetFieldIds = [targetGroup.sectionFieldId, ...targetGroup.children.map((f) => f.id)]
    const lastTargetIndex = Math.max(...targetFieldIds.map((id) => sorted.findIndex((f) => f.id === id)))

    const childFieldIds = new Set(sectionDeleteTarget.childFieldIds)
    const childFields = sorted.filter((f) => childFieldIds.has(f.id))
    const remaining = sorted.filter(
      (f) => f.id !== sectionDeleteTarget.sectionFieldId && !childFieldIds.has(f.id)
    )

    const lastTargetField = sorted[lastTargetIndex]
    const insertIndex = remaining.findIndex((f) => f.id === lastTargetField.id) + 1
    remaining.splice(insertIndex, 0, ...childFields)

    const reordered = remaining.map((f, i) => ({ ...f, order: i }))
    const fieldMappings = form.fieldMappings.filter((m) => m.fieldId !== sectionDeleteTarget.sectionFieldId)
    updateFormState({ fields: reordered, fieldMappings })
    setSectionDeleteTarget(null)
  }, [form, sectionDeleteTarget, sectionGroups, updateFormState])

  const deleteTargetSections = useMemo(() => {
    if (!sectionDeleteTarget) return []
    return sectionGroups
      .filter((g) => g.sectionField && g.sectionFieldId !== sectionDeleteTarget.sectionFieldId)
      .map((g) => ({ value: g.sectionFieldId, label: g.sectionTitle }))
  }, [sectionGroups, sectionDeleteTarget])

  // ─── Section reorder ─────────────────────────────────

  const sectionReorderItems = useMemo(() => {
    return sectionGroups
      .filter((g) => g.sectionField)
      .map((g) => ({
        id: g.sectionFieldId,
        title: g.sectionTitle,
        childCount: g.children.length,
      }))
  }, [sectionGroups])

  const handleReorderSections = useCallback((orderedSectionIds: string[]) => {
    if (!form) return

    // Build a map: sectionId -> [sectionField, ...children]
    const groupMap = new Map<string, FormField[]>()
    const orphans: FormField[] = [] // fields before any section
    for (const group of sectionGroups) {
      if (group.sectionField) {
        groupMap.set(group.sectionFieldId, [group.sectionField, ...group.children])
      } else {
        orphans.push(...group.children)
      }
    }

    // Rebuild in new order: orphans first, then sections in new order
    const reordered: FormField[] = [...orphans]
    for (const sectionId of orderedSectionIds) {
      const groupFields = groupMap.get(sectionId)
      if (groupFields) reordered.push(...groupFields)
    }

    // Also add any sections not in the reorder list (shouldn't happen but safety)
    for (const [id, fields] of groupMap) {
      if (!orderedSectionIds.includes(id)) reordered.push(...fields)
    }

    const numbered = reordered.map((f, i) => ({ ...f, order: i }))
    updateFormState({ fields: numbered })
  }, [form, sectionGroups, updateFormState])

  // "Mesclar com seção acima" — remove section header, children join previous section
  const handleMergeUp = useCallback((sectionFieldId: string) => {
    if (!form) return
    const fields = form.fields
      .filter((f) => f.id !== sectionFieldId)
      .map((f, i) => ({ ...f, order: i }))
    const fieldMappings = form.fieldMappings.filter((m) => m.fieldId !== sectionFieldId)
    updateFormState({ fields, fieldMappings })
  }, [form, updateFormState])

  // ─── Derived ──────────────────────────────────────────

  const linkedTemplate = useMemo(
    () => form?.linkedTemplateId ? templates.find((t) => t.id === form.linkedTemplateId) ?? null : null,
    [form, templates]
  )

  const activeChildIds = useMemo(() => activeChildren.map((f) => f.id), [activeChildren])

  /** Reativa primeira secao se a ativa some (apos delete em cascata, merge, etc). */
  useEffect(() => {
    if (!form) return
    const sections = form.fields.filter((f) => f.type === 'section-header')
    if (sections.length === 0) return
    if (!activeSectionId || !sections.some((s) => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id)
    }
  }, [form, activeSectionId])

  // ─── Section actions (tabs) ──────────────────────────

  const handleRenameSection = useCallback((sectionId: string, newTitle: string) => {
    if (!form) return
    const fields = form.fields.map((f) =>
      f.id === sectionId ? { ...f, label: newTitle } : f
    )
    updateFormState({ fields })
  }, [form, updateFormState])

  const handleAddSection = useCallback(() => {
    addFieldAfterFocused('section-header')
  }, [addFieldAfterFocused])

  const handleRemoveSection = useCallback((sectionId: string) => {
    if (sectionTabs.length <= 1) return
    handleRemoveFieldOrSection(sectionId)
  }, [sectionTabs.length, handleRemoveFieldOrSection])

  // Template link
  const handleTemplateSelect = useCallback((templateId: string | null) => {
    updateFormState({ linkedTemplateId: templateId })
  }, [updateFormState])

  // Click outside cards to unfocus
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only unfocus if clicking the container itself, not a card
    if (e.target === e.currentTarget) {
      setFocusedFieldId(null)
    }
  }, [])

  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <main
        className="min-h-screen bg-gray-100 pb-6"
        onClick={handleContainerClick}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        {/* Header — sticky logo abaixo da GlobalTopBar (h-12) */}
        <div className="sticky top-12 z-30 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5">
            <div className="flex items-center justify-between">
              {/* Left: back + save status */}
              <div className="flex items-center gap-2 w-40 shrink-0">
                <button
                  type="button"
                  onClick={handleBack}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/80 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Voltar"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                  </svg>
                </button>
                <SaveStatusIndicator status={saveStatus} showLabel={false} />
              </div>

              {/* Center: nome do form */}
              <div className="flex items-center gap-2 min-w-0 justify-center flex-1">
                <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                  {form.title || 'Formulário sem título'}
                </span>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2 shrink-0">
                <SegmentedControl
                  options={[
                    { value: 'editor', label: 'Perguntas' },
                    { value: 'scoring', label: 'Pontuação' },
                    { value: 'preview', label: 'Preview' },
                  ]}
                  value={viewMode}
                  onChange={(v) => setViewMode(v as ViewMode)}
                  size="sm"
                />

                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                  title="Gerar Link"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>

                <Button
                  variant={form.linkedTemplateId ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowTemplateLinkModal(true)}
                  className="hidden sm:inline-flex rounded-full"
                >
                  {form.linkedTemplateId ? linkedTemplate?.name ?? 'Template' : 'Vincular Template'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Editor mode */}
        {viewMode === 'editor' && (
          <div className="pt-10 lg:pt-14 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8">
            {/* Spacer (lg+): alinha o menu na mesma posicao do menu do ReportEditor,
                que tem uma toolbar lateral w-12 antes do summary */}
            <div className="hidden lg:block lg:w-12 lg:shrink-0" aria-hidden="true" />

            {/* Sidebar (sections) — desktop sticky a esquerda, mobile stacked on top */}
            <SectionSidebar
              sections={sectionTabs}
              activeId={activeSectionId}
              onActivate={(sid) => { setActiveSectionId(sid); setFocusedFieldId(null) }}
              onRename={handleRenameSection}
              onAdd={handleAddSection}
              onRemove={handleRemoveSection}
              onReorder={handleReorderSections}
            />

            {/* Content column: ocupa o restante, limita largura mas sem centralizar
                — mesmo padrao do SectionEditor no ReportEditor (cola apos o gap da sidebar) */}
            <div className="flex-1 min-w-0">
              <div className="max-w-4xl">
                {/* Title card (always visible, always editable) */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-3">
                  <div className="h-2.5 bg-brand-500 rounded-t-lg" />
                  <div className="px-6 py-5">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateFormState({ title: e.target.value })}
                      placeholder="Formulário sem título"
                      className="w-full text-2xl font-normal text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-400"
                    />
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => updateFormState({ description: e.target.value })}
                      placeholder="Descrição do formulário"
                      className="w-full text-sm text-gray-600 bg-transparent border-none outline-none mt-2 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Question cards with DnD (active section only) */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={activeChildIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {activeChildren.map((field) => {
                        const isFocused = focusedFieldId === field.id

                        return (
                          <div key={field.id} className="relative">
                            <QuestionCard
                              field={field}
                              allFields={form?.fields ?? []}
                              isFocused={isFocused}
                              onFocus={() => setFocusedFieldId(field.id)}
                              onUpdate={handleFieldUpdate}
                              onDuplicate={() => handleDuplicateField(field.id)}
                              onRemove={() => handleRemoveFieldOrSection(field.id)}
                              onReorderSections={() => setShowSectionReorderModal(true)}
                              onMergeUp={() => handleMergeUp(field.id)}
                            />

                            {/* Floating toolbar - positioned to the right of the focused card */}
                            {isFocused && (
                              <div className="absolute -right-14 top-1/2 -translate-y-1/2 hidden xl:block">
                                <FloatingToolbar
                                  onAddQuestion={() => addFieldAfterFocused('single-choice')}
                                  onAddSection={() => addFieldAfterFocused('section-header')}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Empty state for active section */}
                {activeChildren.length === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                    <p className="text-gray-400 text-sm mb-4">
                      Esta seção ainda não tem perguntas
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => addFieldAfterFocused('single-choice')}
                        className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                      >
                        Adicionar pergunta
                      </button>
                      <button
                        type="button"
                        onClick={() => addFieldAfterFocused('section-header')}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Nova seção
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile floating action buttons (visible on smaller screens) */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 lg:hidden z-20">
              <button
                type="button"
                onClick={() => addFieldAfterFocused('section-header')}
                className="w-12 h-12 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                title="Adicionar seção"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => addFieldAfterFocused('single-choice')}
                className="w-14 h-14 rounded-full bg-brand-500 shadow-lg flex items-center justify-center text-white hover:bg-brand-600 transition-colors"
                title="Adicionar pergunta"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Preview mode */}
        {viewMode === 'preview' && (
          <div className="max-w-[860px] mx-auto px-4">
            <FormPreview
              title={form.title}
              description={form.description}
              fields={sortedFields}
            />
          </div>
        )}

        {/* Scoring mode */}
        {viewMode === 'scoring' && (
          <div className="max-w-[860px] mx-auto px-4">
            <ScoringTab
              fields={sortedFields}
              scoringConfig={form.scoringConfig}
              onChange={(scoringConfig) => updateFormState({ scoringConfig })}
            />
          </div>
        )}

        {/* Mapping mode */}
        {viewMode === 'mapping' && (
          <div className="max-w-[860px] mx-auto px-4">
            <FieldMappingEditor
              fields={sortedFields}
              mappings={form.fieldMappings}
              template={linkedTemplate}
              onChange={(mappings) => updateFormState({ fieldMappings: mappings })}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <TemplateLinkModal
        isOpen={showTemplateLinkModal}
        onClose={() => setShowTemplateLinkModal(false)}
        templates={templates}
        currentTemplateId={form.linkedTemplateId}
        onSelect={handleTemplateSelect}
      />

      <SectionDeleteModal
        isOpen={!!sectionDeleteTarget}
        onClose={() => setSectionDeleteTarget(null)}
        sectionTitle={sectionDeleteTarget?.sectionTitle ?? ''}
        childCount={sectionDeleteTarget?.childFieldIds.length ?? 0}
        targetSections={deleteTargetSections}
        onDeleteAll={handleDeleteAllSection}
        onMoveAndDelete={handleMoveAndDeleteSection}
      />

      <SectionReorderModal
        isOpen={showSectionReorderModal}
        onClose={() => setShowSectionReorderModal(false)}
        sections={sectionReorderItems}
        onReorder={handleReorderSections}
      />

      {id && (
        <GenerateFormLinkModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          formId={id}
        />
      )}
    </>
  )
}
