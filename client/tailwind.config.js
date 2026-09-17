/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F19',
        card: '#111827',
        'card-hover': '#161F33',
        border: 'rgba(31, 41, 55, 0.8)',
        accent: {
          cyan: '#06B6D4',
          emerald: '#10B981',
          fuchsia: '#A855F7',
          indigo: '#6366F1',
          amber: '#F59E0B',
          rose: '#F43F5E',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -3px rgba(6, 182, 212, 0.35)',
        'glow-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
        'glow-fuchsia': '0 0 25px -3px rgba(168, 85, 247, 0.35)',
        'glow-indigo': '0 0 25px -3px rgba(99, 102, 241, 0.35)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
