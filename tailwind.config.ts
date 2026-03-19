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
          primary: '#4F46E5',
          accent: '#7C3AED',
          danger: '#DC2626',
          warning: '#D97706',
          success: '#059669',
          text: '#111827',
          muted: '#6B7280',
          surface: '#F9FAFB',
          border: '#E5E7EB',
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
        card: '0 1px 3px rgba(0,0,0,0.08)',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
