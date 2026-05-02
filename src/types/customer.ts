// ========== Customer ==========

export interface CustomerData {
  name: string
  cpf: string
  birthDate: string // ISO date string
  age: string // editável — ex: "32 anos e 4 meses"
  education: string
  profession: string
  // Contato
  phone?: string
  email?: string
  addressStreet?: string
  addressCity?: string
  addressState?: string
  addressZipCode?: string
  // Clínico
  chiefComplaint?: string      // queixa principal
  diagnosis?: string
  medications?: string
  referralDoctor?: string      // médico solicitante
}

export interface Customer {
  id: string
  createdAt: string
  updatedAt: string
  data: CustomerData
}

export interface CustomerNote {
  id: string
  customerId: string
  createdAt: string
  updatedAt: string
  content: string
}

// ========== Customer Timeline ==========

export type CustomerEventType = 'consulta' | 'retorno' | 'avaliacao' | 'laudo' | 'observacao'

export const CUSTOMER_EVENT_TYPE_LABELS: Record<CustomerEventType, string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  avaliacao: 'Avaliação',
  laudo: 'Relatório',
  observacao: 'Observação',
}

export const CUSTOMER_EVENT_TYPE_COLORS: Record<CustomerEventType, string> = {
  consulta: 'bg-blue-500',
  retorno: 'bg-emerald-500',
  avaliacao: 'bg-purple-500',
  laudo: 'bg-amber-500',
  observacao: 'bg-gray-400',
}

export interface CustomerEvent {
  id: string
  customerId: string
  type: CustomerEventType
  title: string
  description: string
  date: string       // ISO datetime — data/hora do evento
  createdAt: string
}

// ========== Customer Factory Functions ==========

export function createEmptyCustomerData(): CustomerData {
  return {
    name: '',
    cpf: '',
    birthDate: '',
    age: '',
    education: '',
    profession: '',
  }
}

export function createEmptyCustomer(): Customer {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: createEmptyCustomerData(),
  }
}

export function createEmptyCustomerNote(customerId: string): CustomerNote {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    customerId,
    createdAt: now,
    updatedAt: now,
    content: '',
  }
}

export function createEmptyCustomerEvent(customerId: string, type: CustomerEventType = 'consulta'): CustomerEvent {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    customerId,
    type,
    title: '',
    description: '',
    date: now,
    createdAt: now,
  }
}

// ========== Patient Contacts ==========

export type PatientContactRelationType =
  | 'PARENT'
  | 'LEGAL_GUARDIAN'
  | 'MOTHER'
  | 'FATHER'
  | 'SPOUSE'
  | 'CHILD'
  | 'SIBLING'
  | 'GRANDPARENT'
  | 'UNCLE_AUNT'
  | 'TEACHER'
  | 'SCHOOL'
  | 'DOCTOR'
  | 'THERAPIST'
  | 'FRIEND'
  | 'OTHER'

export const PATIENT_CONTACT_RELATION_LABELS: Record<PatientContactRelationType, string> = {
  PARENT: 'Filiação',
  LEGAL_GUARDIAN: 'Responsável legal',
  MOTHER: 'Mãe',
  FATHER: 'Pai',
  SPOUSE: 'Cônjuge',
  CHILD: 'Filho(a)',
  SIBLING: 'Irmão(ã)',
  GRANDPARENT: 'Avô/Avó',
  UNCLE_AUNT: 'Tio(a)',
  TEACHER: 'Professor(a)',
  SCHOOL: 'Escola',
  DOCTOR: 'Médico(a)',
  THERAPIST: 'Terapeuta',
  FRIEND: 'Amigo(a)',
  OTHER: 'Outro',
}

export interface PatientContact {
  id: string
  customerId: string
  name: string
  relationType: PatientContactRelationType
  email: string | null
  phone: string | null
  notes: string | null
  canReceiveForms: boolean
  createdAt: string
  updatedAt: string
}

export function createEmptyPatientContact(customerId: string, relationType: PatientContactRelationType = 'PARENT'): PatientContact {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    customerId,
    name: '',
    relationType,
    email: null,
    phone: null,
    notes: null,
    canReceiveForms: true,
    createdAt: now,
    updatedAt: now,
  }
}
