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
        // LEGION — sa propre peau, sombre et or.
        //
        // Beau, 22/09, en envoyant sa maquette préférée: « ceci c'est
        // vraiment ma pépite visuellement ». Puis: « mets les couleurs
        // comme le truc de Gemini que je t'ai envoyé ».
        //
        // Ce ne sont pas des couleurs inventées: c'est son LOGO Legion —
        // bleu nuit, laiton, un filet de turquoise. Comme « Mon argent »,
        // Legion est une application à part et ne se mélange pas avec le
        // crème et la terracotta de la place de marché. Le laiton
        // (#E3A857) est le seul pont entre les deux, volontairement.
        // Depuis le 25/09 (Beau : « deux palettes, la sombre et le blanc de Finjaro, il doit
        // pouvoir choisir »), ces couleurs sont des variables posées dans global.css sur
        // `.legion-app` : la palette sombre (ci-dessous, en commentaire) ou la palette claire
        // (crème, terracotta, laiton) quand <html data-leo="clair">. Le format rgb(… / alpha)
        // garde les opacités (bg-legion-gold/20).
        legion: {
          bg: 'rgb(var(--leo-bg) / <alpha-value>)', // #0B1120, le fond bleu nuit
          panel: 'rgb(var(--leo-panel) / <alpha-value>)', // #121A2B, le rail et les colonnes
          card: 'rgb(var(--leo-card) / <alpha-value>)', // #1A2337, une carte posée dessus
          'card-haut': 'rgb(var(--leo-card-haut) / <alpha-value>)', // #222D45, au survol
          line: 'rgb(var(--leo-line) / <alpha-value>)', // #2A3550, les traits
          ink: 'rgb(var(--leo-ink) / <alpha-value>)', // #EDF1F8, texte principal
          muted: 'rgb(var(--leo-muted) / <alpha-value>)', // #93A1B8, texte secondaire
          gold: 'rgb(var(--leo-gold) / <alpha-value>)', // #E3A857, le laiton du logo
          'gold-soft': 'rgb(var(--leo-gold-soft) / <alpha-value>)', // #F2C98A
          teal: 'rgb(var(--leo-teal) / <alpha-value>)', // #5FC8C0, le turquoise du logo
          accent: 'rgb(var(--leo-accent) / <alpha-value>)', // #C25E38, la terracotta, pour MES bulles
          success: 'rgb(var(--leo-success) / <alpha-value>)', // #34D399
          danger: 'rgb(var(--leo-danger) / <alpha-value>)', // #FB7185
        },
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
