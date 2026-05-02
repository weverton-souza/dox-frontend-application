export interface RespondentColor {
  name: string
  dot: string
  bg: string
  text: string
  border: string
  ring: string
  light: string
}

export const RESPONDENT_COLORS: RespondentColor[] = [
  { name: 'Azul', dot: 'bg-blue-500', bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500', ring: 'ring-blue-500', light: 'bg-blue-50' },
  { name: 'Rosa', dot: 'bg-rose-500', bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-500', ring: 'ring-rose-500', light: 'bg-rose-50' },
  { name: 'Verde', dot: 'bg-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-500', ring: 'ring-emerald-500', light: 'bg-emerald-50' },
  { name: 'Âmbar', dot: 'bg-amber-500', bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-500', ring: 'ring-amber-500', light: 'bg-amber-50' },
  { name: 'Roxo', dot: 'bg-violet-500', bg: 'bg-violet-500', text: 'text-violet-700', border: 'border-violet-500', ring: 'ring-violet-500', light: 'bg-violet-50' },
  { name: 'Teal', dot: 'bg-teal-500', bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-500', ring: 'ring-teal-500', light: 'bg-teal-50' },
  { name: 'Laranja', dot: 'bg-orange-500', bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500', ring: 'ring-orange-500', light: 'bg-orange-50' },
  { name: 'Índigo', dot: 'bg-indigo-500', bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-500', ring: 'ring-indigo-500', light: 'bg-indigo-50' },
]

export function colorForIndex(index: number): RespondentColor {
  return RESPONDENT_COLORS[index % RESPONDENT_COLORS.length]
}
