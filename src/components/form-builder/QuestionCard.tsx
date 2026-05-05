import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AddressSubfieldKey, ConditionalRule, FormField, FormFieldType, LikertScalePoint, LikertRow } from '@/types'
import {
  ADDRESS_SUBFIELD_KEYS,
  ADDRESS_SUBFIELD_LABELS,
  createDefaultAddressSubfields,
  createEmptyFormFieldOption,
  createEmptyInventoryOption,
  createEmptyLikertRow,
  createDefaultLikertScale,
} from '@/types'
import { sanitizeVariableKey } from '@/lib/variable-service'
import {
  DragDotsIcon,
  CopyIcon,
  TrashIcon,
  ThreeDotsIcon,
  CloseIcon,
  CheckIcon,
  CalendarIcon,
} from '@/components/icons'
import ConditionalLogicEditor from '@/components/form-builder/ConditionalLogicEditor'
import IconButton from '@/components/ui/IconButton'

// ─── Props ────────────────────────────────────────────────────

interface QuestionCardProps {
  field: FormField
  allFields?: FormField[]
  isFocused: boolean
  onFocus: () => void
  onUpdate: (field: FormField) => void
  onDuplicate: () => void
  onRemove: () => void
  onReorderSections?: () => void
  onMergeUp?: () => void
  sectionIndex?: number
  totalSections?: number
}

// ─── Type options for dropdown ────────────────────────────────

const questionTypes: { type: FormFieldType; label: string }[] = [
  { type: 'short-text', label: 'Resposta curta' },
  { type: 'long-text', label: 'Parágrafo' },
  { type: 'single-choice', label: 'Múltipla escolha' },
  { type: 'multiple-choice', label: 'Caixas de seleção' },
  { type: 'scale', label: 'Escala linear' },
  { type: 'yes-no', label: 'Sim/Não' },
  { type: 'date', label: 'Data' },
  { type: 'address', label: 'Endereço' },
  { type: 'inventory-item', label: 'Inventário (pontuável)' },
  { type: 'likert-matrix', label: 'Matriz Likert (pontuável)' },
]

// ─── Component ────────────────────────────────────────────────

