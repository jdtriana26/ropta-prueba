/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF2FF',
          100: '#C7D2FE',
          200: '#A5B4FC',
          300: '#6B8DE8',
          400: '#1A3A8F',
          500: '#152E72',
          600: '#0F2258',
          700: '#0A173D',
          800: '#050D22',
          900: '#020610',
        },
        accent: {
          50:  '#FFF0F0',
          100: '#FFD6D6',
          400: '#E31E24',
          500: '#B31A1F',
        },
        highlight: {
          400: '#FFCC00',
          500: '#E6B800',
        }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}