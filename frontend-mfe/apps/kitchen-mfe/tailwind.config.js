/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
    // Include shared UI components
    '../../packages/shared-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kitchen brand colors
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Kitchen status colors
        kitchen: {
          pending: '#f59e0b',
          preparing: '#3b82f6',
          ready: '#10b981',
          completed: '#059669',
          urgent: '#ef4444',
        },
        // Station colors
        station: {
          grill: '#f97316',
          prep: '#10b981',
          salad: '#22c55e',
          dessert: '#a855f7',
          drinks: '#06b6d4',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-urgent': 'pulseUrgent 1s infinite',
        'timer-tick': 'timerTick 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseUrgent: {
          '0%, 100%': { 
            backgroundColor: 'rgb(239 68 68)',
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)'
          },
          '50%': { 
            backgroundColor: 'rgb(220 38 38)',
            boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)'
          },
        },
        timerTick: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};