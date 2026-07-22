/** Finjaro — "Lagune & Encre" design system (locked values). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './landing/**/*.{js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        base: '#FFFFFF',
        ink: '#1A1A1A', // text primary
        muted: '#6B6B6B', // text secondary
        teal: {
          DEFAULT: '#0F4C4C', // primary accent
          hover: '#0C3D3D', // hover/active
        },
        brass: '#B8935F', // secondary accent
        hairline: '#E5E5E5', // dividers
        danger: { DEFAULT: '#D14343', bg: '#FDEDED' },
        success: { DEFAULT: '#2E7D32', bg: '#EAF6EA' },
        warning: { DEFAULT: '#B8860B', bg: '#FDF6E3' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        title: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        section: ['18px', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
      },
      borderRadius: {
        input: '8px',
        card: '12px',
        pill: '24px',
      },
      transitionDuration: {
        DEFAULT: '175ms',
      },
      maxWidth: {
        app: '480px', // mobile-first app shell width
      },
    },
  },
  plugins: [],
};
