/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      container: { 
        center: true, 
        padding: '1rem', 
        screens: { xl: '1200px' } 
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: 'var(--pl-ink)',
        paper: 'var(--pl-paper)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        info: 'var(--color-info)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-error)',
        muted: 'var(--pl-muted)',
        border: 'var(--pl-border)',
        // FPL-specific colors
        'pl-purple': {
          900: 'var(--pl-purple-900)',
          700: 'var(--pl-purple-700)',
        },
        'pl-magenta': 'var(--pl-magenta)',
        'pl-neon': 'var(--pl-neon)',
        'pl-cyan': 'var(--pl-cyan)',
      },
      borderRadius: {
        md: '14px', 
        lg: '20px', 
        xl: '28px', 
        full: '9999px'
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
        focus: '0 0 0 3px rgba(0,255,133,.45)',
        'neon-glow': '0 0 20px rgba(0,255,133,0.3)',
        'magenta-glow': '0 0 20px rgba(233,0,82,0.3)',
      },
      fontFamily: {
        sans: ['Manrope', 'Poppins', 'Outfit', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Manrope', 'Poppins', 'Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['2rem', { lineHeight: '1.3', fontWeight: '700' }],
        'h2': ['1.5rem', { lineHeight: '1.4', fontWeight: '700' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-l': ['1.125rem', { lineHeight: '1.6', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'float-reverse': 'float-reverse 6s ease-in-out infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(0,255,133,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0,255,133,0.6)' },
        },
      },
      backgroundImage: {
        'gradient-hero': 'var(--grad-hero)',
        'gradient-accent': 'var(--grad-accent)',
        'gradient-purple': 'linear-gradient(135deg, var(--pl-purple-900) 0%, var(--pl-purple-700) 100%)',
        'gradient-neon': 'linear-gradient(90deg, var(--pl-neon), var(--pl-cyan))',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.container-responsive': {
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          '@screen xl': {
            padding: '0 1.5rem',
          },
        },
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.safe-area-top': {
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        },
        '.safe-area-bottom': {
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
        },
        '.h-screen-ios': {
          height: 'calc(var(--vh, 1vh) * 100)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} 