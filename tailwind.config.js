/** @type {import('tailwindcss').Config} */
// Build-time Tailwind config. Replaces the runtime `cdn.tailwindcss.com` Play CDN
// (which shipped huge JS and compiled CSS in the browser). Theme below mirrors the
// old inline `tailwind.config` from index.html 1:1 so all existing classes work.
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './MainApp.tsx',
    './types.ts',
    './components/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0855f8', // Main Brand Color
          700: '#0645d0', // Hover state
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Secondary accent color
        gold: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0855f8',
          700: '#0645d0',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-in-up': 'fade-in-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
