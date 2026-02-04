/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f9fafb', // Gray 50 (Light)
        surface: '#ffffff', // White
        primary: '#7c3aed', // Violet 600
        'primary-hover': '#6d28d9', // Violet 700
        secondary: '#4b5563', // Gray 600
        'text-main': '#111827', // Gray 900
        'text-muted': '#6b7280', // Gray 500
        'nav-bg': '#1f2937', // Gray 800 (Top Bar)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
