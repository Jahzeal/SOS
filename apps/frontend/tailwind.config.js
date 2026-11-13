const colors = require('tailwindcss/colors');

/**
 * NoxGuarda design tokens. See UI-GUIDE.md for how to use them.
 *
 * Accent  : teal   -> `accent-*`  (buttons, links, active states, focus)
 * Neutral : slate  -> `slate-*`   (text, borders, surfaces)
 * Success : emerald -> `success-*`
 * Warning : amber   -> `warning-*`
 * Danger  : rose    -> `danger-*`
 *
 * Tailwind's built-in colour names keep working, so older pages are unaffected.
 */

// Historic overrides kept so existing `rose-*` / `amber-*` classes render exactly as before.
const rose = { ...colors.rose, 50: '#fef2f2', 100: '#ffe4e6', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' };
const amber = { ...colors.amber, 50: '#fffbe6' };

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // App font. Codes (IMEI, serials, amounts in tables) use Tailwind's default `font-mono`.
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        // Brand wordmark only (Logo, BrandLogo, marketing Navbar).
        space: ['"Space Grotesk"', 'sans-serif'],
        // Marketing home page headline only.
        editorial: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        accent: colors.teal,
        success: colors.emerald,
        warning: amber,
        danger: rose,
        amber,
        rose,
      },
      borderRadius: {
        control: '10px', // buttons, inputs, selects, small chips
        card: '16px', // cards, panels, table containers
        modal: '20px', // dialogs and pop-up sheets
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
