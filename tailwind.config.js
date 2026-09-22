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
        // « Mon argent » — une application À PART, avec ses propres couleurs.
        //
        // Ce ne sont pas des couleurs inventées: ce sont celles des captures
        // du tout premier Finjaro que Beau a envoyées le 22/09. Noir, violet,
        // et les pastilles de comptes qui sont DÉJÀ en base (`accounts.color`:
        // #6366F1, #38BDF8, #34D399, #F5B544, #8B5CF6, #FB7185).
        //
        // Elles ne se mélangent pas avec « Terre & Or » ci-dessus: la place de
        // marché est crème et terracotta, celle-ci est sombre et violette. Les
        // confondre est exactement l'erreur que j'ai faite la première fois.
        money: {
          bg: '#0B0B0F', // fond de page, presque noir
          card: '#17171C', // une carte posée dessus
          line: '#26262E', // les traits
          ink: '#F5F5F7', // texte principal
          muted: '#8A8A93', // texte secondaire
          accent: '#7C5CFC', // le violet
          'accent-soft': '#8B5CF6', // l'autre bout du dégradé
          gold: '#F5B544',
          danger: '#FB7185',
          success: '#34D399',
        },
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
