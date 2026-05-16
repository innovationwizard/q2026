import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orion: {
          bg:      '#060B14',
          surface: '#121A28',
        },
        ev26: {
          purple: '#6A0DAD',
          cyan:   '#00E5FF',
        },
        ui: {
          cta:       '#E60000',
          textMain:  '#F9FAFB',
          textMuted: '#8B949E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
