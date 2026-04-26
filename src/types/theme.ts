export interface PaletteChrome {
  primary: string
  secondary: string
  surface: string
  border: string
  headerText: string
}

export interface ThemePalette {
  id: string
  name: string
  description: string
  colors: readonly string[]
  chrome: PaletteChrome
}
