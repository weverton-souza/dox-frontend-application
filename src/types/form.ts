// ========== Form ==========

export type FormFieldType =
  | 'short-text'
  | 'long-text'
  | 'single-choice'
  | 'multiple-choice'
  | 'scale'
  | 'yes-no'
  | 'date'
  | 'section-header'

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  'short-text': 'Texto Curto',
  'long-text': 'Texto Longo',
  'single-choice': 'Escolha Única',
  'multiple-choice': 'Múltipla Escolha',
  'scale': 'Escala',
  'yes-no': 'Sim/Não',
  'date': 'Data',
  'section-header': 'Cabeçalho de Seção',
}

export const FORM_FIELD_TYPE_DESCRIPTIONS: Record<FormFieldType, string> = {
  'short-text': 'Resposta breve em uma linha',
  'long-text': 'Resposta longa em múltiplas linhas',
  'single-choice': 'Selecionar uma opção entre várias',
  'multiple-choice': 'Selecionar várias opções',
  'scale': 'Escala numérica (ex: 1 a 5)',
  'yes-no': 'Resposta Sim ou Não',
  'date': 'Seletor de data',
  'section-header': 'Título de seção para organizar o formulário',
}

export interface FormFieldOption {
  id: string
  label: string
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string              // texto da pergunta / título da seção
  description: string        // texto auxiliar abaixo da pergunta
  required: boolean
  order: number
  // Configuração específica por tipo
  options: FormFieldOption[]  // para single-choice, multiple-choice
  scaleMin: number            // para scale (default 1)
  scaleMax: number            // para scale (default 5)
  scaleMinLabel: string       // ex: "Nunca"
  scaleMaxLabel: string       // ex: "Sempre"
  placeholder: string         // para short-text, long-text
  variableKey: string         // chave para {{variableKey}} em templates (ex: "queixa_principal")
}

export interface FormFieldMapping {
  fieldId: string             // FormField.id
  targetSection: string       // ex: "ANAMNESE", "IDENTIFICAÇÃO"
  hint: string                // dica livre para a IA, ex: "nível de escolaridade do paciente"
}

export interface Form {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  fields: FormField[]
  linkedTemplateId: string | null  // link para ReportTemplate.id
  fieldMappings: FormFieldMapping[]
  isDefault?: boolean
}

export type FormResponseStatus = 'em_andamento' | 'concluido'

export const FORM_RESPONSE_STATUS_LABELS: Record<FormResponseStatus, string> = {
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
}

export const FORM_RESPONSE_STATUS_COLORS: Record<FormResponseStatus, { bg: string; text: string }> = {
  em_andamento: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  concluido: { bg: 'bg-green-100', text: 'text-green-700' },
}

export interface FormFieldAnswer {
  fieldId: string
  value: string               // para short-text, long-text, date, yes-no ("sim"/"não")
  selectedOptionIds: string[]  // para single-choice (1 item), multiple-choice (N items)
  scaleValue: number | null    // para scale
}

export interface FormResponse {
  id: string
  formId: string
  customerId: string | null     // link opcional ao cadastro de clientes
  customerName: string          // sempre armazenado (pode não estar no cadastro)
  status: FormResponseStatus
  answers: FormFieldAnswer[]
  createdAt: string
  updatedAt: string
  generatedReportId: string | null  // preenchido após IA gerar o relatório
}

// ========== Form Factory Functions ==========

export function createEmptyFormFieldOption(): FormFieldOption {
  return {
    id: crypto.randomUUID(),
    label: '',
  }
}

export function createEmptyFormField(type: FormFieldType = 'short-text', order: number = 0): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: '',
    description: '',
    required: false,
    order,
    options: type === 'single-choice' || type === 'multiple-choice'
      ? [createEmptyFormFieldOption(), createEmptyFormFieldOption()]
      : [],
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: '',
    scaleMaxLabel: '',
    placeholder: '',
    variableKey: '',
  }
}

export function createEmptyForm(): Form {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [],
    linkedTemplateId: null,
    fieldMappings: [],
  }
}

export function createEmptyFormFieldAnswer(fieldId: string): FormFieldAnswer {
  return {
    fieldId,
    value: '',
    selectedOptionIds: [],
    scaleValue: null,
  }
}

export function createEmptyFormResponse(formId: string): FormResponse {
  return {
    id: crypto.randomUUID(),
    formId,
    customerId: null,
    customerName: '',
    status: 'em_andamento',
    answers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generatedReportId: null,
  }
}

// ========== Form Section Grouping ==========

export interface FormSectionGroup {
  sectionFieldId: string
  sectionTitle: string
  sectionField: FormField | null
  children: FormField[]
}

// ========== Public Form ==========

export type FormLinkStatus = 'PENDING' | 'ANSWERED' | 'EXPIRED'

export interface FormLink {
  id: string
  token: string
  formId: string
  customerId: string
  status: FormLinkStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface PublicFormData {
  formTitle: string
  formDescription: string | null
  fields: FormField[]
  customerName: string | null
  expiresAt: string
}
