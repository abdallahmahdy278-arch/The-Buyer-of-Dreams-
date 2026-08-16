/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F5',
        ink: '#1C1917',
        bordeaux: '#800000',
        gold: '#D4AF37',
      },
      fontFamily: {
        amiri: ['Amiri', 'serif'],
        ruqaa: ['Aref Ruqaa', 'serif'],
        tajawal: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};