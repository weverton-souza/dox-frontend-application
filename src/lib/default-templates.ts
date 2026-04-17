import type {
  ReportTemplate,
  TemplateBlock,
} from '@/types'
import {
  createEmptyIdentificationData,
  createEmptyTextBlockData,
  createEmptyScoreTableData,
  createEmptyInfoBoxData,
  createEmptyChartData,
  createEmptyReferencesData,
  createEmptyClosingPageData,
  createEmptySectionData,
} from '@/types'

function sectionBlock(id: string, order: number, title: string, parentId: string | null = null): TemplateBlock {
  return { id, type: 'section', order, data: createEmptySectionData(title), parentId }
}

function contentBlock(id: string, order: number, parentId: string | null): TemplateBlock {
  return { id, type: 'text', order, data: createEmptyTextBlockData(), parentId }
}

function scoreTableBlock(id: string, order: number, title: string, parentId: string | null = null): TemplateBlock {
  const data = createEmptyScoreTableData()
  data.title = title
  return { id, type: 'score-table', order, data, parentId }
}

function infoBoxBlock(id: string, order: number, label: string, parentId: string | null = null): TemplateBlock {
  const data = createEmptyInfoBoxData()
  data.label = label
  return { id, type: 'info-box', order, data, parentId }
}

function chartBlock(id: string, order: number, title: string, parentId: string | null = null): TemplateBlock {
  const data = createEmptyChartData()
  data.title = title
  return { id, type: 'chart', order, data, parentId }
}

function identificationBlock(id: string, order: number, parentId: string | null = null): TemplateBlock {
  return { id, type: 'identification', order, data: createEmptyIdentificationData(), parentId }
}

function referencesBlock(id: string, order: number, parentId: string | null = null): TemplateBlock {
  return { id, type: 'references', order, data: createEmptyReferencesData(), parentId }
}

function closingPageBlock(id: string, order: number, parentId: string | null = null): TemplateBlock {
  return { id, type: 'closing-page', order, data: createEmptyClosingPageData(), parentId }
}

const TEMPLATE_ADULTO: ReportTemplate = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Relatório Padrão Adulto',
  description: 'Estrutura completa para avaliação de adultos',
  isDefault: true,
  isLocked: true,
  isMaster: true,
  blocks: [
    identificationBlock('tpl-adulto-id', 0),
    sectionBlock('tpl-adulto-s1', 1, 'DESCRIÇÃO DA DEMANDA E OBJETIVOS DA AVALIAÇÃO'),
    contentBlock('tpl-adulto-s1-t1', 2, 'tpl-adulto-s1'),
    sectionBlock('tpl-adulto-s2', 3, 'PROCEDIMENTOS'),
    contentBlock('tpl-adulto-s2-t1', 4, 'tpl-adulto-s2'),
    sectionBlock('tpl-adulto-s3', 5, 'ANAMNESE'),
    contentBlock('tpl-adulto-s3-t1', 6, 'tpl-adulto-s3'),
    sectionBlock('tpl-adulto-s4', 7, 'RESULTADOS'),
    scoreTableBlock('tpl-adulto-s4-st1', 8, 'ATENÇÃO', 'tpl-adulto-s4'),
    scoreTableBlock('tpl-adulto-s4-st2', 9, 'MEMÓRIA', 'tpl-adulto-s4'),
    scoreTableBlock('tpl-adulto-s4-st3', 10, 'FUNÇÕES EXECUTIVAS', 'tpl-adulto-s4'),
    chartBlock('tpl-adulto-s4-ch1', 11, 'DESEMPENHO', 'tpl-adulto-s4'),
    sectionBlock('tpl-adulto-s5', 12, 'ANÁLISE E OBSERVAÇÕES'),
    contentBlock('tpl-adulto-s5-t1', 13, 'tpl-adulto-s5'),
    infoBoxBlock('tpl-adulto-ib1', 14, 'IMPRESSÃO DIAGNÓSTICA'),
    sectionBlock('tpl-adulto-s6', 15, 'SUGESTÕES E ENCAMINHAMENTOS'),
    contentBlock('tpl-adulto-s6-t1', 16, 'tpl-adulto-s6'),
    sectionBlock('tpl-adulto-s7', 17, 'CONCLUSÃO'),
    contentBlock('tpl-adulto-s7-t1', 18, 'tpl-adulto-s7'),
    referencesBlock('tpl-adulto-ref', 19),
    closingPageBlock('tpl-adulto-cp', 20),
  ],
}

const TEMPLATE_BREVE: ReportTemplate = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Relatório Breve',
  description: 'Estrutura resumida para relatórios mais curtos',
  isDefault: true,
  isLocked: true,
  isMaster: true,
  blocks: [
    identificationBlock('tpl-breve-id', 0),
    sectionBlock('tpl-breve-s1', 1, 'DESCRIÇÃO DA DEMANDA'),
    contentBlock('tpl-breve-s1-t1', 2, 'tpl-breve-s1'),
    sectionBlock('tpl-breve-s2', 3, 'PROCEDIMENTOS'),
    contentBlock('tpl-breve-s2-t1', 4, 'tpl-breve-s2'),
    sectionBlock('tpl-breve-s3', 5, 'RESULTADOS'),
    scoreTableBlock('tpl-breve-s3-st1', 6, 'RESULTADOS', 'tpl-breve-s3'),
    infoBoxBlock('tpl-breve-ib1', 7, 'IMPRESSÃO DIAGNÓSTICA'),
    sectionBlock('tpl-breve-s4', 8, 'CONCLUSÃO'),
    contentBlock('tpl-breve-s4-t1', 9, 'tpl-breve-s4'),
    closingPageBlock('tpl-breve-cp', 10),
  ],
}

export const DEFAULT_TEMPLATES: ReportTemplate[] = [
  TEMPLATE_ADULTO,
  TEMPLATE_BREVE,
]

export function getAllTemplates(customTemplates: ReportTemplate[]): ReportTemplate[] {
  const hasBackendMaster = customTemplates.some((t) => t.isMaster)
  if (hasBackendMaster) return customTemplates
  return [...DEFAULT_TEMPLATES, ...customTemplates]
}
