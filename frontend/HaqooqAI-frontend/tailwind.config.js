/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui"],
        display: ["Plus Jakarta Sans", "Inter", "ui-sans-serif"],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#7c3aed',
          600: '#7c3aed',
          700: '#6d28d9',
          DEFAULT: '#7F3DFF',
          light: '#A685FF',
          dark: '#4B1EFF',
        },
        accent: {
          DEFAULT: '#00E6D0',
          light: '#5FFFE1',
          dark: '#00BFAE',
        },
        glass: 'rgba(255,255,255,0.85)',
        glassDark: 'rgba(34,34,54,0.7)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        neon: '0 0 8px #7F3DFF, 0 0 24px #00E6D0',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(120deg, #7F3DFF 0%, #00E6D0 100%)',
        'bubble-gradient': 'linear-gradient(90deg, #A685FF 0%, #5FFFE1 100%)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        bounceX: 'bounceX 1s infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        bounceX: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
    },
  },
  plugins: [],
};