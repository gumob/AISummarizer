/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/**/*.html'],
  darkMode: 'media',
  theme: {
    extend: {
      fontSize: {
        xs: '0.5rem !important', // 8px
        sm: '0.625rem !important', // 10px
        base: '0.75rem !important', // 12px
        lg: '0.875rem !important', // 14px
        xl: '1rem !important', // 16px
        '2xl': '1.125rem !important', // 18px
        '3xl': '1.5rem !important', // 24px
        '4xl': '2rem !important', // 32px
        '5xl': '2.5rem !important', // 40px
        '6xl': '3rem !important', // 48px
        '7xl': '3.5rem !important', // 56px
        '8xl': '4rem !important', // 64px
        '9xl': '4.5rem !important', // 72px
      },
    },
  },
  plugins: [],
};
