/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep trustworthy primary blue
        primary: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#bae0ff',
          300: '#7cc2ff',
          400: '#389eff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#1e40af',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        // Slate gray secondary
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Emerald green for verification success
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Amber warning
        amber: {
          50: '#fffbe6',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Soft red danger
        rose: {
          50: '#fef2f2',
          100: '#ffe4e6',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      borderRadius: {
        'card': '14px',
        'button': '10px',
        'input': '10px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)',
        'card': '0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
