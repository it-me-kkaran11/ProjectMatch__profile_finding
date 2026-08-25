/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c8',
          400: '#8590a8',
          500: '#67738d',
          600: '#525c73',
          700: '#434b5e',
          800: '#3a4050',
          900: '#1f2433',
          950: '#13161f',
        },
        brand: {
          50: '#eefcf5',
          100: '#d5f8e6',
          200: '#aef0cd',
          300: '#79e3ae',
          400: '#3fce89',
          500: '#16b36a',
          600: '#099157',
          700: '#08764a',
          800: '#0a5e3c',
          900: '#0a4e33',
          950: '#022c1c',
        },
        accent: {
          50: '#fff8eb',
          100: '#feebc6',
          200: '#fdd789',
          300: '#fbbd4d',
          400: '#f9a324',
          500: '#f0840b',
          600: '#d56906',
          700: '#b04d08',
          800: '#8f3d0e',
          900: '#74330f',
          950: '#431a04',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 8px 24px -6px rgba(16, 24, 40, 0.12), 0 2px 6px rgba(16, 24, 40, 0.06)',
        glow: '0 0 0 4px rgba(22, 179, 106, 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-up': 'slide-up 0.5s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
