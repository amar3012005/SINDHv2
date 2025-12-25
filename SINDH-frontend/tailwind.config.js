const { colors, typography, spacing, borderRadius, shadows } = require('./src/styles/designTokens');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New LinkedIn-inspired design system
        ...colors,
        // Keep existing SINDH colors for backward compatibility
        'cream': '#E8DFD5',
        'peach': '#DBBBA7',
        'burning-orange': '#FF7124',
        'orange-dark': '#e66420',
        'blue-estate': '#3B4883',
        'wahoo': '#272D4E',
        'noble-black': '#202124',
        'sindh': {
          orange: '#FF7124',
          'orange-light': '#FF8F4D',
          'orange-dark': '#e66420',
          blue: '#3B4883',
          'blue-dark': '#272D4E',
          cream: '#E8DFD5',
          peach: '#DBBBA7',
          black: '#202124'
        }
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      spacing,
      borderRadius,
      boxShadow: {
        ...shadows,
        // Keep existing shadows
        'orange': '0 6px 24px rgba(255, 113, 36, 0.25)',
        'orange-lg': '0 8px 32px rgba(255, 113, 36, 0.3)',
        'blue': '0 6px 24px rgba(59, 72, 131, 0.25)',
        'blue-lg': '0 8px 32px rgba(59, 72, 131, 0.3)',
        'soft': '0 4px 20px rgba(59, 72, 131, 0.08)',
        'soft-lg': '0 8px 32px rgba(59, 72, 131, 0.12)'
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      },
      animation: {
        'pulse': 'pulse 1.5s ease-in-out infinite',
        'slideIn': 'slideIn 0.5s ease-out forwards',
        'slideUp': 'slideUp 0.3s ease-out forwards',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'blob': 'blob 7s infinite',
        'scale-in': 'scaleIn 0.4s ease-out',
        'gradient-shift': 'gradientShift 8s ease infinite'
      },
      screens: {
        'xs': '375px',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

