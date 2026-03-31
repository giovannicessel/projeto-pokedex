/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'card-light':
          '0 10px 32px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'card-hover':
          '0 20px 50px rgba(0, 0, 0, 0.35), 0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'card-hover-light':
          '0 18px 44px rgba(15, 23, 42, 0.14), 0 6px 16px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
      },
    },
  },
  plugins: [],
}
