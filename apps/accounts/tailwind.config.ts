import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        accent: 'rgb(124 58 237)',
        background: '#000',
        'text-secondary': 'rgba(255,255,255,0.6)',
        error: 'rgb(239 68 68)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
