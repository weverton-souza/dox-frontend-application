import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  ISectionOptions,
  ImageRun,
  PageBreak,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Block } from '@/types'
import {
  Report,
  IdentificationData,
  TextBlockData,
  SectionData,
  ScoreTableData,
  InfoBoxData,
  ChartData,
  ReferencesData,
  ClosingPageData,
  CoverData,
  SlateContent,
  SlateNode,
  isSlateContent,
} from '@/types'
import { Chart as ChartJS } from 'chart.js'
import QRCode from 'qrcode'
import './chart/setup'
import { getProfessional } from '@/lib/api/professional-api'
import { formatDate, buildBlockTree, flattenTree } from '@/lib/utils'
import { base64ToUint8Array } from './shared/social-icons'
import type { ContactType } from '@/types'

function getContactPrefix(type: ContactType): string {
  const prefixes: Record<ContactType, string> = {
    instagram: 'Instagram: ',
    linkedin: 'LinkedIn: ',
    facebook: 'Facebook: ',
    website: 'Site: ',
    phone: 'Telefone: ',
    email: 'E-mail: ',
  }
  return prefixes[type] ?? ''
}
import { getImageDimensions } from './shared/image-utils'
import { computeCellResult } from './table/formula-engine'
import {
  WHITE,
  LIGHT_GRAY,
  PAGE_CONTENT_WIDTH,
  PAGE_MARGIN,
  THIN_BORDER,
  NO_BORDER,
} from './shared/constants'
import type { ThemePalette, PaletteChrome } from '@/types'
import { CLASSICO_PALETTE, getPalette, getPreferredPaletteId, morphHex } from '@/lib/theme'

let _activePalette: ThemePalette = CLASSICO_PALETTE

function chrome(key: keyof PaletteChrome): string {
  return _activePalette.chrome[key].replace('#', '')
}

function morph(hex: string): string {
  return morphHex(hex, _activePalette)
}

// ========== Verification footer (QR Code + code + link) ==========

const QR_CELL_WIDTH = 1500

function getVerifyBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_VERIFY_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

async function buildOfficialFooterTable(report: Report): Promise<Table | null> {
  if (!report.finalizedAt || !report.contentHash) return null

  const verificationCode = report.contentHash.slice(0, 16).toUpperCase()
  const formattedCode = verificationCode.match(/.{1,4}/g)?.join('-') ?? verificationCode
  const verifyUrl = `${getVerifyBaseUrl()}/v/${verificationCode}`

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  })
  const qrBase64 = qrDataUrl.split(',')[1]
  if (!qrBase64) return null
  const qrBytes = base64ToUint8Array(qrBase64)

  const finalizedDate = new Date(report.finalizedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const noBorders = {
    top: NO_BORDER,
    bottom: NO_BORDER,
    left: NO_BORDER,
    right: NO_BORDER,
  }

  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: QR_CELL_WIDTH, type: WidthType.DXA },
            verticalAlign: 'center' as never,
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: [
                  new ImageRun({
                    type: 'png',
                    data: qrBytes,
                    transformation: { width: 70, height: 70 },
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: PAGE_CONTENT_WIDTH - QR_CELL_WIDTH, type: WidthType.DXA },
            verticalAlign: 'center' as never,
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: `Documento finalizado em ${finalizedDate}`,
                    size: 16,
                    font: 'Calibri',
                    color: '4A4A4A',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'Código: ',
                    size: 16,
                    font: 'Calibri',
                    color: '999999',
                  }),
                  new TextRun({
                    text: formattedCode,
                    bold: true,
                    size: 16,
                    font: 'Calibri',
                    color: '333333',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `Verifique em ${verifyUrl}`,
                    italics: true,
                    size: 14,
                    font: 'Calibri',
                    color: 'AAAAAA',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
    width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [QR_CELL_WIDTH, PAGE_CONTENT_WIDTH - QR_CELL_WIDTH],
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
  })
}

function buildFileName(report: Report): string {
  const slug = (report.customerName || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'relatorio'
  const ts = new Date().toISOString().slice(0, 10)
  return `${slug}-${ts}.docx`
}

// ========== Header / Footer ==========

async function createDocHeader(prof: import('@/types').Professional): Promise<Header> {
  const nameParagraph = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 20 },
    children: [
      new TextRun({
        text: prof.name || '',
        bold: true,
        size: 18,
        font: 'Calibri',
        color: chrome('primary'),
      }),
    ],
  })

  const specParagraph = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 0 },
    children: [
      new TextRun({
        text: `${prof.specialization || ''} — CRP ${prof.crp || ''}`,
        size: 16,
        font: 'Calibri',
        color: chrome('secondary'),
      }),
    ],
  })

  const children: (Paragraph | Table)[] = []

  if (prof.logo) {
    // Decode logo
    const logoParts = prof.logo.split(',')
    if (logoParts.length < 2) return new Header({ children: [nameParagraph, specParagraph] })
    const logoBase64 = logoParts[1]
    const logoBytes = base64ToUint8Array(logoBase64)

    // Get real dimensions and compute proportional size
    const dims = await getImageDimensions(prof.logo).catch(() => null)
    if (!dims) return new Header({ children: [nameParagraph, specParagraph] })
    const maxHeight = 50 // px in header
    const logoHeightPx = Math.min(dims.height, maxHeight)
    const logoWidthPx = Math.round(dims.width * (logoHeightPx / dims.height))

    const logoCellWidth = 1800 // ~1.25 inch for logo column
    const textCellWidth = PAGE_CONTENT_WIDTH - logoCellWidth

    const noBorders = {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
    }

    const headerTable = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: logoCellWidth, type: WidthType.DXA },
              verticalAlign: 'center' as never,
              borders: noBorders,
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      type: 'png',
                      data: logoBytes,
                      transformation: { width: logoWidthPx, height: logoHeightPx },
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: textCellWidth, type: WidthType.DXA },
              verticalAlign: 'center' as never,
              borders: noBorders,
              children: [nameParagraph, specParagraph],
            }),
          ],
        }),
      ],
      width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [logoCellWidth, textCellWidth],
      borders: {
        top: NO_BORDER,
        bottom: NO_BORDER,
        left: NO_BORDER,
        right: NO_BORDER,
        insideHorizontal: NO_BORDER,
        insideVertical: NO_BORDER,
      },
    })

    children.push(headerTable)
  } else {
    children.push(nameParagraph, specParagraph)
  }

  return new Header({ children })
}

