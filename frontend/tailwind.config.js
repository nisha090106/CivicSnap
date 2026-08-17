/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pista: {
          50: '#F7FCF5',
          100: '#F3FAF0',  // Card surface
          200: '#E8F5E1',  // Main page background
          300: '#DCEFD4',  // Badge / accent background
          400: '#CBE5C0',  // Soft border
          500: '#B6DBA8',
          DEFAULT: '#E8F5E1',
        },
        bottle: {
          50: '#E6F4EC',
          100: '#C8E8D6',
          200: '#95D1B0',
          500: '#1D7043',
          600: '#145C36',  // Hover shade
          700: '#0E492B',  // Container hover
          800: '#0B3D24',  // Primary dark green (buttons, icons)
          900: '#072818',  // Navbar dark green background
          950: '#041B10',  // Deepest dark green accent
          DEFAULT: '#0B3D24',
        }
      }
    },
  },
  plugins: [],
}
