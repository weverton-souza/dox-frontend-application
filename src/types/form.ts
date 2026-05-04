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
  | 'inventory-item'
  | 'likert-matrix'

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  'short-text': 'Texto Curto',
  'long-text': 'Texto Longo',
  'single-choice': 'Escolha Única',
  'multiple-choice': 'Múltipla Escolha',
  'scale': 'Escala',
  'yes-no': 'Sim/Não',
  'date': 'Data',
  'section-header': 'Cabeçalho de Seção',
  'inventory-item': 'Inventário',
  'likert-matrix': 'Matriz Likert',
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
  'inventory-item': 'Lista de opções com valor próprio (ex: BDI, BAI)',
  'likert-matrix': 'Tabela com escala compartilhada (ex: SRS-2, PSS-10)',
}

export const SCORABLE_FIELD_TYPES: FormFieldType[] = ['inventory-item', 'likert-matrix', 'scale']

export function isScorableFieldType(type: FormFieldType): boolean {
  return SCORABLE_FIELD_TYPES.includes(type)
}

export interface FormFieldOption {
  id: string
  label: string
  value?: number             // para inventory-item: valor pontuado da opção
}

export interface LikertScalePoint {
  value: number
  label: string              // ex: "Nunca", "Raramente", "Às vezes", "Sempre"
}

export interface LikertRow {
  id: string
  label: string              // ex: "Tem dificuldade em fazer amigos"
  reverseScored: boolean     // se true, valor invertido na escala
}

export type ConditionalOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'GREATER'
  | 'LESS'
  | 'IS_EMPTY'

export const CONDITIONAL_OPERATOR_LABELS: Record<ConditionalOperator, string> = {
  EQUALS: 'é igual a',
  NOT_EQUALS: 'é diferente de',
  CONTAINS: 'contém',
  GREATER: 'é maior que',
  LESS: 'é menor que',
  IS_EMPTY: 'está vazia',
}

export interface ConditionalRule {
  questionRef: string
  operator: ConditionalOperator
  value?: string | number
  combinator?: 'AND' | 'OR'
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  description: string
  required: boolean
  order: number
  options: FormFieldOption[]
  scaleMin: number
  scaleMax: number
  scaleMinLabel: string
  scaleMaxLabel: string
  placeholder: string
  variableKey: string
  reverseScored: boolean
  likertScale: LikertScalePoint[]
  likertRows: LikertRow[]
  showWhen?: ConditionalRule[]
}

export interface FormFieldMapping {
  fieldId: string             // FormField.id
  targetSection: string       // ex: "ANAMNESE", "IDENTIFICAÇÃO"
  hint: string                // dica livre para a IA, ex: "nível de escolaridade do paciente"
}

export type ScoringOperation = 'sum' | 'mean' | 'min' | 'max' | 'count'

export const SCORING_OPERATION_LABELS: Record<ScoringOperation, string> = {
  sum: 'Soma',
  mean: 'Média',
  min: 'Mínimo',
  max: 'Máximo',
  count: 'Contagem',
}

export interface ScoringClassificationRange {
  min: number
  max: number
  label: string              // ex: "Mínima", "Leve", "Moderada", "Severa"
}

export interface ScoringFormula {
  id: string
  name: string               // ex: "Score Total", "Cognição Social"
  operation: ScoringOperation
  fieldIds: string[]         // perguntas pontuáveis selecionadas
  classification: ScoringClassificationRange[]
}

export interface ScoringConfig {
  formulas: ScoringFormula[]
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
  scoringConfig: ScoringConfig
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
  selectedOptionIds: string[]  // para single-choice (1 item), multiple-choice (N items), inventory-item (1 item)
  scaleValue: number | null    // para scale
  likertAnswers: Record<string, number>  // para likert-matrix: rowId → valor selecionado
}

