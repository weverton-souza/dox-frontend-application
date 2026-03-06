import { Laudo, Professional, LaudoTemplate, Patient, PatientNote, PatientEvent } from '@/types'
import { deleteVersionHistory } from '@/lib/version-storage'
import { readFromStorage, writeToStorage, upsertInStorage, deleteFromStorage } from '@/lib/storage-utils'

const LAUDOS_KEY = 'neurohub_laudos'
const PROFESSIONAL_KEY = 'neurohub_professional'
const TEMPLATES_KEY = 'neurohub_templates'
const PATIENTS_KEY = 'neurohub_patients'
const PATIENT_NOTES_KEY = 'neurohub_patient_notes'
const PATIENT_EVENTS_KEY = 'neurohub_patient_events'

// ========== Laudos ==========

export function getLaudos(): Laudo[] {
  return readFromStorage<Laudo>(LAUDOS_KEY)
}

export function getLaudo(id: string): Laudo | null {
  return getLaudos().find((l) => l.id === id) ?? null
}

export function saveLaudo(laudo: Laudo): void {
  upsertInStorage(LAUDOS_KEY, laudo, getLaudos)
}

export function deleteLaudo(id: string): void {
  writeToStorage(LAUDOS_KEY, getLaudos().filter((l) => l.id !== id))
  deleteVersionHistory(id)
}

// ========== Patients ==========

export function getPatients(): Patient[] {
  return readFromStorage<Patient>(PATIENTS_KEY)
}

export function getPatient(id: string): Patient | null {
  return getPatients().find((p) => p.id === id) ?? null
}

export function savePatient(patient: Patient): void {
  upsertInStorage(PATIENTS_KEY, patient, getPatients)
}

export function deletePatient(id: string): void {
  writeToStorage(PATIENTS_KEY, getPatients().filter((p) => p.id !== id))
  deletePatientNotes(id)
  deletePatientEvents(id)
}

// ========== Patient Notes ==========

export function getPatientNotes(patientId: string): PatientNote[] {
  return readFromStorage<PatientNote>(PATIENT_NOTES_KEY)
    .filter((n) => n.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function savePatientNote(note: PatientNote): void {
  upsertInStorage(PATIENT_NOTES_KEY, note, () => readFromStorage<PatientNote>(PATIENT_NOTES_KEY))
}

export function deletePatientNote(id: string): void {
  deleteFromStorage<PatientNote>(PATIENT_NOTES_KEY, (n) => n.id !== id)
}

export function deletePatientNotes(patientId: string): void {
  deleteFromStorage<PatientNote>(PATIENT_NOTES_KEY, (n) => n.patientId !== patientId)
}

// ========== Laudos by Patient ==========

export function getLaudosByPatient(patientId: string): Laudo[] {
  return getLaudos().filter((l) => l.patientId === patientId)
}

// ========== Patient Events (Timeline) ==========

export function getPatientEvents(patientId: string): PatientEvent[] {
  return readFromStorage<PatientEvent>(PATIENT_EVENTS_KEY)
    .filter((e) => e.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function savePatientEvent(event: PatientEvent): void {
  upsertInStorage(
    PATIENT_EVENTS_KEY,
    event,
    () => readFromStorage<PatientEvent>(PATIENT_EVENTS_KEY),
    false,
  )
}

export function deletePatientEvent(id: string): void {
  deleteFromStorage<PatientEvent>(PATIENT_EVENTS_KEY, (e) => e.id !== id)
}

export function deletePatientEvents(patientId: string): void {
  deleteFromStorage<PatientEvent>(PATIENT_EVENTS_KEY, (e) => e.patientId !== patientId)
}

// ========== Professional ==========

const DEFAULT_PROFESSIONAL: Professional = {
  name: 'Dênia Ingrid França Santos',
  crp: '04/59907',
  specialization: 'Psicóloga, especialista em Neuropsicologia',
}

export function getProfessional(): Professional {
  const raw = localStorage.getItem(PROFESSIONAL_KEY)
  if (!raw) return { ...DEFAULT_PROFESSIONAL }
  try {
    return JSON.parse(raw) as Professional
  } catch {
    return { ...DEFAULT_PROFESSIONAL }
  }
}

export function saveProfessional(p: Professional): void {
  localStorage.setItem(PROFESSIONAL_KEY, JSON.stringify(p))
}

// ========== Custom Templates ==========

export function getCustomTemplates(): LaudoTemplate[] {
  return readFromStorage<LaudoTemplate>(TEMPLATES_KEY)
}

export function saveCustomTemplate(t: LaudoTemplate): void {
  upsertInStorage(TEMPLATES_KEY, t, getCustomTemplates, false)
}

export function deleteCustomTemplate(id: string): void {
  writeToStorage(TEMPLATES_KEY, getCustomTemplates().filter((t) => t.id !== id))
}
