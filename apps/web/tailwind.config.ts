import type { Config } from 'tailwindcss'

import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssAnimate],
}
export default config