async function createDocFooter(prof: import('@/types').Professional, report: Report): Promise<Footer> {
  const contactItems = prof.contactItems ?? []

  const children: (Paragraph | Table)[] = []

  // Contact info — one line per item, left-aligned, sorted by string length
  if (contactItems.length > 0) {
    const sortedItems = [...contactItems].sort((a, b) => {
      const lenA = (getContactPrefix(a.type) + a.value).length
      const lenB = (getContactPrefix(b.type) + b.value).length
      return lenA - lenB
    })
    sortedItems.forEach((item) => {
      const prefix = getContactPrefix(item.type)

      children.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          ...(prefix ? [new TextRun({
            text: prefix,
            size: 16,
            font: 'Calibri',
            color: '999999',
          })] : []),
          new TextRun({
            text: item.value,
            size: 16,
            font: 'Calibri',
            color: '666666',
          }),
        ],
      }))
    })
  }

  // Page number
  children.push(
    new Paragraph({
      style: 'FooterPageNum',
      spacing: { before: 60 },
      children: [
        new TextRun({
          text: 'Página ',
          size: 16,
          font: 'Calibri',
          color: 'AAAAAA',
        }),
        new TextRun({
          children: [PageNumber.CURRENT],
          size: 16,
          font: 'Calibri',
          color: 'AAAAAA',
        }),
        new TextRun({
          text: ' de ',
          size: 16,
          font: 'Calibri',
          color: 'AAAAAA',
        }),
        new TextRun({
          children: [PageNumber.TOTAL_PAGES],
          size: 16,
          font: 'Calibri',
          color: 'AAAAAA',
        }),
      ],
    })
  )

  const officialBlock = await buildOfficialFooterTable(report)
  if (officialBlock) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 0 },
        border: {
          top: { color: 'E0E0E0', space: 4, style: BorderStyle.SINGLE, size: 4 },
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
        },
        children: [],
      }),
    )
    children.push(officialBlock)
  }

  return new Footer({ children })
}

// ========== Block renderers ==========

function renderIdentification(data: IdentificationData): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []

  // Section: Profissional Responsavel
  elements.push(createSectionHeader('PROFISSIONAL RESPONSÁVEL'))

  const profRows = [
    ['Nome', data.professional.name],
    ['CRP', data.professional.crp],
    ['Especialização', data.professional.specialization],
  ]

  elements.push(createKeyValueTable(profRows))

  // Section: Solicitante (if present)
  if (data.solicitor && data.solicitor.name) {
    elements.push(createSectionHeader('SOLICITANTE'))
    const solicitorRows = [
      ['Nome', data.solicitor.name],
      ...(data.solicitor.crm ? [['CRM', data.solicitor.crm]] : []),
      ...(data.solicitor.rqe ? [['RQE', data.solicitor.rqe]] : []),
      ...(data.solicitor.specialty ? [['Especialidade', data.solicitor.specialty]] : []),
    ]
    elements.push(createKeyValueTable(solicitorRows))
  }

  // Section: Dados do Paciente
  elements.push(createSectionHeader('DADOS DO PACIENTE'))
  const guardianLabel = data.customer.guardianRelationship
    ? `Responsável Legal (${data.customer.guardianRelationship})`
    : 'Responsável Legal'

  const customerRows = [
    ['Nome', data.customer.name],
    ['CPF', data.customer.cpf],
    ['Data de Nascimento', formatDate(data.customer.birthDate)],
    ['Idade', data.customer.age],
    ['Escolaridade', data.customer.education],
    ['Profissão', data.customer.profession],
    ['Filiação (Mãe)', data.customer.motherName],
    ['Filiação (Pai)', data.customer.fatherName],
    [guardianLabel, data.customer.guardianName ?? ''],
  ].filter(([, val]) => val)

  elements.push(createKeyValueTable(customerRows))

  // Data e local
  elements.push(createSectionHeader('DADOS DO RELATÓRIO'))
  const reportRows = [
    ['Data', formatDate(data.date)],
    ['Local', data.location],
  ].filter(([, val]) => val)
  elements.push(createKeyValueTable(reportRows))

  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  )

  return elements
}

/**
 * Parse HTML content (from TipTap editor) into docx Paragraphs.
 * Falls back to plain-text splitting for backward compatibility with old reports.
 */
function parseHtmlToDocxParagraphs(html: string): Paragraph[] {
  // Fallback: if content has no HTML tags, treat as plain text (backward compat)
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    const lines = html.split('\n').filter((line) => line.trim() !== '')
    return lines.map(
      (line) =>
        new Paragraph({
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: line, size: 22, font: 'Calibri' })],
        })
    )
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraphs: Paragraph[] = []

  for (const node of Array.from(doc.body.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const runs = extractRunsFromNode(el)
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED,
            children: runs,
          })
        )
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: node.textContent, size: 22, font: 'Calibri' })],
        })
      )
    }
  }

  return paragraphs
}

/** Recursively extract TextRun objects from an HTML element, preserving bold/italic. */
function extractRunsFromNode(
  node: Node,
  inherited: { bold?: boolean; italics?: boolean } = {}
): TextRun[] {
  const runs: TextRun[] = []

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (text) {
        runs.push(
          new TextRun({
            text,
            size: 22,
            font: 'Calibri',
            bold: inherited.bold,
            italics: inherited.italics,
          })
        )
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
      const style = {
        bold: inherited.bold || tag === 'strong' || tag === 'b',
        italics: inherited.italics || tag === 'em' || tag === 'i',
      }
      runs.push(...extractRunsFromNode(el, style))
    }
  }

  return runs
}

// ========== Slate JSON → docx ==========

const ALIGNMENT_MAP: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

