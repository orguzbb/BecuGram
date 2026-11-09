/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #087F65)',
          dark: '#065F4C',
          light: '#0AA382',
        },
        mint: {
          DEFAULT: 'var(--color-mint, #35CBA0)',
          dark: '#2BA884',
          light: '#5CE1BC',
        },
        themeAccent: 'var(--becu-accent, #35CBA0)',
        accent: {
          lime: '#B9E66A',
          pink: '#F43F5E',
          magenta: '#EC4899',
          cyan: '#06B6D4',
          blue: '#0284C7',
        },
        bg: {
          dark: '#0B1311',
          'dark-subtle': '#101B18',
          light: '#F8FAF7',
        },
        surface: {
          dark: '#13211D',
          'dark-elevated': '#182B26',
          'dark-card': '#1E342E',
          light: '#FFFFFF',
          'light-elevated': '#F0F4F1',
        },
        border: {
          dark: '#233832',
          'dark-subtle': '#1B2C27',
          light: '#E2E8E0',
        },
        becutext: {
          primary: '#172923',
          secondary: '#84958D',
          'dark-primary': '#EDF4F1',
          'dark-secondary': '#8DA39A',
          'dark-muted': '#5D736A',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #06B6D4 0%, #EC4899 100%)',
        'button-gradient': 'linear-gradient(90deg, #0284C7 0%, #EC4899 100%)',
        'sent-bubble': 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      },
    },
  },
  plugins: [],
};

