import { MOCK_LAUDO_WEVERTON } from './laudo-weverton'
import { getLaudo, saveLaudo } from '@/lib/storage'

export { MOCK_LAUDO_WEVERTON }

/**
 * Injeta/atualiza os mocks no localStorage.
 * Chamar uma vez na inicialização do app.
 */
export function seedMocks(): void {
  saveLaudo(MOCK_LAUDO_WEVERTON)
}