function slateLeafToTextRun(
  node: SlateNode,
): TextRun {
  return new TextRun({
    text: node.text ?? '',
    size: 22,
    font: 'Calibri',
    bold: node.bold || undefined,
    italics: node.italic || undefined,
    underline: node.underline ? {} : undefined,
    strike: node.strikethrough || undefined,
  })
}

function parseSlateToFootnoteParagraphs(content: SlateContent): Paragraph[] {
  const paragraphs: Paragraph[] = []
  for (const node of content) {
    if (node.type === 'p' && Array.isArray(node.children)) {
      const runs: TextRun[] = node.children
        .filter((c): c is SlateNode & { text: string } => typeof c.text === 'string')
        .map(c => new TextRun({
          text: c.text,
          size: 18,
          font: 'Calibri',
          color: '666666',
          italics: true,
          bold: c.bold || undefined,
          underline: c.underline ? {} : undefined,
        }))
      paragraphs.push(new Paragraph({
        spacing: { after: 10 },
        indent: { left: 0, right: 0 },
        children: runs.length > 0 ? runs : [new TextRun({ text: '', size: 18, font: 'Calibri' })],
      }))
    }
  }
  return paragraphs
}

function parseSlateToDocxParagraphs(content: SlateContent): Paragraph[] {
  const paragraphs: Paragraph[] = []

  for (const node of content) {
    if (node.type === 'p' && Array.isArray(node.children)) {
      const alignment = ALIGNMENT_MAP[node.align as string] ?? AlignmentType.JUSTIFIED
      const runs: TextRun[] = []

      for (const child of node.children) {
        if (typeof child.text === 'string') {
          runs.push(slateLeafToTextRun(child))
        }
      }

      // Lista com indentação
      const indent = typeof node.indent === 'number' ? node.indent : 0
      const listStyleType = node.listStyleType as string | undefined

      if (listStyleType === 'disc') {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 80 },
            alignment,
            bullet: { level: Math.max(0, indent - 1) },
            children: runs.length > 0 ? runs : [new TextRun({ text: '', size: 22, font: 'Calibri' })],
          })
        )
      } else if (listStyleType === 'decimal') {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 80 },
            alignment,
            numbering: { reference: 'default-numbering', level: Math.max(0, indent - 1) },
            children: runs.length > 0 ? runs : [new TextRun({ text: '', size: 22, font: 'Calibri' })],
          })
        )
      } else {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 120 },
            alignment,
            indent: indent > 0 ? { left: indent * 720 } : undefined,
            children: runs.length > 0 ? runs : [new TextRun({ text: '', size: 22, font: 'Calibri' })],
          })
        )
      }
    }
  }

  return paragraphs
}

/** Converte conteúdo (HTML legado ou Slate JSON) para docx paragraphs */
function contentToDocxParagraphs(content: string | SlateContent): Paragraph[] {
  if (isSlateContent(content)) return parseSlateToDocxParagraphs(content)
  return parseHtmlToDocxParagraphs(content)
}

function renderSection(data: SectionData, depth: number): Paragraph[] {
  const elements: Paragraph[] = []
  if (data.title) {
    if (depth === 0) {
      elements.push(createSectionHeader(data.title))
    } else if (depth === 1) {
      elements.push(createSubsectionHeader(data.title))
    } else if (depth === 2) {
      elements.push(createTertiarySectionHeader(data.title))
    } else {
      elements.push(createDeepSectionHeader(data.title, depth))
    }
  }
  return elements
}

function renderText(data: TextBlockData): Paragraph[] {
  const elements: Paragraph[] = []

  if (data.content && (typeof data.content === 'string' ? data.content.trim() : true)) {
    const contentParagraphs = contentToDocxParagraphs(data.content)
    elements.push(...contentParagraphs)
  }

  if (data.useLabeledItems && data.labeledItems.length > 0) {
    for (const item of data.labeledItems) {
      elements.push(
        new Paragraph({
          spacing: { after: 80 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `${item.label}: `,
              bold: true,
              size: 22,
              font: 'Calibri',
              color: '333333',
            }),
            new TextRun({
              text: item.text,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      )
    }
  }

  return elements
}

function renderScoreTable(data: ScoreTableData): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []

  if (data.title) {
    elements.push(createDataCaption(data.title))
  }

  if (data.columns.length === 0 || data.rows.length === 0) {
    return elements
  }

  // Balanced column widths — wider for text-heavy columns, narrower for numeric
  const colWeights = data.columns.map((col) => {
    let maxLen = col.label.length + 2
    const hasFormula = !!col.formula
    for (const row of data.rows) {
      const val = row.values[col.id] ?? ''
      if (val.startsWith('=')) {
        maxLen = Math.max(maxLen, 28)
      } else {
        maxLen = Math.max(maxLen, val.length)
      }
    }
    if (hasFormula) maxLen = Math.max(maxLen, 28)
    return Math.max(10, Math.min(50, maxLen))
  })
  const totalWeight = colWeights.reduce((s, w) => s + w, 0)
  const balancedWidths = colWeights.map((w) => Math.floor((w / totalWeight) * PAGE_CONTENT_WIDTH))

  // Header row
  const getDocxAlignment = (col: { alignment?: 'left' | 'center' | 'right' }) => {
    const a = col.alignment ?? 'center'
    return a === 'left' ? AlignmentType.LEFT : a === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER
  }

  const cellMargins = { top: 30, bottom: 30, left: 80, right: 10 }

  const headerCells = data.columns.map(
    (col, idx) =>
      new TableCell({
        width: { size: balancedWidths[idx], type: WidthType.DXA },
        margins: cellMargins,
        shading: { fill: chrome('primary'), type: ShadingType.CLEAR, color: 'auto' },
        borders: {
          top: THIN_BORDER,
          bottom: THIN_BORDER,
          left: THIN_BORDER,
          right: THIN_BORDER,
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: col.label || 'Sem nome',
                bold: true,
                size: 18,
                font: 'Calibri',
                color: WHITE,
              }),
            ],
          }),
        ],
      })
  )

  const headerRow = new TableRow({ children: headerCells, tableHeader: true })

  // Data rows
  const dataRows = data.rows.map((row, index) => {
    const defaultBgColor = index % 2 === 0 ? WHITE : LIGHT_GRAY
    const cells = data.columns.map((col, idx) => {
      const result = computeCellResult(data, row.id, col.id)
      const dotColor = result.bgColor ? morph(result.bgColor).replace('#', '') : null
      return new TableCell({
        width: { size: balancedWidths[idx], type: WidthType.DXA },
        margins: cellMargins,
        shading: { fill: defaultBgColor, type: ShadingType.CLEAR, color: 'auto' },
        borders: {
          top: THIN_BORDER,
          bottom: THIN_BORDER,
          left: THIN_BORDER,
          right: THIN_BORDER,
        },
        children: [
          new Paragraph({
            alignment: getDocxAlignment(col),
            spacing: { before: 20, after: 20 },
            children: dotColor
              ? [
                  new TextRun({ text: '● ', size: 20, font: 'Calibri', color: dotColor }),
                  new TextRun({ text: result.text.replace(/^●\s*/, ''), size: 20, font: 'Calibri' }),
                ]
              : [new TextRun({ text: result.text, size: 20, font: 'Calibri' })],
          }),
        ],
      })
    })
    return new TableRow({ children: cells })
  })

  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: balancedWidths,
    borders: {
      top: THIN_BORDER,
      bottom: THIN_BORDER,
      left: THIN_BORDER,
      right: THIN_BORDER,
      insideHorizontal: THIN_BORDER,
      insideVertical: THIN_BORDER,
    },
  })

  elements.push(table)

  if (data.footnote) {
    if (isSlateContent(data.footnote)) {
      for (const p of parseSlateToFootnoteParagraphs(data.footnote)) {
        elements.push(p)
      }
    } else if (typeof data.footnote === 'string' && data.footnote.trim()) {
      const footnoteRuns = data.footnote.split('\n').flatMap((line, i) => {
        const run = new TextRun({
          text: line,
          italics: true,
          size: 18,
          font: 'Calibri',
          color: '666666',
          ...(i > 0 ? { break: 1 } : {}),
        })
        return [run]
      })
      elements.push(
        new Paragraph({
          spacing: { before: 60, after: 200 },
          children: footnoteRuns,
        })
      )
    }
  }

  return elements
}

