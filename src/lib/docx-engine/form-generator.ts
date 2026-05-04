import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  WidthType,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  type FileChild,
} from 'docx'
import { saveAs } from 'file-saver'
import type {
  AdditionalEvaluator,
  FormField,
  FormFieldAnswer,
  FormResponse,
  Professional,
} from '@/types'
import { formatCouncil } from '@/lib/professional-format'
import { base64ToUint8Array } from './shared/social-icons'

type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType]

interface FormPrintHeader {
  professional: Professional | null
  customerName: string | null
  date: Date
}

interface FormPrintInput {
  formTitle: string
  fields: FormField[]
  selectedFieldIds: Set<string>
  header: FormPrintHeader
  response?: FormResponse | null
  evaluators?: AdditionalEvaluator[]
}

const HEADING_BLUE = '1F4E79'
const SUBTLE_GRAY = '6B7280'
const TEXT_DARK = '111827'
const BORDER_GRAY = 'D1D5DB'

function paragraph(text: string, opts: { bold?: boolean; size?: number; color?: string; alignment?: DocxAlignment; spaceAfter?: number; italic?: boolean } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.alignment ?? AlignmentType.LEFT,
    spacing: { after: opts.spaceAfter ?? 80 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italic,
        size: opts.size ?? 22,
        color: opts.color ?? TEXT_DARK,
      }),
    ],
  })
}

function buildHeaderTable(header: FormPrintHeader): Table {
  const left: Paragraph[] = []
  if (header.professional?.logo) {
    try {
      const data = base64ToUint8Array(header.professional.logo)
      left.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new ImageRun({
              type: 'png',
              data,
              transformation: { width: 90, height: 90 },
            }),
          ],
        }),
      )
    } catch {
      // ignore invalid image
    }
  }

  const profName = header.professional?.name ?? ''
  const council = header.professional ? formatCouncil(header.professional) : ''
  const city = header.professional?.addressCity ?? ''
  const state = header.professional?.addressState ?? ''
  const cityState = [city, state].filter(Boolean).join(' — ')

  if (profName) left.push(paragraph(profName, { bold: true, size: 22, color: TEXT_DARK }))
  if (council) left.push(paragraph(council, { size: 18, color: SUBTLE_GRAY }))
  if (cityState) left.push(paragraph(cityState, { size: 18, color: SUBTLE_GRAY }))

  const right: Paragraph[] = []
  right.push(paragraph(`Data: ${header.date.toLocaleDateString('pt-BR')}`, { size: 18, color: SUBTLE_GRAY, alignment: AlignmentType.RIGHT }))
  if (header.customerName) {
    right.push(paragraph(`Paciente: ${header.customerName}`, { size: 20, bold: true, alignment: AlignmentType.RIGHT }))
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [6000, 4000],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_GRAY },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6000, type: WidthType.DXA },
            children: left.length > 0 ? left : [paragraph('')],
          }),
          new TableCell({
            width: { size: 4000, type: WidthType.DXA },
            children: right.length > 0 ? right : [paragraph('')],
          }),
        ],
      }),
    ],
  })
}

function answerLabel(field: FormField, ans: FormFieldAnswer | undefined): string {
  if (!ans) return '—'
  switch (field.type) {
    case 'short-text':
    case 'long-text':
    case 'date':
      return ans.value || '—'
    case 'yes-no':
      return ans.value ? ans.value.charAt(0).toUpperCase() + ans.value.slice(1) : '—'
    case 'scale':
      return ans.scaleValue !== null && ans.scaleValue !== undefined ? String(ans.scaleValue) : '—'
    case 'single-choice':
    case 'inventory-item': {
      const id = ans.selectedOptionIds[0]
      const opt = field.options.find((o) => o.id === id)
      return opt ? opt.label : '—'
    }
    case 'multiple-choice':
      return (
        ans.selectedOptionIds
          .map((id) => field.options.find((o) => o.id === id)?.label)
          .filter(Boolean)
          .join(', ') || '—'
      )
    default:
      return '—'
  }
}

function blankLines(count: number): Paragraph[] {
  return Array.from({ length: count }).map(
    () =>
      new Paragraph({
        spacing: { after: 40 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_GRAY, space: 4 },
        },
        children: [new TextRun({ text: ' ', size: 22 })],
      }),
  )
}

function buildOriginalFieldContent(field: FormField): Paragraph[] {
  const result: Paragraph[] = []
  switch (field.type) {
    case 'short-text':
    case 'date':
    case 'yes-no':
      result.push(...blankLines(1))
      break
    case 'long-text':
      result.push(...blankLines(4))
      break
    case 'scale':
      result.push(paragraph(`Escala ${field.scaleMin}–${field.scaleMax}: _____`, { size: 20, color: SUBTLE_GRAY }))
      break
    case 'single-choice':
    case 'multiple-choice':
    case 'inventory-item':
      for (const opt of field.options) {
        result.push(paragraph(`☐  ${opt.label || '—'}`, { size: 20 }))
      }
      break
    case 'likert-matrix':
      result.push(paragraph(`Escala: ${field.likertScale.map((p) => p.label).join(' / ')}`, { size: 18, color: SUBTLE_GRAY }))
      for (const row of field.likertRows) {
        result.push(paragraph(`• ${row.label}: _____`, { size: 20 }))
      }
      break
    default:
      result.push(...blankLines(1))
  }
  return result
}

