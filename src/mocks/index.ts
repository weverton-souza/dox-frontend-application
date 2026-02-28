import { MOCK_LAUDO_WEVERTON } from './laudo-weverton'
import { MOCK_PATIENTS } from './patients'
import { saveLaudo, savePatient, getPatients } from '@/lib/storage'

export { MOCK_LAUDO_WEVERTON, MOCK_PATIENTS }

/**
 * Injeta/atualiza os mocks no localStorage.
 * Chamar uma vez na inicialização do app.
 */
export function seedMocks(): void {
  saveLaudo(MOCK_LAUDO_WEVERTON)

  // Seed mock patients (only if not already present)
  const existingPatients = getPatients()
  for (const patient of MOCK_PATIENTS) {
    if (!existingPatients.some((p) => p.id === patient.id)) {
      savePatient(patient)
    }
  }
}