function renderSkippedWarning(block: Block): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []

  const title = block.type === 'section'
    ? (block.data as SectionData).title
    : (block.data as InfoBoxData).label
  const content = (block.data as { content?: TextBlockData['content'] }).content

  if (title) {
    elements.push(createSectionHeader(title))
  }

  const hasContent = content && (typeof content === 'string' ? content.trim() : true)
  const contentParagraphs = hasContent
    ? contentToDocxParagraphs(content as TextBlockData['content'])
    : [new Paragraph({ children: [new TextRun({ text: 'Dados insuficientes para gerar esta seção.', size: 22, font: 'Calibri' })] })]

  const AMBER_BG = 'FFF8E1'
  const AMBER_BORDER = 'F59E0B'
  const AMBER_LABEL = '92400E'

  elements.push(
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
              shading: { fill: AMBER_BG, type: ShadingType.CLEAR, color: 'auto' },
              borders: {
                top: NO_BORDER,
                bottom: NO_BORDER,
                right: NO_BORDER,
                left: { color: AMBER_BORDER, space: 0, style: BorderStyle.SINGLE, size: 24 },
              },
              children: [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: '⚠ Seção não gerada', bold: true, size: 22, font: 'Calibri', color: AMBER_LABEL }),
                  ],
                }),
                ...contentParagraphs,
              ],
              margins: {
                top: convertInchesToTwip(0.1),
                bottom: convertInchesToTwip(0.1),
                left: convertInchesToTwip(0.15),
                right: convertInchesToTwip(0.15),
              },
            }),
          ],
        }),
      ],
      width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [PAGE_CONTENT_WIDTH],
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER },
    })
  )

  return elements
}

function renderInfoBox(data: InfoBoxData, amber = false): (Paragraph | Table)[] {
  if (!data.label && !data.content) return []

  const fillColor = amber ? 'FFF8E1' : chrome('surface')
  const borderColor = amber ? 'F59E0B' : chrome('secondary')
  const labelColor = amber ? '92400E' : chrome('primary')

  const elements: (Paragraph | Table)[] = []

  const cellChildren: Paragraph[] = []

  if (data.label) {
    cellChildren.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: data.label,
            bold: true,
            size: 22,
            font: 'Calibri',
            color: labelColor,
          }),
        ],
      })
    )
  }

  if (data.content) {
    if (isSlateContent(data.content)) {
      cellChildren.push(...parseSlateToDocxParagraphs(data.content))
    } else {
      const paragraphs = data.content.split('\n').filter((l: string) => l.trim())
      for (const para of paragraphs) {
        cellChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: para,
                size: 22,
                font: 'Calibri',
              }),
            ],
          })
        )
      }
    }
  }

  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: fillColor, type: ShadingType.CLEAR, color: 'auto' },
            borders: {
              top: NO_BORDER,
              bottom: NO_BORDER,
              right: NO_BORDER,
              left: {
                color: borderColor,
                space: 0,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            children: cellChildren,
            margins: {
              top: convertInchesToTwip(0.1),
              bottom: convertInchesToTwip(0.1),
              left: convertInchesToTwip(0.15),
              right: convertInchesToTwip(0.15),
            },
          }),
        ],
      }),
    ],
    width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [PAGE_CONTENT_WIDTH],
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
  })

  elements.push(new Paragraph({ spacing: { before: 200 }, children: [] }))
  elements.push(table)
  elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }))

  return elements
}

interface GroupBound { seriesIdx: number; start: number; end: number }

