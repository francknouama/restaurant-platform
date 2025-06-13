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
        // Reservations brand colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Reservation status colors
        reservation: {
          pending: '#f59e0b',
          confirmed: '#10b981',
          cancelled: '#ef4444',
          completed: '#6b7280',
          noshow: '#dc2626',
          waitlist: '#8b5cf6',
        },
        // Table status colors
        table: {
          available: '#10b981',
          occupied: '#ef4444',
          reserved: '#f59e0b',
          maintenance: '#6b7280',
          cleaning: '#06b6d4',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-urgent': 'pulseUrgent 2s infinite',
        'table-blink': 'tableBlink 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
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
        tableBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
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