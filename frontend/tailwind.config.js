const colors = require('tailwindcss/colors')

module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981', // green
          600: '#059669',
          900: '#064e3b', // navy/dark green
        },
        navy: '#0f172a',
      }
    },
  },
  plugins: [],
}
