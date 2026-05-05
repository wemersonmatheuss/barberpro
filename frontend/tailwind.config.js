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
        base: '#0A0A0B',
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        tertiary: '#71717A',
        bg: {
          base: '#0A0A0B',
          surface: '#111113',
          elevated: '#18181B',
        },
        brand: {
          DEFAULT: '#22D3EE',
          light: '#67E8F9',
          dark: '#06B6D4',
          muted: 'rgba(34, 211, 238, 0.14)',
          subtle: 'rgba(34, 211, 238, 0.07)',
        },
        surface: {
          base: '#0A0A0B',
          primary: '#111113',
          elevated: '#18181B',
          overlay: '#1F1F23',
          subtle: '#27272B',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
          default: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.14)',
          brand: 'rgba(34, 211, 238, 0.35)',
        },
        content: {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
          disabled: '#3F3F46',
          brand: '#22D3EE',
          inverse: '#0A0A0B',
        },
        status: {
          pending: '#FBBF24',
          confirmed: '#60A5FA',
          completed: '#34D399',
          cancelled: '#F87171',
          rescheduled: '#A78BFA',
        },
      },

      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Cormorant Garamond', 'serif'],
        poppins: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },

      animation: {
        'fade-in': 'fadeIn 250ms ease forwards',
        'slide-up': 'slideUp 400ms ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },

      boxShadow: {
        'brand-sm': '0 0 0 1px rgba(34, 211, 238, 0.45)',
        brand: '0 0 0 2px rgba(34, 211, 238, 0.45)',
        elevated: '0 4px 24px rgba(0, 0, 0, 0.4)',
        overlay: '0 8px 40px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