function buildChartDatasets(data: ChartData): {
  chartLabels: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartDatasets: any[]
  groupBounds: GroupBound[]
} {
  const displayMode = data.displayMode ?? 'grouped'
  const isSeparated = displayMode === 'separated' && data.chartType !== 'line' && data.series.length > 1
  const groupBounds: GroupBound[] = []

  if (isSeparated) {
    const flatLabels: string[] = []
    const flatValues: (number | null)[] = []
    const flatBgColors: string[] = []
    const flatBorderColors: string[] = []

    data.series.forEach((series, sIdx) => {
      const groupStart = flatLabels.length

      data.categories.forEach((cat) => {
        const val = cat.values[series.id] ?? 0
        if (val !== 0) {
          flatLabels.push(cat.label || '')
          flatValues.push(val)
          flatBgColors.push(series.color)
          flatBorderColors.push(series.color)
        }
      })

      const groupEnd = flatLabels.length - 1
      if (groupStart <= groupEnd) {
        groupBounds.push({ seriesIdx: sIdx, start: groupStart, end: groupEnd })
      }

      if (sIdx < data.series.length - 1 && groupStart <= groupEnd) {
        flatLabels.push('')
        flatValues.push(null)
        flatBgColors.push('transparent')
        flatBorderColors.push('transparent')
      }
    })

    return {
      chartLabels: flatLabels,
      chartDatasets: [{
        data: flatValues,
        backgroundColor: flatBgColors,
        borderColor: flatBorderColors,
        borderWidth: 1,
        borderRadius: 3,
      }],
      groupBounds,
    }
  }

  const chartLabels = data.categories.map((c) => c.label || '')
  const chartDatasets = data.series.map((series) => {
    const values = data.categories.map((cat) => cat.values[series.id] ?? 0)

    if (data.chartType === 'line') {
      return {
        label: series.label,
        data: values,
        borderColor: series.color,
        backgroundColor: series.color + '33',
        fill: false,
        tension: 0.3,
        pointRadius: 5,
      }
    }

    return {
      label: series.label,
      data: values,
      backgroundColor: series.color,
      borderColor: series.color,
      borderWidth: 1,
      borderRadius: 3,
    }
  })

  return { chartLabels, chartDatasets, groupBounds }
}

function buildChartAnnotations(
  data: ChartData,
  groupBounds: GroupBound[],
  isSeparated: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const annotations: Record<string, any> = {}

  data.referenceLines.forEach((line) => {
    annotations[line.id] = {
      type: 'line',
      yMin: line.value,
      yMax: line.value,
      borderColor: line.color,
      borderWidth: 2,
      borderDash: [6, 4],
      label: {
        display: true,
        content: line.label,
        position: 'end',
        backgroundColor: line.color,
        color: '#fff',
        font: { size: 12 },
      },
    }
  })

  data.referenceRegions.forEach((region) => {
    annotations[region.id] = {
      type: 'box',
      drawTime: 'beforeDatasetsDraw',
      yMin: region.yMin,
      yMax: region.yMax,
      backgroundColor: region.color,
      borderWidth: 0,
    }
  })

  if (isSeparated) {
    groupBounds.forEach((group, i) => {
      if (i < groupBounds.length - 1) {
        const nextGroup = groupBounds[i + 1]
        const separatorX = (group.end + nextGroup.start) / 2
        annotations[`separator-${i}`] = {
          type: 'line',
          xMin: separatorX,
          xMax: separatorX,
          borderColor: '#ccc',
          borderWidth: 1,
          borderDash: [4, 4],
        }
      }
    })
  }

  return annotations
}

function createRegionLegendPlugin(data: ChartData, showRegionLegend: boolean) {
  return {
    id: 'regionLegend',
    afterDraw: (chart: ChartJS) => {
      if (!showRegionLegend || data.referenceRegions.length === 0) return

      const c = chart.ctx
      const chartArea = chart.chartArea
      const padding = 10
      const lineHeight = 22
      const boxSize = 14
      const fontSize = 13

      c.save()
      c.font = `${fontSize}px Calibri, sans-serif`

      const entries = data.referenceRegions.map((r) => ({
        text: `${r.label} ${r.yMin} \u2013 ${r.yMax}`,
        color: r.color,
        borderColor: r.borderColor,
      }))

      const maxTextWidth = Math.max(
        ...entries.map((e) => c.measureText(e.text).width)
      )
      const legendWidth = padding * 2 + boxSize + 8 + maxTextWidth
      const legendHeight = padding * 2 + entries.length * lineHeight - 4

      const x = chartArea.right - legendWidth - 10
      const y = chartArea.top + 10

      c.fillStyle = 'rgba(255, 255, 255, 0.92)'
      c.fillRect(x, y, legendWidth, legendHeight)
      c.strokeStyle = '#ccc'
      c.lineWidth = 1
      c.strokeRect(x, y, legendWidth, legendHeight)

      entries.forEach((entry, i) => {
        const ey = y + padding + i * lineHeight

        c.fillStyle = entry.color
        c.fillRect(x + padding, ey, boxSize, boxSize)

        c.fillStyle = '#333'
        c.font = `${fontSize}px Calibri, sans-serif`
        c.textBaseline = 'middle'
        c.fillText(entry.text, x + padding + boxSize + 8, ey + boxSize / 2)
      })

      c.restore()
    },
  }
}

function createSeriesHeaderPlugin(data: ChartData, groupBounds: GroupBound[], isSeparated: boolean) {
  return {
    id: 'seriesHeaders',
    afterDraw: (chart: ChartJS) => {
      if (!isSeparated || groupBounds.length === 0) return

      const c = chart.ctx
      const chartArea = chart.chartArea
      const xScale = chart.scales.x

      c.save()
      groupBounds.forEach((group) => {
        const series = data.series[group.seriesIdx]
        const startX = xScale.getPixelForValue(group.start)
        const endX = xScale.getPixelForValue(group.end)
        const centerX = (startX + endX) / 2

        c.textAlign = 'center'
        c.textBaseline = 'bottom'
        c.font = 'bold 14px Calibri, sans-serif'
        c.fillStyle = series.color
        c.fillText(series.label, centerX, chartArea.top - 6)
      })
      c.restore()
    },
  }
}

