const colors = require('tailwindcss/colors')

module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#5B2EFF', // Royal Purple
          600: '#4c26d9',
          900: '#1e0e5c',
        },
        navy: {
          900: '#0F172A', // Deep Navy
          950: '#080E1E',
        },
        violet: {
          600: '#7C3AED', // Accent Violet
        },
        secondary: {
          500: '#39FF14', // Electric Green
        },
        success: '#39FF14', // Semantic Mapping
        obsidian: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          300: '#B1B7C1', // Brightened Silver for better contrast
          700: '#1E1E22',
          800: '#111113', 
          900: '#0A0A0B', 
          950: '#18181B', 
        },
        background: '#0A0A0B', 
        card: '#18181B',
        silver: '#C0C0C0', // Metallic Silver
        border: 'rgba(255,255,255,0.08)',
      },
      borderRadius: {
        'btn': '12px',
        'input': '12px',
        'card': '24px', 
        'pill': '9999px',
      },
      blur: {
        '3xl': '30px',
      }
    },
  },
  plugins: [],
}
