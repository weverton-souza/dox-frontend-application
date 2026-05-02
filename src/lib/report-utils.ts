import type { Report, Customer, ReportTemplate, Block, IdentificationCustomerSnapshot, GuardianEntry, CustomerContact } from '@/types'
import { createEmptyIdentificationData } from '@/types'
import { createReport } from '@/lib/api/report-api'
import { getProfessional } from '@/lib/api/professional-api'
import { getCustomerContacts } from '@/lib/api/customer-api'
import { createBlock } from '@/lib/utils'

const PARENT_TYPES = new Set(['parent', 'mother', 'father'])

function buildSnapshot(customer: Customer, contacts: CustomerContact[]): IdentificationCustomerSnapshot {
  const parents = contacts
    .filter((c) => PARENT_TYPES.has(c.relationType))
    .map((c) => c.name)
    .filter((n) => n.trim())

  const guardians: GuardianEntry[] = contacts
    .filter((c) => c.relationType === 'legal_guardian')
    .map((c) => ({ name: c.name, relationship: c.notes ?? undefined }))
    .filter((g) => g.name.trim())

  return { ...customer.data, parents, guardians }
}

async function fetchContactsSafely(customerId: string): Promise<CustomerContact[]> {
  try {
    return await getCustomerContacts(customerId)
  } catch {
    return []
  }
}

export async function createReportFromCustomer(customer: Customer): Promise<Report> {
  const [professional, contacts] = await Promise.all([
    getProfessional(),
    fetchContactsSafely(customer.id),
  ])
  const identificationBlock = createBlock('identification', 0, professional)

  const identData = createEmptyIdentificationData(professional)
  identData.customer = buildSnapshot(customer, contacts)
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
  const [professional, contacts] = await Promise.all([
    getProfessional(),
    fetchContactsSafely(customer.id),
  ])
  const snapshot = buildSnapshot(customer, contacts)

  const blocks: Block[] = template.blocks
    .sort((a, b) => a.order - b.order)
    .map((tb, i) => {
      if (tb.type === 'identification') {
        const block = createBlock('identification', i, professional)
        const identData = createEmptyIdentificationData(professional)
        identData.customer = snapshot
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

  const idMap = new Map<string, string>()
  template.blocks.forEach((tb) => {
    if (tb.id) idMap.set(tb.id, crypto.randomUUID())
  })

  const remappedBlocks = blocks.map((b, i) => {
    const originalId = template.blocks[i]?.id
    const newId = originalId ? idMap.get(originalId) ?? b.id : b.id
    const originalParentId = template.blocks[i]?.parentId
    const newParentId = originalParentId ? idMap.get(originalParentId) ?? b.parentId : b.parentId
    return { ...b, id: newId, parentId: newParentId }
  })

  const report: Partial<Report> = {
    status: 'rascunho',
    customerName: customer.data.name,
    customerId: customer.id,
    templateId: template.id,
    blocks: remappedBlocks,
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