function chartCanvasToImageBytes(canvas: HTMLCanvasElement): Uint8Array | null {
  const dataUrl = canvas.toDataURL('image/png')
  const chartParts = dataUrl.split(',')
  if (chartParts.length < 2) {
    return null
  }
  const base64 = chartParts[1]
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function morphChartColors(data: ChartData): ChartData {
  return {
    ...data,
    series: data.series.map((s) => ({ ...s, color: morph(s.color) })),
    referenceLines: data.referenceLines.map((l) => ({ ...l, color: morph(l.color) })),
    referenceRegions: data.referenceRegions.map((r) => ({
      ...r,
      color: morph(r.color),
      borderColor: morph(r.borderColor),
    })),
  }
}

async function renderChart(rawData: ChartData): Promise<(Paragraph | Table)[]> {
  const data = morphChartColors(rawData)
  const elements: (Paragraph | Table)[] = []

  if (data.title) {
    elements.push(createDataCaption(data.title))
  }

  if (data.categories.length === 0 || data.series.length === 0) {
    return elements
  }

  // Create offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 600
  const ctx = canvas.getContext('2d')
  if (!ctx) return elements

  const displayMode = data.displayMode ?? 'grouped'
  const isSeparated = displayMode === 'separated' && data.chartType !== 'line' && data.series.length > 1

  const { chartLabels, chartDatasets, groupBounds } = buildChartDatasets(data)
  const annotations = buildChartAnnotations(data, groupBounds, isSeparated)

  const chartType = data.chartType === 'line' ? 'line' : 'bar'

  // Compute Y-axis suggestedMax
  const allValues = data.categories.flatMap((cat) =>
    data.series.map((s) => cat.values[s.id] ?? 0)
  )
  const refLineValues = data.referenceLines.map((l) => l.value)
  const refRegionValues = data.referenceRegions.map((r) => r.yMax)
  const maxDataValue = Math.max(0, ...allValues, ...refLineValues, ...refRegionValues)
  const suggestedMax = maxDataValue + 10

  const showRegionLegend = data.showRegionLegend ?? true
  const regionLegendPlugin = createRegionLegendPlugin(data, showRegionLegend)
  const seriesHeaderPlugin = createSeriesHeaderPlugin(data, groupBounds, isSeparated)

  const chart = new ChartJS(ctx, {
    type: chartType,
    data: { labels: chartLabels, datasets: chartDatasets },
    plugins: [regionLegendPlugin, seriesHeaderPlugin],
    options: {
      responsive: false,
      animation: false,
      layout: {
        padding: {
          top: isSeparated ? 28 : 0,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax,
          title: {
            display: !!data.yAxisLabel,
            text: data.yAxisLabel,
            font: { size: 14 },
          },
          ticks: { font: { size: 12 } },
        },
        x: {
          ticks: { font: { size: 12 } },
        },
      },
      plugins: {
        legend: { display: isSeparated ? false : data.showLegend, labels: { font: { size: 12 } } },
        annotation: { annotations },
        datalabels: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          display: (context: any) =>
            data.showValues && context.dataset.data[context.dataIndex] != null,
          anchor: 'end',
          align: 'top',
          font: { size: 12, weight: 'bold' },
          color: '#333',
        },
      },
    },
  })

  // Wait for render
  chart.update()

  // Export as PNG
  const bytes = chartCanvasToImageBytes(canvas)
  if (!bytes) {
    chart.destroy()
    return elements
  }

  chart.destroy()

  // ImageRun transformation uses pixels (internally multiplied by 9525 EMU/pixel)
  // Page content width in pixels at 96dpi: 9026 twips / 15 twips_per_pixel ≈ 601px
  // Canvas is 1200x600 (2:1), scale to page width
  const imgWidthPx = Math.round(PAGE_CONTENT_WIDTH / 15)
  const imgHeightPx = Math.round(imgWidthPx / 2) // 2:1 ratio

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new ImageRun({
          type: 'png',
          data: bytes,
          transformation: {
            width: imgWidthPx,
            height: imgHeightPx,
          },
        }),
      ],
    })
  )

  // Description / note below the chart
  if (data.description) {
    if (isSlateContent(data.description)) {
      for (const p of parseSlateToFootnoteParagraphs(data.description)) {
        elements.push(p)
      }
    } else if (typeof data.description === 'string' && data.description.trim()) {
      const paragraphs = data.description.split('\n').filter((line) => line.trim() !== '')
      for (const para of paragraphs) {
        elements.push(
          new Paragraph({
            spacing: { after: 100 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: para,
                italics: true,
                size: 21,
                font: 'Calibri',
                color: '444444',
              }),
            ],
          })
        )
      }
    }
  }

  return elements
}

// ========== References (ABNT) ==========

function renderReferences(data: ReferencesData): Paragraph[] {
  const elements: Paragraph[] = []

  const useHangingIndent = data.hangingIndent !== false
  const abntIndent = useHangingIndent ? { left: 720, hanging: 720 } : undefined
  const refs = data.references

  if (Array.isArray(refs) && refs.length > 0 && typeof refs[0] === 'object' && refs[0] !== null && 'type' in refs[0]) {
    for (const node of refs as SlateContent) {
      if (node.type === 'p' && Array.isArray(node.children)) {
        const hasText = node.children.some(child => typeof child.text === 'string' && child.text.trim())
        if (!hasText) continue
        const runs: TextRun[] = []
        for (const child of node.children) {
          if (typeof child.text === 'string') {
            runs.push(slateLeafToTextRun(child))
          }
        }
        elements.push(
          new Paragraph({
            spacing: { after: 120 },
            alignment: AlignmentType.LEFT,
            indent: abntIndent,
            children: runs,
          })
        )
      }
    }
  } else if (Array.isArray(refs)) {
    for (const ref of refs) {
      if (typeof ref !== 'string' || !ref.trim()) continue
      elements.push(
        new Paragraph({
          spacing: { after: 120 },
          alignment: AlignmentType.LEFT,
          indent: abntIndent,
          children: [
            new TextRun({ text: ref, size: 22, font: 'Calibri' }),
          ],
        })
      )
    }
  }

  return elements
}

// ========== Cover ==========

