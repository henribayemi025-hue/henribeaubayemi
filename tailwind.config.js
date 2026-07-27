/** Finjaro — "Terre & Or" design system (locked values). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './landing/**/*.{js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        base: '#FAF6F0', // warm cream page background
        ink: '#171B26', // text primary
        'ink-soft': '#232B3E', // secondary ink shade, used in gradients
        muted: '#6B6B6B', // text secondary
        teal: {
          DEFAULT: '#C25E38', // primary accent (terracotta)
          hover: '#D95D39', // hover/active
          light: '#F4EFE6', // light tint background (badges, selected rows)
        },
        brass: '#E09F3E', // secondary accent (gold)
        hairline: '#E8DFD1', // dividers
        danger: { DEFAULT: '#D14343', bg: '#FDEDED' },
        success: { DEFAULT: '#2A9D8F', bg: '#EAF6EA' },
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
