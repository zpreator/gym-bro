import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // primary accent — effort/intensity
        ember: {
          50: '#FBEDE9',
          100: '#F5D3C7',
          200: '#E9AC96',
          300: '#DC8365',
          400: '#CE5F3B',
          500: '#B8451F',
          600: '#953619',
          700: '#732913',
          800: '#521C0D',
          900: '#361208',
        },
        // secondary accent — progress/PR energy
        moss: {
          50: '#EAF0EA',
          100: '#CBDBC9',
          200: '#A3C09F',
          300: '#77A170',
          400: '#54844C',
          500: '#3A6733',
          600: '#2F5329',
          700: '#254120',
          800: '#1B2F17',
          900: '#121F0F',
        },
        // semantic — DNF / missed
        rust: {
          50: '#F6EBE8',
          100: '#EACFC7',
          200: '#D8A897',
          300: '#C37D64',
          400: '#AF5B3D',
          500: '#984526',
          600: '#7C381F',
          700: '#602B18',
          800: '#451E11',
          900: '#2E140B',
        },
        // warm neutrals
        stone: {
          50: '#FAF9F6',
          100: '#F0EDE6',
          200: '#DFD9CC',
          300: '#C7BEA9',
          400: '#A79C81',
          500: '#8A7F65',
          600: '#6C6350',
          700: '#524B3D',
          800: '#39342B',
          900: '#25221C',
        },
        ink: {
          50: '#F2F1EE',
          100: '#E1DFD6',
          200: '#C0BCA8',
          300: '#948D74',
          400: '#635C48',
          500: '#3E3928',
          600: '#302C1F',
          700: '#26221A',
          800: '#1A1712',
          900: '#100E0B',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