export default function QuestionCard({
  field,
  allFields = [],
  isFocused,
  onFocus,
  onUpdate,
  onDuplicate,
  onRemove,
  onReorderSections,
  onMergeUp,
  sectionIndex,
  totalSections,
}: QuestionCardProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showSectionMenu, setShowSectionMenu] = useState(false)
  const [showVarKey, setShowVarKey] = useState(!!(field.variableKey ?? ''))
  const [showDescription, setShowDescription] = useState(!!field.description)
  const [showLogic, setShowLogic] = useState(!!(field.showWhen && field.showWhen.length > 0))

  const isSectionHeader = field.type === 'section-header'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, disabled: isSectionHeader })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Reset menus when losing focus
  useEffect(() => {
    if (!isFocused) {
      setShowMoreMenu(false)
      setShowSectionMenu(false)
    }
  }, [isFocused])

  // ─── Updaters ───────────────────────────────────────────

  const update = (patch: Partial<FormField>) => {
    onUpdate({ ...field, ...patch })
  }

  const handleTypeChange = (newType: FormFieldType) => {
    const updated: Partial<FormField> = { type: newType }
    if (
      (newType === 'single-choice' || newType === 'multiple-choice') &&
      field.options.length < 2
    ) {
      updated.options = [createEmptyFormFieldOption(), createEmptyFormFieldOption()]
    }
    if (newType === 'inventory-item') {
      if (field.options.length < 2) {
        updated.options = [
          createEmptyInventoryOption(0),
          createEmptyInventoryOption(1),
          createEmptyInventoryOption(2),
          createEmptyInventoryOption(3),
        ]
      } else {
        updated.options = field.options.map((opt, i) => ({
          ...opt,
          value: opt.value ?? i,
        }))
      }
    }
    if (newType === 'likert-matrix') {
      if (field.likertScale.length === 0) updated.likertScale = createDefaultLikertScale()
      if (field.likertRows.length === 0) updated.likertRows = [createEmptyLikertRow()]
    }
    if (newType === 'address' && !field.addressSubfields) {
      updated.addressSubfields = createDefaultAddressSubfields()
    }
    update(updated)
  }

  const updateOption = (index: number, label: string) => {
    const options = field.options.map((opt, i) =>
      i === index ? { ...opt, label } : opt
    )
    update({ options })
  }

  const addOption = () => {
    update({ options: [...field.options, createEmptyFormFieldOption()] })
  }

  const removeOption = (index: number) => {
    if (field.options.length <= 1) return
    update({ options: field.options.filter((_, i) => i !== index) })
  }

  // ─── Render: Section Header ─────────────────────────────

  if (isSectionHeader) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        data-field-id={field.id}
        className={`mt-6 ${isFocused ? 'border-l-[6px] border-l-brand-500 rounded-l-lg' : ''}`}
      >
        {/* Section badge */}
        {sectionIndex != null && totalSections != null && (
          <div>
            <span className={`inline-block bg-brand-500 text-white text-sm font-medium px-4 py-1.5 ${isFocused ? 'rounded-tr-lg' : 'rounded-t-lg'}`}>
              Seção {sectionIndex} de {totalSections}
            </span>
          </div>
        )}

        <div
          className={`bg-white shadow-sm cursor-pointer transition-all ${
            isFocused
              ? 'rounded-br-lg border-y border-r border-gray-200'
              : 'overflow-hidden rounded-b-lg rounded-tr-lg border border-gray-200'
          }`}
          onClick={onFocus}
        >

          <div className="px-6 py-4">
            {isFocused ? (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => update({ label: e.target.value })}
                    placeholder="Título da seção"
                    className="w-full text-base font-normal text-gray-900 bg-gray-50 border-b border-gray-300 px-2 py-2 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
                  />
                  <input
                    type="text"
                    value={field.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Descrição (opcional)"
                    className="w-full text-sm text-gray-600 bg-transparent border-b border-gray-200 px-2 py-2 mt-2 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Section actions: collapse + three-dots */}
                <div className="flex items-center gap-0.5 shrink-0 pt-1">
                  {/* Three-dots menu */}
                  <div className="relative">
                    <IconButton
                      icon={<ThreeDotsIcon />}
                      label="Opções da seção"
                      onClick={(e) => { e.stopPropagation(); setShowSectionMenu(!showSectionMenu) }}
                    />

                    {showSectionMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowSectionMenu(false)} />
                        <div className="absolute right-0 top-10 z-20 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowSectionMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Duplicar seção
                          </button>
                          {onMergeUp && sectionIndex != null && sectionIndex > 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onMergeUp(); setShowSectionMenu(false) }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Mesclar com a seção acima
                            </button>
                          )}
                          {onReorderSections && totalSections != null && totalSections > 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onReorderSections(); setShowSectionMenu(false) }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Reorganizar seções
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (showLogic) update({ showWhen: undefined })
                              setShowLogic(!showLogic)
                              setShowSectionMenu(false)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            {showLogic ? <CheckIcon /> : <span className="w-4" />}
                            Lógica condicional
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRemove(); setShowSectionMenu(false) }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Excluir seção
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-base font-normal text-gray-900">
                  {field.label || 'Seção sem título'}
                </h2>
                {field.description && (
                  <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                )}
              </>
            )}

            {showLogic && isFocused && (
              <div className="mt-4 bg-gray-50/60 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">
                  A seção inteira (esta seção e todas as perguntas dentro dela) só aparece quando:
                </p>
                <ConditionalLogicEditor
                  field={field}
                  allFields={allFields}
                  onUpdate={(rules: ConditionalRule[] | undefined) => update({ showWhen: rules })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Question (unfocused) ───────────────────────

  if (!isFocused) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        data-field-id={field.id}
        className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300 transition-all"
        onClick={onFocus}
      >
        <div className="px-6 py-5">
          {/* Question label */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-gray-900 flex-1 min-w-0">
              {field.label || 'Pergunta'}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </p>
            {field.collectionMode === 'presencial' ? (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                Presencial
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                Online
              </span>
            )}
          </div>

          {/* Compact preview by type */}
          <div className="mt-3">
            {renderCompactPreview(field)}
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Question (focused) ─────────────────────────

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-field-id={field.id}
      className="bg-white rounded-r-lg rounded-l-none border-y border-r border-gray-200 border-l-[6px] border-l-brand-500 shadow-md transition-all"
      onClick={onFocus}
    >
      {/* Drag handle centered */}
      <div className="flex justify-center pt-1 pb-0">
        <button
          type="button"
          className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400"
          {...attributes}
          {...listeners}
        >
          <DragDotsIcon />
        </button>
      </div>

      <div className="px-6 pb-5">
        {/* Question input + Type dropdown */}
        <div className="flex items-start gap-4 mb-4">
          <input
            type="text"
            value={field.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder={field.type === 'likert-matrix' ? 'Enunciado' : 'Pergunta'}
            className="flex-1 text-base text-gray-900 bg-gray-50 border-b border-gray-300 px-2 py-2 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
          />

          <select
            value={field.type}
            onChange={(e) => handleTypeChange(e.target.value as FormFieldType)}
            className="shrink-0 text-sm bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none cursor-pointer"
          >
            {questionTypes.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type-specific content */}
        {renderFocusedContent(field, {
          updateOption,
          addOption,
          removeOption,
          update,
        })}

        {/* Validation (only for short-text) */}
        {field.type === 'short-text' && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">Validação:</span>
            <select
              value={field.validation ?? ''}
              onChange={(e) => {
                const v = e.target.value
                update({ validation: v === '' ? undefined : (v as FormField['validation']) })
              }}
              className="text-sm bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none cursor-pointer"
            >
              <option value="">Nenhuma</option>
              <option value="cpf">CPF</option>
              <option value="phone-br">Telefone (BR)</option>
              <option value="email">Email</option>
              <option value="cep">CEP</option>
            </select>
          </div>
        )}

        {/* Description (toggleable) */}
        {showDescription && (
          <div className="mt-4">
            <input
              type="text"
              value={field.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Descrição (opcional)"
              className="w-full text-sm text-gray-600 bg-transparent border-b border-gray-200 px-2 py-1.5 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Variable key (toggleable) */}
        {showVarKey && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">Variável:</span>
            <input
              type="text"
              value={field.variableKey ?? ''}
              onChange={(e) => update({ variableKey: sanitizeVariableKey(e.target.value) })}
              placeholder="ex: queixa_principal"
              className="flex-1 text-xs font-mono text-brand-600 bg-brand-50/50 border border-brand-200 rounded px-2 py-1 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Conditional logic (toggleable) */}
        {showLogic && (
          <div className="mt-3 bg-gray-50/60 border border-gray-200 rounded-lg p-3">
            {isSectionHeader && (
              <p className="text-xs text-gray-500 mb-2">
                A seção inteira (esta seção e todas as perguntas dentro dela) só aparece quando:
              </p>
            )}
            <ConditionalLogicEditor
              field={field}
              allFields={allFields}
              onUpdate={(rules: ConditionalRule[] | undefined) => update({ showWhen: rules })}
            />
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-gray-200 mt-5 pt-3">
          <div className="flex items-center justify-end gap-1">
            {/* Copy */}
            <IconButton
              icon={<CopyIcon />}
              label="Duplicar"
              onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            />

            {/* Delete */}
            <IconButton
              icon={<TrashIcon />}
              label="Excluir"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
            />

            {/* Vertical separator */}
            <div className="w-px h-6 bg-gray-200 mx-2" />

            {/* Collection mode toggle (online | presencial) */}
            <span className="text-sm text-gray-600 mr-1">Presencial</span>
            <button
              type="button"
              role="switch"
              aria-checked={field.collectionMode === 'presencial'}
              title="Marcar como coleta presencial (cliente não vê)"
              onClick={(e) => {
                e.stopPropagation()
                update({ collectionMode: field.collectionMode === 'presencial' ? 'online' : 'presencial' })
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                field.collectionMode === 'presencial' ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  field.collectionMode === 'presencial' ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>

            {/* Vertical separator */}
            <div className="w-px h-6 bg-gray-200 mx-2" />

            {/* Required toggle */}
            <span className="text-sm text-gray-600 mr-1">Obrigatória</span>
            <button
              type="button"
              role="switch"
              aria-checked={field.required}
              onClick={(e) => { e.stopPropagation(); update({ required: !field.required }) }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                field.required ? 'bg-brand-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  field.required ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>

            {/* Three-dots menu */}
            <div className="relative ml-1">
              <IconButton
                icon={<ThreeDotsIcon />}
                label="Mais opções"
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu) }}
              />

              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 bottom-10 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <button
                      type="button"
                      onClick={() => { setShowDescription(!showDescription); setShowMoreMenu(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {showDescription ? <CheckIcon /> : <span className="w-4" />}
                      Descrição
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowVarKey(!showVarKey); setShowMoreMenu(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {showVarKey ? <CheckIcon /> : <span className="w-4" />}
                      Chave de variável
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (showLogic) update({ showWhen: undefined })
                        setShowLogic(!showLogic)
                        setShowMoreMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {showLogic ? <CheckIcon /> : <span className="w-4" />}
                      Lógica condicional
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Compact preview (unfocused) ──────────────────────────

function renderCompactPreview(field: FormField) {
  switch (field.type) {
    case 'short-text':
      return (
        <div className="border-b border-gray-200 pb-1 w-1/2">
          <span className="text-xs text-gray-400">Texto de resposta curta</span>
        </div>
      )

    case 'long-text':
      return (
        <div className="border-b border-gray-200 pb-1">
          <span className="text-xs text-gray-400">Texto de resposta longa</span>
        </div>
      )

    case 'single-choice':
      return (
        <div className="space-y-1.5">
          {field.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
              <span className="text-sm text-gray-600">{opt.label || `Opção ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )

    case 'multiple-choice':
      return (
        <div className="space-y-1.5">
          {field.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded border-2 border-gray-300 shrink-0" />
              <span className="text-sm text-gray-600">{opt.label || `Opção ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )

    case 'scale': {
      const values = Array.from(
        { length: field.scaleMax - field.scaleMin + 1 },
        (_, i) => field.scaleMin + i
      )
      return (
        <div className="flex items-center gap-2.5">
          {field.scaleMinLabel && (
            <span className="text-xs text-gray-400 shrink-0">{field.scaleMinLabel}</span>
          )}
          <div className="flex items-center gap-2">
            {values.map((v) => (
              <span key={v} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-500">
                {v}
              </span>
            ))}
          </div>
          {field.scaleMaxLabel && (
            <span className="text-xs text-gray-400 shrink-0">{field.scaleMaxLabel}</span>
          )}
        </div>
      )
    }

    case 'yes-no':
      return (
        <div className="flex gap-3">
          <span className="px-4 py-1.5 rounded-full bg-gray-100 text-sm text-gray-500">Sim</span>
          <span className="px-4 py-1.5 rounded-full bg-gray-100 text-sm text-gray-500">Não</span>
        </div>
      )

    case 'date':
      return (
        <div className="border-b border-gray-200 pb-1 w-40">
          <span className="text-xs text-gray-400">dd/mm/aaaa</span>
        </div>
      )

    case 'inventory-item':
      return (
        <div className="space-y-1.5">
          {field.options.slice(0, 4).map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
              <span className="text-sm text-gray-600 flex-1">{opt.label || `Opção ${i + 1}`}</span>
              <span className="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                {opt.value ?? 0}
              </span>
            </div>
          ))}
          {field.options.length > 4 && (
            <span className="text-xs text-gray-400">+{field.options.length - 4} opções</span>
          )}
        </div>
      )

    case 'likert-matrix':
      return (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs text-gray-400 font-normal py-1.5 px-2 w-1/3"></th>
                {field.likertScale.map((point) => (
                  <th key={point.value} className="text-center text-xs text-gray-500 font-normal py-1.5 px-1.5">
                    {point.label || point.value}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {field.likertRows.slice(0, 4).map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="text-xs text-gray-600 py-1.5 px-2">
                    {row.label || `Pergunta ${idx + 1}`}
                  </td>
                  {field.likertScale.map((point) => (
                    <td key={point.value} className="text-center py-1.5 px-1.5">
                      <span className="inline-block w-3 h-3 rounded-full border border-gray-300" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {field.likertRows.length > 4 && (
            <p className="text-xs text-gray-400 mt-1 px-2">+{field.likertRows.length - 4} linhas</p>
          )}
        </div>
      )

    case 'address': {
      const stored = field.addressSubfields
      const isValidCfg = stored != null && ADDRESS_SUBFIELD_KEYS.every((k) => stored[k] !== undefined)
      const cfg = isValidCfg && stored ? stored : createDefaultAddressSubfields()
      const enabled = ADDRESS_SUBFIELD_KEYS.filter((k) => cfg[k].enabled)
      return (
        <div className="flex flex-wrap gap-1.5">
          {enabled.length === 0 ? (
            <span className="text-xs text-gray-400">Nenhum subcampo habilitado</span>
          ) : (
            enabled.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded"
              >
                {ADDRESS_SUBFIELD_LABELS[k]}
                {cfg[k].required && <span className="text-red-500">*</span>}
              </span>
            ))
          )}
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Focused content (editable) ───────────────────────────

interface ContentHelpers {
  updateOption: (index: number, label: string) => void
  addOption: () => void
  removeOption: (index: number) => void
  update: (patch: Partial<FormField>) => void
}

function renderFocusedContent(field: FormField, h: ContentHelpers) {
  switch (field.type) {
    case 'short-text':
      return (
        <div className="border-b border-dotted border-gray-200 pb-1 w-1/2">
          <span className="text-sm text-gray-400">Texto de resposta curta</span>
        </div>
      )

    case 'long-text':
      return (
        <div className="border-b border-dotted border-gray-200 pb-1">
          <span className="text-sm text-gray-400">Texto de resposta longa</span>
        </div>
      )

    case 'single-choice':
      return <ChoiceEditor field={field} marker="radio" helpers={h} />

    case 'multiple-choice':
      return <ChoiceEditor field={field} marker="checkbox" helpers={h} />

    case 'scale':
      return <ScaleEditor field={field} update={h.update} />

    case 'yes-no':
      return (
        <div className="flex gap-3">
          <span className="px-5 py-2 rounded-full bg-gray-100 text-sm text-gray-500">Sim</span>
          <span className="px-5 py-2 rounded-full bg-gray-100 text-sm text-gray-500">Não</span>
        </div>
      )

    case 'date':
      return (
        <div className="flex items-center gap-2 border-b border-dotted border-gray-200 pb-1 w-48">
          <CalendarIcon />
          <span className="text-sm text-gray-400">Dia, Mês, Ano</span>
        </div>
      )

    case 'inventory-item':
      return <InventoryItemEditor field={field} update={h.update} />

    case 'likert-matrix':
      return <LikertMatrixEditor field={field} update={h.update} />

    case 'address':
      return <AddressEditor field={field} update={h.update} />

    default:
      return null
  }
}

// ─── Choice editor (radio / checkbox) ─────────────────────

function ChoiceEditor({
  field,
  marker,
  helpers,
}: {
  field: FormField
  marker: 'radio' | 'checkbox'
  helpers: ContentHelpers
}) {
  return (
    <div className="space-y-2">
      {field.options.map((opt, index) => (
        <div key={opt.id} className="flex items-center gap-2.5 group/opt">
          {marker === 'radio' ? (
            <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded border-2 border-gray-300 shrink-0" />
          )}
          <input
            type="text"
            value={opt.label}
            onChange={(e) => helpers.updateOption(index, e.target.value)}
            placeholder={`Opção ${index + 1}`}
            className="flex-1 text-sm text-gray-700 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-300 px-1 py-1 focus:outline-none placeholder:text-gray-400 transition-colors"
          />
          {field.options.length > 1 && (
            <IconButton
              icon={<CloseIcon />}
              label="Remover opção"
              size="sm"
              className="text-gray-300 opacity-0 group-hover/opt:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); helpers.removeOption(index) }}
            />
          )}
        </div>
      ))}

      {/* Add option row */}
      <div className="flex items-center gap-2.5">
        {marker === 'radio' ? (
          <span className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
        ) : (
          <span className="w-4 h-4 rounded border-2 border-gray-200 shrink-0" />
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); helpers.addOption() }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-1 py-1"
        >
          Adicionar opção
        </button>
      </div>
    </div>
  )
}

// ─── Scale editor ─────────────────────────────────────────

function ScaleEditor({
  field,
  update,
}: {
  field: FormField
  update: (patch: Partial<FormField>) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={field.scaleMin}
            onChange={(e) => update({ scaleMin: Number(e.target.value) })}
            className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-brand-500 focus:outline-none"
          >
            {[0, 1].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span className="text-sm text-gray-400">até</span>
          <select
            value={field.scaleMax}
            onChange={(e) => update({ scaleMax: Number(e.target.value) })}
            className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-brand-500 focus:outline-none"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">{field.scaleMin}</span>
          <input
            type="text"
            value={field.scaleMinLabel}
            onChange={(e) => update({ scaleMinLabel: e.target.value })}
            placeholder="Rótulo (opcional)"
            className="flex-1 text-sm text-gray-700 border-b border-gray-200 px-1 py-1 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">{field.scaleMax}</span>
          <input
            type="text"
            value={field.scaleMaxLabel}
            onChange={(e) => update({ scaleMaxLabel: e.target.value })}
            placeholder="Rótulo (opcional)"
            className="flex-1 text-sm text-gray-700 border-b border-gray-200 px-1 py-1 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Inventory item editor ────────────────────────────────

function InventoryItemEditor({
  field,
  update,
}: {
  field: FormField
  update: (patch: Partial<FormField>) => void
}) {
  const updateOption = (index: number, patch: { label?: string; value?: number }) => {
    const options = field.options.map((opt, i) =>
      i === index ? { ...opt, ...patch } : opt,
    )
    update({ options })
  }

  const addOption = () => {
    const nextValue = field.options.reduce((max, o) => Math.max(max, o.value ?? 0), -1) + 1
    update({ options: [...field.options, createEmptyInventoryOption(nextValue)] })
  }

  const removeOption = (index: number) => {
    if (field.options.length <= 1) return
    update({ options: field.options.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Opções com valor pontuado</span>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={field.reverseScored}
            onChange={(e) => update({ reverseScored: e.target.checked })}
            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          Item reverso
        </label>
      </div>

      <div className="space-y-2">
        {field.options.map((opt, index) => (
          <div key={opt.id} className="flex items-center gap-2 group/opt">
            <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
            <input
              type="text"
              value={opt.label}
              onChange={(e) => updateOption(index, { label: e.target.value })}
              placeholder={`Opção ${index + 1}`}
              className="flex-1 text-sm text-gray-700 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-300 px-1 py-1 focus:outline-none placeholder:text-gray-400 transition-colors"
            />
            <input
              type="number"
              value={opt.value ?? 0}
              onChange={(e) => updateOption(index, { value: Number(e.target.value) })}
              className="w-16 text-sm font-mono text-brand-600 bg-brand-50/50 border border-brand-200 rounded px-2 py-1 text-center focus:border-brand-500 focus:outline-none"
            />
            {field.options.length > 1 && (
              <IconButton
                icon={<CloseIcon />}
                label="Remover opção"
                size="sm"
                className="text-gray-300 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeOption(index) }}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); addOption() }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-1 py-1"
        >
          Adicionar opção
        </button>
      </div>
    </div>
  )
}

// ─── Likert matrix editor ─────────────────────────────────

function LikertMatrixEditor({
  field,
  update,
}: {
  field: FormField
  update: (patch: Partial<FormField>) => void
}) {
  const updateScalePoint = (index: number, patch: Partial<LikertScalePoint>) => {
    const likertScale = field.likertScale.map((p, i) => (i === index ? { ...p, ...patch } : p))
    update({ likertScale })
  }

  const addScalePoint = () => {
    const nextValue = field.likertScale.reduce((max, p) => Math.max(max, p.value), -1) + 1
    update({ likertScale: [...field.likertScale, { value: nextValue, label: '' }] })
  }

  const removeScalePoint = (index: number) => {
    if (field.likertScale.length <= 2) return
    update({ likertScale: field.likertScale.filter((_, i) => i !== index) })
  }

  const updateRow = (index: number, patch: Partial<LikertRow>) => {
    const likertRows = field.likertRows.map((r, i) => (i === index ? { ...r, ...patch } : r))
    update({ likertRows })
  }

  const addRow = () => {
    update({ likertRows: [...field.likertRows, createEmptyLikertRow()] })
  }

  const removeRow = (index: number) => {
    if (field.likertRows.length <= 1) return
    update({ likertRows: field.likertRows.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {/* Scale */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400">Escala compartilhada</span>
        <div className="flex flex-wrap gap-2">
          {field.likertScale.map((point, index) => (
            <div key={point.value} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1 group/sp">
              <input
                type="number"
                value={point.value}
                onChange={(e) => updateScalePoint(index, { value: Number(e.target.value) })}
                className="w-12 text-sm font-mono text-brand-600 bg-white border border-brand-200 rounded px-1 py-0.5 text-center focus:border-brand-500 focus:outline-none"
              />
              <span className="text-xs text-gray-400">=</span>
              <input
                type="text"
                value={point.label}
                onChange={(e) => updateScalePoint(index, { label: e.target.value })}
                placeholder="Rótulo"
                className="w-28 text-sm text-gray-700 bg-white border border-gray-200 rounded px-2 py-0.5 focus:border-brand-500 focus:outline-none placeholder:text-gray-400"
              />
              {field.likertScale.length > 2 && (
                <IconButton
                  icon={<CloseIcon />}
                  label="Remover ponto"
                  size="sm"
                  className="!p-0.5 text-gray-400 hover:bg-gray-200 opacity-0 group-hover/sp:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeScalePoint(index) }}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); addScalePoint() }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            + ponto
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400">Opções</span>
        {field.likertRows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2 group/row">
            <span className="text-xs text-gray-400 w-6 shrink-0">{index + 1}.</span>
            <input
              type="text"
              value={row.label}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              placeholder={`Opção ${index + 1}`}
              className="flex-1 text-sm text-gray-700 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-300 px-1 py-1 focus:outline-none placeholder:text-gray-400 transition-colors"
            />
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={row.reverseScored}
                onChange={(e) => updateRow(index, { reverseScored: e.target.checked })}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Reversa
            </label>
            {field.likertRows.length > 1 && (
              <IconButton
                icon={<CloseIcon />}
                label="Remover opção"
                size="sm"
                className="text-gray-300 opacity-0 group-hover/row:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeRow(index) }}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); addRow() }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-1 py-1"
        >
          Adicionar opção
        </button>
      </div>
    </div>
  )
}

// ─── Address editor ───────────────────────────────────────

function AddressEditor({
  field,
  update,
}: {
  field: FormField
  update: (patch: Partial<FormField>) => void
}) {
  const stored = field.addressSubfields
  const isValid = stored != null && ADDRESS_SUBFIELD_KEYS.every((k) => stored[k] !== undefined)
  const cfg = isValid && stored ? stored : createDefaultAddressSubfields()

  const updateSubfield = (
    key: AddressSubfieldKey,
    patch: Partial<{ enabled: boolean; required: boolean }>,
  ) => {
    update({
      addressSubfields: {
        ...cfg,
        [key]: { ...cfg[key], ...patch },
      },
    })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 text-xs text-gray-400 pb-1 border-b border-gray-100">
        <span className="w-6" />
        <span>Subcampo</span>
        <span className="text-right">Obrigatório</span>
      </div>
      {ADDRESS_SUBFIELD_KEYS.map((key) => {
        const sub = cfg[key]
        return (
          <div key={key} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 group/addr">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sub.enabled}
                onChange={(e) => {
                  const enabled = e.target.checked
                  updateSubfield(key, enabled ? { enabled } : { enabled, required: false })
                }}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
            </label>
            <span className={`text-sm ${sub.enabled ? 'text-gray-700' : 'text-gray-400'}`}>
              {ADDRESS_SUBFIELD_LABELS[key]}
            </span>
            <label className="flex items-center justify-end cursor-pointer">
              <input
                type="checkbox"
                checked={sub.required}
                disabled={!sub.enabled}
                onChange={(e) => updateSubfield(key, { required: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-40"
              />
            </label>
          </div>
        )
      })}
      <p className="text-xs text-gray-400 pt-2">
        Preenche automaticamente Logradouro, Bairro, Cidade e UF ao digitar o CEP.
      </p>
    </div>
  )
}

