/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nlo: {
          navy: '#0F2942',
          navyDark: '#091929',
          slateHeader: '#1B4F72',
          ice: '#D6E4F0',
          green: '#008751',
          greenDark: '#006B3F',
          crimson: '#E11D48',
          amber: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};

