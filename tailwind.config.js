/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'sm:card-gradient',
    'sm:card-gradient-3767',
    'sm:card-gradient-7598',
    'sm:card-gradient-5560',
  ],
  theme: {
    extend: {
      colors: {
        "baywatch-orange": "#FF6B00",
        "baywatch-dark": "#1A1A1A",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
}
