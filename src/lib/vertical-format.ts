const VERTICAL_LABELS: Record<string, string> = {
  general: 'Geral',
  health: 'Saúde',
  legal: 'Direito',
  education: 'Educação',
  engineering: 'Engenharia',
  accounting: 'Contabilidade',
  environment: 'Meio Ambiente',
  safety: 'Segurança do Trabalho',
  technology: 'Tecnologia',
  nutrition: 'Nutrição',
  veterinary: 'Veterinária',
  forensics: 'Perícia',
  social_work: 'Serviço Social',
  agronomy: 'Agronomia',
}

export function formatVertical(vertical: string | undefined | null): string {
  if (!vertical) return 'Profissional'
  const key = vertical.toLowerCase()
  return VERTICAL_LABELS[key] ?? capitalize(key)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
