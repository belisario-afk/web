import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        opel: {
          yellow: '#FFDD00',
          chrome: '#C0C0C0',
          neon: '#00E5FF',
          dark: '#0A0F14'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      screens: {
        // Target Samsung Galaxy Tab SMT77U (2560x1600). Tailwind uses width, but we optimize layout breakpoints.
        'sm-tablet': '1280px',
        'lg-tablet': '1600px'
      }
    }
  },
  plugins: []
} satisfies Config