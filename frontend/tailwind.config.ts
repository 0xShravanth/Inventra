// frontend/tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0B',
        surface: '#1A1A1F',
        panel: '#111113',
        primary: {
          DEFAULT: '#6366F1',
          foreground: '#FFFFFF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#F43F5E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
      animation: {
        'count-up': 'countUp 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        island:
          '0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)',
        'island-inner': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      padding: {
        safe: 'max(1.5rem, env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
}

export default config