function renderCover(data: CoverData, report: Report, prof: import('@/types').Professional): Paragraph[] {
  const elements: Paragraph[] = []

  elements.push(new Paragraph({ spacing: { before: 3200 }, children: [] }))

  const titleText = (data.customTitle?.trim() || 'RELATÓRIO PSICOLÓGICO').toUpperCase()
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: titleText,
          bold: true,
          size: 48,
          font: 'Calibri',
          color: chrome('primary'),
          characterSpacing: 40,
        }),
      ],
    })
  )

  const idData = report.blocks?.find((b) => b.type === 'identification')?.data as IdentificationData | undefined
  const customerName = report.customerName || idData?.customer?.name
  const subtitleText = data.customSubtitle?.trim() || customerName

  if (subtitleText) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: subtitleText,
            italics: true,
            size: 28,
            font: 'Calibri',
            color: '4A4A4A',
          }),
        ],
      })
    )
  }

  elements.push(new Paragraph({ spacing: { before: 4800 }, children: [] }))

  elements.push(
    new Paragraph({
      spacing: { before: 0, after: 120 },
      border: {
        bottom: { color: chrome('border'), space: 6, style: BorderStyle.SINGLE, size: 4 },
      },
      children: [],
    })
  )

  const metaLines: string[] = []
  if (prof.name) metaLines.push(prof.name)
  if (prof.specialization && prof.crp) {
    metaLines.push(`${prof.specialization} · CRP ${prof.crp}`)
  }
  if (idData?.location) metaLines.push(idData.location)
  if (idData?.date) metaLines.push(formatDate(idData.date))

  for (const line of metaLines) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: line,
            size: 20,
            font: 'Calibri',
            color: '707070',
          }),
        ],
      })
    )
  }

  elements.push(new Paragraph({ children: [new PageBreak()] }))

  return elements
}

// ========== Closing Page ==========

async function renderClosingPage(data: ClosingPageData, report: Report, prof: import('@/types').Professional): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = []

  // Find identification block for customer info
  const idBlock = report.blocks.find((b) => b.type === 'identification')
  const idData = idBlock?.data as IdentificationData | undefined

  // Backward compatibility: old reports may have showSignatureLines instead of individual toggles
  const showPatient = data.showPatientSignature ?? data.showSignatureLines ?? true
  const showMother = data.showMotherSignature ?? false
  const showFather = data.showFatherSignature ?? false
  const showGuardian = data.showGuardianSignature ?? false

  if (data.title) {
    elements.push(new Paragraph({ children: [new PageBreak()] }))
    elements.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 300, after: 150 },
        border: {
          top: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          bottom: { color: chrome('secondary'), space: 4, style: BorderStyle.SINGLE, size: 6 },
        },
        children: [
          new TextRun({
            text: data.title,
            bold: true,
            size: 24,
            font: 'Calibri',
            color: chrome('primary'),
          }),
        ],
      })
    )
  }

  // Body text
  if (data.bodyText) {
    const paragraphs = data.bodyText.split('\n').filter((line) => line.trim() !== '')
    for (const para of paragraphs) {
      elements.push(
        new Paragraph({
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: para,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      )
    }
  }

  // ---- City and date line ----
  const location = idData?.location || '____________________'
  elements.push(new Paragraph({ spacing: { before: 600, after: 200 }, children: [] }))
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `${location}, _____ de _______________ de ________`,
          size: 22,
          font: 'Calibri',
        }),
      ],
    })
  )

  // ---- Collect signature entries ----
  type SigEntry = { name: string; subtitle: string; isBold?: boolean; subtitleColor?: string }
  const signatures: SigEntry[] = []

  // Professional (always)
  signatures.push({
    name: prof.name || '____________________',
    subtitle: `CRP ${prof.crp || '__________'}`,
    isBold: true,
    subtitleColor: chrome('secondary'),
  })

  if (showPatient) {
    signatures.push({
      name: idData?.customer?.name || 'Paciente',
      subtitle: 'Paciente',
    })
  }
  if (showMother) {
    signatures.push({
      name: idData?.customer?.motherName || 'Mãe',
      subtitle: 'Mãe',
    })
  }
  if (showFather) {
    signatures.push({
      name: idData?.customer?.fatherName || 'Pai',
      subtitle: 'Pai',
    })
  }
  if (showGuardian) {
    const guardianRel = idData?.customer?.guardianRelationship
    signatures.push({
      name: idData?.customer?.guardianName || 'Responsável Legal',
      subtitle: guardianRel ? `Responsável Legal (${guardianRel})` : 'Responsável Legal',
    })
  }

  // ---- Render signatures in 2-column table ----
  const noBorders = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }
  const colWidth = Math.floor(PAGE_CONTENT_WIDTH / 2)

  function makeSignatureCell(sig?: SigEntry): TableCell {
    if (!sig) {
      return new TableCell({
        borders: noBorders,
        children: [new Paragraph({ children: [] })],
      })
    }
    return new TableCell({
      borders: noBorders,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: '________________________________',
              size: 22,
              font: 'Calibri',
              color: '999999',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: sig.name,
              bold: sig.isBold ?? false,
              size: 22,
              font: 'Calibri',
              color: sig.isBold ? chrome('primary') : '333333',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: sig.subtitle,
              size: 18,
              font: 'Calibri',
              color: sig.subtitleColor ?? '999999',
            }),
          ],
        }),
      ],
    })
  }

  // Build rows, 2 signatures per row
  const sigRows: TableRow[] = []
  for (let i = 0; i < signatures.length; i += 2) {
    sigRows.push(
      new TableRow({
        children: [
          makeSignatureCell(signatures[i]),
          makeSignatureCell(signatures[i + 1]),
        ],
      })
    )
  }

  elements.push(
    new Table({
      rows: sigRows,
      width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [colWidth, colWidth],
      borders: {
        top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
        insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
      },
    })
  )

  // ---- Footer note ----
  const footerNote = data.footerNote ?? ''
  if (footerNote.trim()) {
    elements.push(new Paragraph({ spacing: { before: 200 }, children: [] }))
    const noteParagraphs = footerNote.split('\n').filter((l) => l.trim() !== '')
    for (const para of noteParagraphs) {
      elements.push(
        new Paragraph({
          spacing: { after: 100 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: para,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      )
    }
  }

  return elements
}

// ========== Helpers ==========

function createDataCaption(text: string): Paragraph {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 100 },
    border: {
      top: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      bottom: { color: chrome('secondary'), space: 2, style: BorderStyle.SINGLE, size: 2 },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        italics: true,
        size: 20,
        font: 'Calibri',
        color: chrome('secondary'),
      }),
    ],
  })
}

