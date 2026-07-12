import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Primary brand — electric indigo, used for CTAs, links, highlights
        brand: {
          50: '#eef1ff',
          100: '#e0e5ff',
          200: '#c6cfff',
          300: '#a3b0ff',
          400: '#7c87fb',
          500: '#5b5bf0', // primary
          600: '#4a40e0',
          700: '#3d31c2',
          800: '#332b9d',
          900: '#2c287d',
          950: '#1a1648',
        },
        // Secondary accent — vivid cyan/teal, for gradients & glows
        accent: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        // Meditations accent — warm amber/gold
        ink: {
          400: '#f4b740',
          500: '#e89c1c',
          600: '#c97f0a',
        },
        // Warm neutral surfaces (slightly warm, not pure blue-gray)
        surface: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#0b0b0e',
        },
      },
      fontFamily: {
        display: ['Sora', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Hiragino Sans', ...defaultTheme.fontFamily.sans],
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Hiragino Sans', 'Noto Sans JP', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        '7xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        '9xl': ['8rem', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(17,17,27,0.04), 0 4px 16px -4px rgba(17,17,27,0.08)',
        'card-hover': '0 2px 6px 0 rgba(17,17,27,0.06), 0 16px 40px -8px rgba(17,17,27,0.16)',
        glow: '0 0 0 1px rgba(91,91,240,0.4), 0 0 24px -4px rgba(91,91,240,0.5)',
        'glow-accent': '0 0 32px -6px rgba(45,212,191,0.45)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #5b5bf0 0%, #7c87fb 50%, #2dd4bf 100%)',
        'grid-faint':
          'linear-gradient(to right, rgba(120,120,140,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,140,0.08) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s var(--tw-ease, ease-out) forwards',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};
