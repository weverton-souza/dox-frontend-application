import { Laudo, Professional, LaudoTemplate, Patient, PatientNote } from '@/types'
import { deleteVersionHistory } from '@/lib/version-storage'

const LAUDOS_KEY = 'neurohub_laudos'
const PROFESSIONAL_KEY = 'neurohub_professional'
const TEMPLATES_KEY = 'neurohub_templates'
const PATIENTS_KEY = 'neurohub_patients'
const PATIENT_NOTES_KEY = 'neurohub_patient_notes'

// ========== Laudos ==========

export function getLaudos(): Laudo[] {
  const raw = localStorage.getItem(LAUDOS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Laudo[]
  } catch {
    return []
  }
}

export function getLaudo(id: string): Laudo | null {
  const laudos = getLaudos()
  return laudos.find((l) => l.id === id) ?? null
}

export function saveLaudo(laudo: Laudo): void {
  const laudos = getLaudos()
  const index = laudos.findIndex((l) => l.id === laudo.id)
  const updated = { ...laudo, updatedAt: new Date().toISOString() }

  if (index >= 0) {
    laudos[index] = updated
  } else {
    laudos.push(updated)
  }

  localStorage.setItem(LAUDOS_KEY, JSON.stringify(laudos))
}

export function deleteLaudo(id: string): void {
  const laudos = getLaudos().filter((l) => l.id !== id)
  localStorage.setItem(LAUDOS_KEY, JSON.stringify(laudos))
  deleteVersionHistory(id)
}

// ========== Patients ==========

export function getPatients(): Patient[] {
  const raw = localStorage.getItem(PATIENTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Patient[]
  } catch {
    return []
  }
}

export function getPatient(id: string): Patient | null {
  const patients = getPatients()
  return patients.find((p) => p.id === id) ?? null
}

export function savePatient(patient: Patient): void {
  const patients = getPatients()
  const index = patients.findIndex((p) => p.id === patient.id)
  const updated = { ...patient, updatedAt: new Date().toISOString() }

  if (index >= 0) {
    patients[index] = updated
  } else {
    patients.push(updated)
  }

  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients))
}

export function deletePatient(id: string): void {
  const patients = getPatients().filter((p) => p.id !== id)
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients))
  deletePatientNotes(id)
}

// ========== Patient Notes ==========

export function getPatientNotes(patientId: string): PatientNote[] {
  const raw = localStorage.getItem(PATIENT_NOTES_KEY)
  if (!raw) return []
  try {
    const all = JSON.parse(raw) as PatientNote[]
    return all
      .filter((n) => n.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch {
    return []
  }
}

export function savePatientNote(note: PatientNote): void {
  const raw = localStorage.getItem(PATIENT_NOTES_KEY)
  let all: PatientNote[] = []
  try {
    all = raw ? (JSON.parse(raw) as PatientNote[]) : []
  } catch { /* ignore */ }

  const index = all.findIndex((n) => n.id === note.id)
  const updated = { ...note, updatedAt: new Date().toISOString() }

  if (index >= 0) {
    all[index] = updated
  } else {
    all.push(updated)
  }

  localStorage.setItem(PATIENT_NOTES_KEY, JSON.stringify(all))
}

export function deletePatientNote(id: string): void {
  const raw = localStorage.getItem(PATIENT_NOTES_KEY)
  if (!raw) return
  try {
    const all = (JSON.parse(raw) as PatientNote[]).filter((n) => n.id !== id)
    localStorage.setItem(PATIENT_NOTES_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

export function deletePatientNotes(patientId: string): void {
  const raw = localStorage.getItem(PATIENT_NOTES_KEY)
  if (!raw) return
  try {
    const all = (JSON.parse(raw) as PatientNote[]).filter((n) => n.patientId !== patientId)
    localStorage.setItem(PATIENT_NOTES_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

// ========== Laudos by Patient ==========

export function getLaudosByPatient(patientId: string): Laudo[] {
  return getLaudos().filter((l) => l.patientId === patientId)
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
  const raw = localStorage.getItem(TEMPLATES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as LaudoTemplate[]
  } catch {
    return []
  }
}

export function saveCustomTemplate(t: LaudoTemplate): void {
  const templates = getCustomTemplates()
  const index = templates.findIndex((tmpl) => tmpl.id === t.id)

  if (index >= 0) {
    templates[index] = t
  } else {
    templates.push(t)
  }

  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export function deleteCustomTemplate(id: string): void {
  const templates = getCustomTemplates().filter((t) => t.id !== id)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}