export interface FormResponse {
  id: string
  formId: string
  formVersionId: string         // versão do form no momento da submissão
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

export function createEmptyInventoryOption(value: number = 0): FormFieldOption {
  return {
    id: crypto.randomUUID(),
    label: '',
    value,
  }
}

export function createDefaultLikertScale(): LikertScalePoint[] {
  return [
    { value: 0, label: 'Nunca' },
    { value: 1, label: 'Raramente' },
    { value: 2, label: 'Às vezes' },
    { value: 3, label: 'Sempre' },
  ]
}

export function createEmptyLikertRow(): LikertRow {
  return {
    id: crypto.randomUUID(),
    label: '',
    reverseScored: false,
  }
}

export function createEmptyFormField(type: FormFieldType = 'short-text', order: number = 0): FormField {
  const baseOptions: FormFieldOption[] = (() => {
    if (type === 'single-choice' || type === 'multiple-choice') {
      return [createEmptyFormFieldOption(), createEmptyFormFieldOption()]
    }
    if (type === 'inventory-item') {
      return [
        createEmptyInventoryOption(0),
        createEmptyInventoryOption(1),
        createEmptyInventoryOption(2),
        createEmptyInventoryOption(3),
      ]
    }
    return []
  })()

  return {
    id: crypto.randomUUID(),
    type,
    label: '',
    description: '',
    required: false,
    order,
    options: baseOptions,
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: '',
    scaleMaxLabel: '',
    placeholder: '',
    variableKey: '',
    reverseScored: false,
    likertScale: type === 'likert-matrix' ? createDefaultLikertScale() : [],
    likertRows: type === 'likert-matrix' ? [createEmptyLikertRow()] : [],
  }
}

export function createEmptyScoringConfig(): ScoringConfig {
  return { formulas: [] }
}

export function createEmptyScoringFormula(): ScoringFormula {
  return {
    id: crypto.randomUUID(),
    name: '',
    operation: 'sum',
    fieldIds: [],
    classification: [],
  }
}

export function createEmptyForm(): Form {
  const initialSection = createEmptyFormField('section-header', 0)
  initialSection.label = 'Seção 1'
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [initialSection],
    linkedTemplateId: null,
    fieldMappings: [],
    scoringConfig: createEmptyScoringConfig(),
  }
}

export function createEmptyFormFieldAnswer(fieldId: string): FormFieldAnswer {
  return {
    fieldId,
    value: '',
    selectedOptionIds: [],
    scaleValue: null,
    likertAnswers: {},
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

export type FormLinkStatus = 'pending' | 'answered' | 'expired'

export type RespondentType = 'professional' | 'customer' | 'contact'

export const RESPONDENT_TYPE_LABELS: Record<RespondentType, string> = {
  professional: 'Profissional',
  customer: 'Cliente',
  contact: 'Contato',
}

export interface RespondentInfo {
  type: RespondentType
  name: string | null
  customerContactId?: string | null
  relationType?: string | null
}

export interface FormLink {
  id: string
  token: string
  formId: string
  formVersionId: string
  customerId: string
  customerContactId?: string | null
  respondentType: RespondentType
  respondent: RespondentInfo
  status: FormLinkStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface MultiSendRecipient {
  respondentType: RespondentType
  customerContactId?: string | null
}

export interface FormSummary {
  id: string
  title: string
}

export interface FormVersionSummary {
  id: string
  version: number
  title: string
}

export interface AggregatedRespondent {
  linkId: string
  respondentType: RespondentType
  respondentName: string | null
  customerContactId: string | null
  relationType: string | null
  status: FormLinkStatus
  submittedAt: string | null
  expiresAt: string
}

export interface AggregatedFormGroup {
  form: FormSummary
  version: FormVersionSummary
  sentAt: string
  respondents: AggregatedRespondent[]
}

export interface ScoreResult {
  formulaId: string
  name: string
  operation: 'sum' | 'mean' | 'min' | 'max' | 'count'
  value: number | null
  classification: string | null
  contributionsCount: number
}

export interface ComparisonRespondent {
  linkId: string
  respondentType: RespondentType
  respondentName: string | null
  customerContactId: string | null
  relationType: string | null
  status: FormLinkStatus
  submittedAt: string | null
  answers: FormFieldAnswer[]
  scoreBreakdown: ScoreResult[]
}

export interface ComparisonResult {
  form: FormSummary
  version: FormVersionSummary
  fields: FormField[]
  scoringConfig: ScoringConfig
  respondents: ComparisonRespondent[]
}

export interface PublicFormData {
  formTitle: string
  formDescription: string | null
  fields: FormField[]
  customerName: string | null
  expiresAt: string
}
