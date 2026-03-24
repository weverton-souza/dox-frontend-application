import type { Report, Customer, ReportTemplate, Block } from '@/types'
import { createEmptyIdentificationData } from '@/types'
import { createReport } from '@/lib/api/report-api'
import { getProfessional } from '@/lib/api/professional-api'
import { createBlock } from '@/lib/utils'

export async function createReportFromCustomer(customer: Customer): Promise<Report> {
  const professional = await getProfessional()
  const identificationBlock = createBlock('identification', 0, professional)

  const identData = createEmptyIdentificationData(professional)
  identData.customer = { ...customer.data }
  identificationBlock.data = identData

  const report: Partial<Report> = {
    status: 'rascunho',
    customerName: customer.data.name,
    customerId: customer.id,
    blocks: [identificationBlock],
  }

  return createReport(report)
}

export async function createReportFromTemplate(
  customer: Customer,
  template: ReportTemplate,
): Promise<Report> {
  const professional = await getProfessional()

  const blocks: Block[] = template.blocks
    .sort((a, b) => a.order - b.order)
    .map((tb, i) => {
      if (tb.type === 'identification') {
        const block = createBlock('identification', i, professional)
        const identData = createEmptyIdentificationData(professional)
        identData.customer = { ...customer.data }
        block.data = identData
        return block
      }

      return {
        id: crypto.randomUUID(),
        type: tb.type,
        parentId: tb.parentId ?? null,
        order: i,
        data: structuredClone(tb.data),
        collapsed: false,
      }
    })

  const report: Partial<Report> = {
    status: 'rascunho',
    customerName: customer.data.name,
    customerId: customer.id,
    blocks,
  }

  return createReport(report)
}

export async function createEmptyReport(): Promise<Report> {
  const professional = await getProfessional()
  const identificationBlock = createBlock('identification', 0, professional)

  const report: Partial<Report> = {
    status: 'rascunho',
    customerName: '',
    blocks: [identificationBlock],
  }

  return createReport(report)
}
