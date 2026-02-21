/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#D4AF37',
          500: '#C5A028',
          600: '#AA8820',
        },
        midnight: {
          900: '#0a0a0a',
          800: '#1a1a1a',
        },
        cream: {
            50: '#F9F9F9', // Very light grey/white
            100: '#F5F5F0', // Slight beige tint
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        erupha: ['"The Erupha"', 'serif'],
        chinese: ['"Noto Serif SC"', 'sans-serif'], // Simplified
        chinese_traditional: ['"Noto Serif TC"', 'sans-serif'], // Traditional
        japanese: ['"Noto Sans JP"', 'sans-serif'], // Updated!
        korean: ['"Noto Sans KR"', 'sans-serif'], // Updated!
        },
    },
  },
  plugins: [
     require('@tailwindcss/typography'), // Ensure you have this for the blog content
  ],
}