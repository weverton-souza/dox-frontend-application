/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      fontSize: {
        'fluid-xs':   ['var(--font-size-xs)',   { lineHeight: '1.4' }],
        'fluid-sm':   ['var(--font-size-sm)',   { lineHeight: '1.45' }],
        'fluid-base': ['var(--font-size-base)', { lineHeight: '1.5' }],
        'fluid-lg':   ['var(--font-size-lg)',   { lineHeight: '1.4' }],
        'fluid-xl':   ['var(--font-size-xl)',   { lineHeight: '1.35' }],
        'fluid-2xl':  ['var(--font-size-2xl)',  { lineHeight: '1.3' }],
        'fluid-3xl':  ['var(--font-size-3xl)',  { lineHeight: '1.2' }],
      },
      spacing: {
        'page':    'var(--page-padding-x)',
        'page-y':  'var(--page-padding-y)',
        'content': 'var(--content-gap)',
        'section': 'var(--section-gap)',
        'card':    'var(--card-padding)',
      },
      maxWidth: {
        'page': 'var(--page-max-width)',
        '8xl': '88rem',
        '9xl': '108rem',
      },
      colors: {
        /* Cinzas quentes Apple — sobrescreve o gray padrão do Tailwind */
        gray: {
          50:  'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        /* Azul Apple — paleta da marca */
        brand: {
          50:  'var(--color-blue-50)',
          100: 'var(--color-blue-100)',
          200: 'var(--color-blue-200)',
          300: 'var(--color-blue-300)',
          400: 'var(--color-blue-400)',
          500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)',
          700: 'var(--color-blue-700)',
          800: 'var(--color-blue-800)',
          900: 'var(--color-blue-900)',
        },
        /* Aliases semânticos */
        surface: {
          DEFAULT: 'var(--color-surface)',
          card: 'var(--color-surface-card)',
          hover: 'var(--color-surface-hover)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      boxShadow: {
        xs:       'var(--shadow-xs)',
        sm:       'var(--shadow-sm)',
        md:       'var(--shadow-md)',
        lg:       'var(--shadow-lg)',
        xl:       'var(--shadow-xl)',
        card:     'var(--shadow-card)',
        dropdown: 'var(--shadow-dropdown)',
        modal:    'var(--shadow-modal)',
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
      },
    },
  },
  plugins: [],
}
