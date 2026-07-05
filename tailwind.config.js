/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6366f1',
          hover: '#818cf8'
        }
      }
    }
  },
  plugins: []
}
