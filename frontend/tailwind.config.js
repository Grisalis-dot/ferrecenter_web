/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ferreRed: '#C4161C',
        ferreDark: '#2E2E2E',
        ferreLight: '#F3F3F3',
        ferreWhite: '#FFFFFF',
        ferreBlack: '#000000',
      }
    },
  },
  plugins: [],
}