function buildBlankFieldParagraphs(field: FormField): Paragraph[] {
  const result: Paragraph[] = []
  result.push(paragraph(field.label || '(sem título)', { size: 22, bold: true, spaceAfter: 60 }))
  result.push(...buildOriginalFieldContent(field))
  result.push(paragraph('Observação clínica:', { size: 18, color: SUBTLE_GRAY, italic: true, spaceAfter: 40 }))
  result.push(...blankLines(2))
  return result
}

function buildFilledFieldParagraphs(
  field: FormField,
  ans: FormFieldAnswer | undefined,
): Paragraph[] {
  const result: Paragraph[] = []
  result.push(paragraph(field.label || '(sem título)', { size: 22, bold: true, spaceAfter: 60 }))

  const isPresencial = field.collectionMode === 'presencial'
  const profNote = ans?.professional?.note?.trim()

  if (isPresencial) {
    result.push(...buildOriginalFieldContent(field))
    if (profNote) {
      result.push(paragraph(`Observação clínica: ${profNote}`, { size: 20, color: HEADING_BLUE }))
    } else {
      result.push(paragraph('Observação clínica:', { size: 18, color: SUBTLE_GRAY, italic: true, spaceAfter: 40 }))
      result.push(...blankLines(2))
    }
    return result
  }

  result.push(paragraph(`Autorrelato: ${answerLabel(field, ans)}`, { size: 20 }))

  if (profNote) {
    result.push(paragraph(`Observação clínica: ${profNote}`, { size: 20, color: HEADING_BLUE }))
  } else {
    result.push(paragraph('Observação clínica:', { size: 18, color: SUBTLE_GRAY, italic: true, spaceAfter: 40 }))
    result.push(...blankLines(2))
  }

  return result
}

function buildSectionGroups(
  fields: FormField[],
  selectedFieldIds: Set<string>,
): Array<{ header: FormField | null; children: FormField[] }> {
  const groups: Array<{ header: FormField | null; children: FormField[] }> = []
  let current: { header: FormField | null; children: FormField[] } = {
    header: null,
    children: [],
  }
  groups.push(current)

  for (const field of [...fields].sort((a, b) => a.order - b.order)) {
    if (field.type === 'section-header') {
      if (!selectedFieldIds.has(field.id) && current.children.length === 0 && current === groups[0]) {
        // skip leading orphan section if not selected
      }
      current = { header: selectedFieldIds.has(field.id) ? field : null, children: [] }
      if (selectedFieldIds.has(field.id)) groups.push(current)
      continue
    }
    if (selectedFieldIds.has(field.id)) {
      current.children.push(field)
    }
  }

  return groups.filter((g) => g.header || g.children.length > 0)
}

function buildEvaluatorsFooter(evaluators: AdditionalEvaluator[] | undefined): Paragraph[] {
  if (!evaluators || evaluators.length === 0) return []

  const NAME_PLACEHOLDER = '____________________________________________'
  const COUNCIL_PLACEHOLDER = '________________________'

  const result: Paragraph[] = []
  result.push(
    new Paragraph({
      spacing: { before: 360, after: 80 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_GRAY, space: 4 } },
      children: [new TextRun({ text: 'Avaliadores', bold: true, size: 20, color: SUBTLE_GRAY })],
    }),
  )
  for (const ev of evaluators) {
    const name = ev.name.trim() || NAME_PLACEHOLDER
    const council = ev.council.trim() || COUNCIL_PLACEHOLDER
    result.push(paragraph(`${name} — ${council}`, { size: 20, spaceAfter: 160 }))
  }
  return result
}

function buildTotalDurationFooter(response: FormResponse | undefined | null): Paragraph[] {
  if (!response?.pageDurationsMs) return []
  const totalMs = Object.values(response.pageDurationsMs).reduce((acc, v) => acc + v, 0)
  if (totalMs <= 0) return []

  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const fmt =
    minutes > 0
      ? `${minutes}min ${seconds}s`
      : `${seconds}s`
  return [
    new Paragraph({
      spacing: { before: 240 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `Tempo total de preenchimento do paciente: ${fmt}`,
          italics: true,
          size: 18,
          color: SUBTLE_GRAY,
        }),
      ],
    }),
  ]
}

export async function generateFormDocx(input: FormPrintInput): Promise<void> {
  const { formTitle, fields, selectedFieldIds, header, response, evaluators } = input
  const isFilled = !!response

  const children: FileChild[] = []
  children.push(buildHeaderTable(header))
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 240 },
      children: [
        new TextRun({
          text: formTitle || 'Formulário',
          bold: true,
          size: 32,
          color: HEADING_BLUE,
        }),
      ],
    }),
  )

  const groups = buildSectionGroups(fields, selectedFieldIds)
  const answersById = new Map<string, FormFieldAnswer>()
  for (const a of response?.answers ?? []) answersById.set(a.fieldId, a)

  for (const group of groups) {
    if (group.header) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_GRAY, space: 4 } },
          children: [
            new TextRun({
              text: group.header.label || 'Seção',
              bold: true,
              size: 26,
              color: HEADING_BLUE,
            }),
          ],
        }),
      )
    }
    for (const field of group.children) {
      const paragraphs = isFilled
        ? buildFilledFieldParagraphs(field, answersById.get(field.id))
        : buildBlankFieldParagraphs(field)
      children.push(...paragraphs)
      children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun(' ')] }))
    }
  }

  children.push(...buildEvaluatorsFooter(evaluators))
  if (isFilled) children.push(...buildTotalDurationFooter(response))

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 900, bottom: 1000, left: 900 },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const baseName = formTitle.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40) || 'formulario'
  const suffix = isFilled ? '-preenchido' : '-em-branco'
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '').slice(0, 13)
  saveAs(blob, `${baseName}${suffix}-${ts}.docx`)
}
