/**
 * Sanitiza um documento (CPF ou CNPJ) removendo qualquer caractere que não seja
 * dígito ou letra. Letras viram MAIÚSCULAS — o novo CNPJ alfanumérico aceita
 * A-Z nas 12 primeiras posições (DV permanece numérico).
 */
export function sanitizeDocument(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

/**
 * Aplica máscara visual:
 * - CPF (11 dígitos): 000.000.000-00
 * - CNPJ (14 chars):  00.000.000/0000-00 (12 primeiros alfanuméricos)
 */
export function formatDocument(raw: string): string {
  const s = sanitizeDocument(raw)
  const hasLetter = /[A-Z]/.test(s)

  if (!hasLetter && s.length <= 11) {
    return s
      .slice(0, 11)
      .replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2}).*$/, (_, a, b, c, d) => {
        let out = a
        if (b) out += `.${b}`
        if (c) out += `.${c}`
        if (d) out += `-${d}`
        return out
      })
  }

  const trimmed = s.slice(0, 14)
  const base = trimmed.slice(0, 12)
  const dv = trimmed.slice(12).replace(/\D/g, '')
  let out = base.slice(0, 2)
  if (base.length > 2) out += `.${base.slice(2, 5)}`
  if (base.length > 5) out += `.${base.slice(5, 8)}`
  if (base.length > 8) out += `/${base.slice(8, 12)}`
  if (dv) out += `-${dv}`
  return out
}

/**
 * Valida o formato (sem validar dígito verificador).
 * - CPF: 11 dígitos numéricos
 * - CNPJ: 14 caracteres — primeiros 12 podem ser A-Z ou 0-9, últimos 2 numéricos
 */
export function isValidDocumentFormat(raw: string): boolean {
  const s = sanitizeDocument(raw)
  if (s.length === 11) return /^\d{11}$/.test(s)
  if (s.length === 14) return /^[A-Z0-9]{12}\d{2}$/.test(s)
  return false
}
