module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      animation: {
        'pulse': 'pulse 1.5s ease-in-out infinite',
        'slideIn': 'slideIn 0.5s ease-out forwards'
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}

