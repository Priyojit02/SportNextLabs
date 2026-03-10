/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tennis-green': '#2d5a27',
        'tennis-brown': '#8B4513',
        'court-clay': '#D2691E',
      }
    },
  },
  plugins: [],
}
