// Page publique "À propos" — présente Finjaro à un public externe (clientes,
// partenaires, moteurs de recherche). AUCUN chiffre non vérifié, AUCUNE
// mention de stratégie interne (ciblage géographique, tarification,
// feuille de route) : uniquement ce que le produit fait réellement,
// aujourd'hui, vérifiable par n'importe qui en ouvrant l'app.
//
// Structure : { fr | en } -> { title, tagline, intro, sections[] }
// Chaque section : { title, body: string[] }

export const CONTACT_EMAIL = 'fin.finjaro@gmail.com';

const fr = {
  title: 'À propos de Finjaro',
  tagline: 'La marketplace intelligente — mode, beauté, parfum et décoration d’événement.',
  intro: [
    'Finjaro met en relation des boutiques vérifiées et des clientes, avec une assistante IA qui aide à trouver le bon article et à publier plus vite. L’objectif : rendre le shopping en ligne aussi simple et sûr que possible, pour les acheteuses comme pour les vendeuses.',
  ],
  sections: [
    {
      title: 'Une marketplace pensée pour la confiance',
      body: [
        'Chaque boutique passe par une vérification d’identité et de téléphone avant d’obtenir son badge vérifié. Les avis viennent uniquement de vraies clientes ayant reçu leur commande — jamais achetés, jamais fabriqués.',
        'Le paiement à la livraison reste le mode par défaut : la cliente règle à réception, sans avancer d’argent à l’aveugle.',
      ],
    },
    {
      title: 'Finia, l’assistante shopping IA',
      body: [
        'Finia comprend une recherche écrite, une photo ou même une phrase dictée à la voix, et propose de vrais articles disponibles sur la plateforme — pas des résultats génériques.',
        'Elle répond aussi aux questions sur une commande, une boutique, ou comment vendre sur Finjaro.',
      ],
    },
    {
      title: 'Miroir IA — essayer avant d’acheter',
      body: [
        'Pour certaines catégories (mode, coiffure, accessoires), Miroir IA génère un aperçu de l’article porté, à partir d’une photo — pour se projeter avant de commander.',
      ],
    },
    {
      title: 'Vendre sur Finjaro',
      body: [
        'Ouvrir une boutique prend quelques minutes. L’ajout en masse assisté par IA permet de publier un lot entier de photos d’un coup — Finia rédige les titres et descriptions, la vendeuse valide ou corrige.',
        'Chaque boutique dispose d’un tableau de bord avec ses commandes, ses statistiques et ses finances.',
      ],
    },
    {
      title: 'Une plateforme en construction, en toute transparence',
      body: [
        'Finjaro est une jeune plateforme, lancée en 2026, qui s’améliore chaque semaine à partir des retours réels de ses utilisatrices et vendeuses.',
      ],
    },
  ],
  contactLabel: 'Une question, un partenariat ?',
  contactCta: 'Écrire à l’équipe Finjaro',
};

const en = {
  title: 'About Finjaro',
  tagline: 'The smart marketplace — fashion, beauty, perfume and event decor.',
  intro: [
    'Finjaro connects verified shops with buyers, backed by an AI assistant that helps find the right item and helps sellers publish faster. The goal: make online shopping as simple and safe as possible, for buyers and sellers alike.',
  ],
  sections: [
    {
      title: 'A marketplace built on trust',
      body: [
        'Every shop goes through identity and phone verification before earning its verified badge. Reviews come only from real buyers who actually received their order — never bought, never faked.',
        'Cash on delivery remains the default: buyers pay on receipt, never blind.',
      ],
    },
    {
      title: 'Finia, the AI shopping assistant',
      body: [
        'Finia understands a written search, a photo, or even a spoken sentence, and surfaces real items actually available on the platform — not generic results.',
        'It also answers questions about an order, a shop, or how to start selling on Finjaro.',
      ],
    },
    {
      title: 'Mirror AI — try before you buy',
      body: [
        'For select categories (fashion, hair, accessories), Mirror AI generates a preview of the item worn, from a single photo — helping buyers picture it before ordering.',
      ],
    },
    {
      title: 'Selling on Finjaro',
      body: [
        'Opening a shop takes minutes. AI-assisted bulk publishing lets a seller upload a whole batch of photos at once — Finia drafts the titles and descriptions, the seller reviews and confirms.',
        'Every shop gets a dashboard with orders, stats and finances.',
      ],
    },
    {
      title: 'A platform built in the open',
      body: [
        'Finjaro is a young platform, launched in 2026, improving every week based on real feedback from its buyers and sellers.',
      ],
    },
  ],
  contactLabel: 'Questions or partnerships?',
  contactCta: 'Write to the Finjaro team',
};

export function aboutFor(language) {
  return language?.startsWith('en') ? en : fr;
}
