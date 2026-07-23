import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--bk-accent)',
        'accent-soft': 'var(--bk-accent-soft)',
        'on-accent': 'var(--bk-on-accent)',
        'green-deep': 'var(--bk-green-deep)',
        amber: 'var(--bk-amber)',
        teal: 'var(--bk-teal)',
        bg: 'var(--bk-bg)',
        surface: 'var(--bk-surface)',
        'surface-2': 'var(--bk-surface-2)',
        ink: 'var(--bk-text)',
        muted: 'var(--bk-muted)',
        line: 'var(--bk-line)',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
        lg: '18px',
        xl: '24px',
        '2xl': '30px',
      },
      boxShadow: {
        sm: '0 2px 12px rgba(20,18,16,.06)',
        DEFAULT: '0 14px 38px rgba(20,18,16,.10)',
        lg: '0 34px 80px rgba(20,18,16,.13)',
      },
      maxWidth: {
        wrap: '1280px',
      },
    },
  },
  plugins: [],
} satisfies Config;
