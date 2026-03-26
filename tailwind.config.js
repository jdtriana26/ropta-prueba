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
          50:  '#f0faf4',
          100: '#d6f0e0',
          200: '#a8dfc0',
          300: '#6cc99a',
          400: '#2d9e68',   // ← color principal
          500: '#1f7d50',   // ← hover
          600: '#166040',
          700: '#0f4730',
          800: '#093021',
          900: '#041a12',
        },
        accent: {
          400: '#ffb340',   // amarillo vibrante
          500: '#f59e0b',
        }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}