import type { Professional } from '@/types'

/**
 * Formata o registro de conselho do profissional.
 * Prioridade: novo formato (councilType + councilNumber + councilState) → fallback CRP legado.
 *
 * Exemplos:
 *   { councilType: 'CRP', councilNumber: '12345', councilState: 'SP' } → "CRP 12345/SP"
 *   { councilType: 'CREA', councilNumber: '987654' }                  → "CREA 987654"
 *   { crp: '06/12345' }                                               → "CRP 06/12345"
 *   {} ou todos vazios                                                → ""
 */
export function formatCouncil(prof: Pick<Professional, 'councilType' | 'councilNumber' | 'councilState' | 'crp'>): string {
  if (prof.councilType && prof.councilNumber) {
    const state = prof.councilState ? `/${prof.councilState}` : ''
    return `${prof.councilType} ${prof.councilNumber}${state}`
  }
  if (prof.crp) return `CRP ${prof.crp}`
  return ''
}

/**
 * Versão com fallback custom (ex: linha de assinatura com underscore).
 */
export function formatCouncilWithFallback(
  prof: Pick<Professional, 'councilType' | 'councilNumber' | 'councilState' | 'crp'>,
  fallback: string,
): string {
  return formatCouncil(prof) || fallback
}