function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 480, after: 180 },
    border: {
      top: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      bottom: { color: chrome('secondary'), space: 6, style: BorderStyle.SINGLE, size: 12 },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        font: 'Calibri',
        color: chrome('primary'),
      }),
    ],
  })
}

function createSubsectionHeader(text: string): Paragraph {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 320, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        font: 'Calibri',
        color: chrome('primary'),
      }),
    ],
  })
}

function createTertiarySectionHeader(text: string): Paragraph {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        italics: true,
        size: 20,
        font: 'Calibri',
        color: chrome('primary'),
      }),
    ],
  })
}

function createDeepSectionHeader(text: string, depth: number): Paragraph {
  const indent = Math.min((depth - 3) * 360, 1080)
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 80 },
    indent: indent > 0 ? { left: indent } : undefined,
    children: [
      new TextRun({
        text,
        italics: true,
        size: 20,
        font: 'Calibri',
        color: chrome('primary'),
      }),
    ],
  })
}

function createKeyValueTable(rows: string[][]): Table {
  const labelWidth = Math.floor(PAGE_CONTENT_WIDTH * 0.3)
  const valueWidth = PAGE_CONTENT_WIDTH - labelWidth

  const tableRows = rows.map(
    ([key, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelWidth, type: WidthType.DXA },
            borders: {
              top: NO_BORDER,
              bottom: { color: LIGHT_GRAY, space: 0, style: BorderStyle.SINGLE, size: 2 },
              left: NO_BORDER,
              right: NO_BORDER,
            },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: key,
                    bold: true,
                    size: 20,
                    font: 'Calibri',
                    color: chrome('primary'),
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: valueWidth, type: WidthType.DXA },
            borders: {
              top: NO_BORDER,
              bottom: { color: LIGHT_GRAY, space: 0, style: BorderStyle.SINGLE, size: 2 },
              left: NO_BORDER,
              right: NO_BORDER,
            },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: value || '',
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
  )

  return new Table({
    rows: tableRows,
    width: { size: PAGE_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [labelWidth, valueWidth],
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
  })
}


// ========== Main generator ==========

export interface GenerateDocxOptions {
  themeId?: string
}

export async function generateDocx(report: Report, options: GenerateDocxOptions = {}): Promise<Blob> {
  const themeId = options.themeId ?? getPreferredPaletteId()
  _activePalette = getPalette(themeId)

  try {
    return await buildDocxBlob(report)
  } finally {
    _activePalette = CLASSICO_PALETTE
  }
}

async function buildDocxBlob(report: Report): Promise<Blob> {
  const prof = await getProfessional()
  const sortedBlocks = flattenTree(buildBlockTree(report.blocks))

  const sectionChildren: (Paragraph | Table)[] = []

  // Build depth map: count parent chain length for each block
  const blockMap = new Map(sortedBlocks.map(b => [b.id, b]))
  function getBlockDepth(block: Block): number {
    let depth = 0
    let current = block
    while (current.parentId) {
      depth++
      const parent = blockMap.get(current.parentId)
      if (!parent) break
      current = parent
    }
    return depth
  }

  // Render each block
  for (const block of sortedBlocks) {
    if (block.skippedByAi) {
      sectionChildren.push(...renderSkippedWarning(block))
      sectionChildren.push(new Paragraph({ spacing: { after: 100 }, children: [] }))
      continue
    }

    switch (block.type) {
      case 'identification':
        sectionChildren.push(...renderIdentification(block.data as IdentificationData))
        break
      case 'section':
        sectionChildren.push(...renderSection(block.data as SectionData, getBlockDepth(block)))
        break
      case 'text':
        sectionChildren.push(...renderText(block.data as TextBlockData))
        break
      case 'score-table':
        sectionChildren.push(...renderScoreTable(block.data as ScoreTableData))
        break
      case 'info-box':
        sectionChildren.push(...renderInfoBox(block.data as InfoBoxData))
        break
      case 'chart':
        sectionChildren.push(...(await renderChart(block.data as ChartData)))
        break
      case 'references':
        sectionChildren.push(...renderReferences(block.data as ReferencesData))
        break
      case 'closing-page':
        sectionChildren.push(...await renderClosingPage(block.data as ClosingPageData, report, prof))
        break
      case 'cover':
        sectionChildren.push(...renderCover(block.data as CoverData, report, prof))
        break
    }

    // Spacing between blocks
    sectionChildren.push(new Paragraph({ spacing: { after: 100 }, children: [] }))
  }

  const sectionProperties: ISectionOptions = {
    properties: {
      page: {
        margin: {
          top: PAGE_MARGIN,
          bottom: PAGE_MARGIN,
          left: PAGE_MARGIN,
          right: PAGE_MARGIN,
          header: 280, // ~0.5cm from top edge
          footer: 280, // ~0.5cm from bottom edge
        },
        pageNumbers: {
          start: 1,
          formatType: NumberFormat.DECIMAL,
        },
      },
    },
    headers: {
      default: await createDocHeader(prof),
    },
    footers: {
      default: await createDocFooter(prof, report),
    },
    children: sectionChildren,
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            { level: 0, format: NumberFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: NumberFormat.LOWER_LETTER, text: '%2)', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: NumberFormat.LOWER_ROMAN, text: '%3.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
      paragraphStyles: [
        {
          id: 'FooterPageNum',
          name: 'Footer Page Number',
          run: {
            color: 'AAAAAA',
            size: 14,
            font: 'Calibri',
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
          },
        },
      ],
    },
    sections: [sectionProperties],
  })

  return Packer.toBlob(doc)
}

export async function downloadDocx(report: Report, options: GenerateDocxOptions = {}): Promise<void> {
  const blob = await generateDocx(report, options)
  saveAs(blob, buildFileName(report))
}
