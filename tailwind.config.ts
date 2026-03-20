import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          primary:   '#7308E3',
          dark:      '#5A06B5',
          deep:      '#3D0488',
          light:     '#EDE8FD',
          xlight:    '#F6F3FF',
          haiti:     '#1A0A2B',
          haiti2:    '#251540',
          haiti3:    '#3B2260',
          border:    '#EDE8FD',
          border2:   '#D9D0F8',
          text:      '#1A0A2B',
          text2:     '#6B5E8B',
          text3:     '#9E94BC',
          danger:    '#E53030',
          warning:   '#D97706',
          success:   '#059669',
        },
        navy: {
          DEFAULT: '#0F1128',
          card:    '#1A1F3A',
          border:  '#2D3561',
          deep:    '#080A1A',
          hover:   '#1E2952',
        },
        indigo: {
          accent: '#4F46E5',
          light:  '#6366F1',
          dark:   '#3730A3',
        },
        cyan: {
          chart: '#22D3EE',
        },
        magenta: {
          chart: '#D946EF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        element: '8px',
        pill: '20px',
      },
      boxShadow: {
        card:      '0 1px 4px rgba(115,8,227,0.06)',
        'card-md': '0 4px 16px rgba(115,8,227,0.10)',
        glow:      '0 0 8px rgba(115,8,227,0.8)',
        'navy-lg': '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
