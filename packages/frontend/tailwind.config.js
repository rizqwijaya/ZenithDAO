/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zenith: {
          50: '#eef0ff',
          100: '#e0e3ff',
          200: '#c7ccff',
          300: '#a5a9ff',
          400: '#8b85fc',
          500: '#6d5efc',
          600: '#5b3df2',
          700: '#4d2fd6',
          800: '#3f29ac',
          900: '#362888',
          950: '#211650',
        },
        ink: {
          900: '#0a0a14',
          800: '#10101f',
          700: '#181830',
          600: '#22223f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(109, 94, 252, 0.45)',
      },
      backgroundImage: {
        'zenith-grad': 'linear-gradient(135deg, #6d5efc 0%, #8b5cf6 50%, #ec4899 100%)',
      },
    },
  },
  plugins: [],
};
