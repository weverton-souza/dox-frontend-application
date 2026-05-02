export interface RespondentColor {
  name: string
  primary: string
  cellTint: string
}

const TINT_ALPHA = '14'

function makeColor(name: string, primary: string): RespondentColor {
  return { name, primary, cellTint: `${primary}${TINT_ALPHA}` }
}

export const RESPONDENT_COLORS: RespondentColor[] = [
  makeColor('Azul', '#708EA8'),
  makeColor('Verde', '#7A9978'),
  makeColor('Teal', '#6E9692'),
  makeColor('Mauve', '#8E7A92'),
]

export function colorForIndex(index: number): RespondentColor {
  return RESPONDENT_COLORS[index % RESPONDENT_COLORS.length]
}
