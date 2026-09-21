// Les boutiques de la démonstration — inventées, et assumées comme telles.
//
// Beau, 18/09: « dis boutiques fictives de 3 ou 5 domaines d'activité, qu'en
// démo on peut acheter et ensuite regarder le processus d'achat et passer en
// écriture et extraire les rapports ».
//
// Deux règles qui ont dicté ce fichier:
//
// 1. RIEN NE TOUCHE LA BASE. Pas un appel à Supabase, pas une ligne écrite,
//    pas une boutique fictive qui remonterait dans une vraie recherche. Tout
//    vit ici et dans l'état React de l'écran. Une démonstration qui salit le
//    catalogue réel coûterait plus qu'elle ne rapporte.
//
// 2. Les photos viennent de `public/demo-products`, les visuels de
//    démonstration qu'on possède déjà. CLAUDE.md interdit toute photo prise
//    ailleurs, et une boutique inventée n'a pas le droit d'emprunter les
//    photos d'une vraie vendeuse.
//
// Les prix sont en FCFA parce que c'est l'unité de STOCKAGE de la base
// (`price_fcfa`). Ce n'est jamais ce qu'on affiche: l'acheteuse voit SA
// monnaie, la vendeuse voit celle de SA boutique. La démo montre justement
// ces deux points de vue côte à côte — c'est le §2 de CLAUDE.md, rendu
// visible plutôt qu'expliqué.
//
// `pays` est volontairement différent d'une boutique à l'autre: c'est ce qui
// permet de montrer qu'une vendeuse à Paris relit ses prix en euros pendant
// qu'une cliente à Douala voit des FCFA, sur la même commande.

/**
 * `metierComptable` pointe vers le métier correspondant dans la démonstration
 * de Finjaro Accounting (retail, food, beauty, garage, services, health, tech,
 * trade). C'est ce qui fait que le parcours CONTINUE d'une application à
 * l'autre au lieu de recommencer à zéro.
 */
export const BOUTIQUES_DEMO = [
  {
    id: 'mode',
    nom: 'Atelier Sika',
    metier: 'Mode & prêt-à-porter',
    metierComptable: 'retail',
    ville: 'Douala',
    pays: 'CM',
    paysNom: 'Cameroun',
    banniere: '/demo-products/wd-01.jpg',
    articles: [
      { id: 'm1', nom: 'Robe longue en wax', prixFcfa: 28000, photo: '/demo-products/robe-01.jpg', stock: 6 },
      { id: 'm2', nom: 'Chemise dashiki', prixFcfa: 18000, photo: '/demo-products/dashiki-01.jpg', stock: 11 },
      { id: 'm3', nom: 'Blazer structuré', prixFcfa: 42000, photo: '/demo-products/blazer-01.jpg', stock: 3 },
      { id: 'm4', nom: 'Ensemble deux pièces', prixFcfa: 35000, photo: '/demo-products/wd-03.jpg', stock: 5 },
    ],
  },
  {
    id: 'beaute',
    nom: 'Maison Nala',
    metier: 'Beauté & coiffure',
    metierComptable: 'beauty',
    ville: 'Paris',
    pays: 'FR',
    paysNom: 'France',
    banniere: '/demo-products/hb-02.jpg',
    articles: [
      { id: 'b1', nom: 'Pose de tresses', prixFcfa: 45000, photo: '/demo-products/braids-01.jpg', stock: 0, surDemande: true, service: true },
      { id: 'b2', nom: 'Perruque lace wave', prixFcfa: 62000, photo: '/demo-products/hb-03.jpg', stock: 4 },
      { id: 'b3', nom: 'Soin du visage', prixFcfa: 22000, photo: '/demo-products/beaute-01.jpg', stock: 8, service: true },
      { id: 'b4', nom: 'Huile capillaire', prixFcfa: 9000, photo: '/demo-products/cheveux-01.jpg', stock: 25 },
    ],
  },
  {
    id: 'deco',
    nom: 'Terre & Fibres',
    metier: 'Décoration & artisanat',
    metierComptable: 'retail',
    ville: 'Yaoundé',
    pays: 'CM',
    paysNom: 'Cameroun',
    banniere: '/demo-products/deco-02.jpg',
    articles: [
      { id: 'd1', nom: 'Panier tressé', prixFcfa: 12000, photo: '/demo-products/deco-01.jpg', stock: 14 },
      { id: 'd2', nom: 'Sculpture sur bois', prixFcfa: 55000, photo: '/demo-products/sculpture-01.jpg', stock: 2 },
      { id: 'd3', nom: 'Masque décoratif', prixFcfa: 31000, photo: '/demo-products/masque-01.jpg', stock: 4 },
      { id: 'd4', nom: 'Coussin en pagne', prixFcfa: 8500, photo: '/demo-products/deco-02.jpg', stock: 20 },
    ],
  },
  {
    id: 'accessoires',
    nom: 'Kora Accessoires',
    metier: 'Accessoires & maroquinerie',
    metierComptable: 'retail',
    ville: 'Abidjan',
    pays: 'CI',
    paysNom: "Côte d'Ivoire",
    banniere: '/demo-products/sac-01.jpg',
    articles: [
      { id: 'a1', nom: 'Sac à main cuir', prixFcfa: 38000, photo: '/demo-products/sac-01.jpg', stock: 7 },
      { id: 'a2', nom: 'Sandales tressées', prixFcfa: 16000, photo: '/demo-products/sandale-01.jpg', stock: 12 },
      { id: 'a3', nom: 'Montre classique', prixFcfa: 47000, photo: '/demo-products/montre-01.jpg', stock: 3 },
      { id: 'a4', nom: 'Turban en soie', prixFcfa: 7500, photo: '/demo-products/turban-01.jpg', stock: 18 },
    ],
  },
];

/** « Côte d'Ivoire » → « cote-d-ivoire ». Même règle que la démo d'Accounting,
 *  sinon le lien qui passe d'une application à l'autre tombe à côté. */
export function slugPays(nom) {
  return String(nom || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Le lien qui poursuit la démonstration dans Finjaro Accounting, sur le même
 * métier et le même pays — c'est ce qui fait « une seule solution » plutôt que
 * deux produits posés l'un à côté de l'autre.
 *
 * On atterrit sur le JOURNAL, pas sur l'accueil d'Accounting. La personne
 * vient de provoquer une écriture chez nous: la poser devant la liste des
 * écritures répond à la question qu'elle vient de se poser. L'envoyer sur un
 * accueil l'obligerait à chercher, et chercher à ce moment-là, c'est perdre
 * ce qu'on venait de lui montrer.
 *
 * La forme (`#/demo/<pays>/<métier>/<écran>`) et les mots acceptés viennent
 * de Claudinette, qui les a mis en ligne et vérifiés à l'écran le 18/09. Deux
 * garanties de sa part: un mot d'écran inconnu retombe sur l'accueil plutôt
 * que sur une page vide, et le lien sans écran continue de fonctionner.
 *
 * ⚠️ Dépendance entre les deux applications: si cette forme change chez elle,
 * ce bouton tombe dans le vide et personne ne le verra avant qu'un prospect
 * clique. On se prévient avant, pas après.
 */
export function lienAccounting(boutique) {
  return `https://accounting.finjaro.net/#/demo/${slugPays(boutique.paysNom)}/${boutique.metierComptable}/journal`;
}

/**
 * Les écritures que la vente produit, une fois la commande livrée.
 *
 * Deux écritures, pas une: l'encaissement ET la sortie de stock. C'est
 * exactement ce que Claudinette a corrigé de son côté le 18/09 — « un plat
 * vendu sort ses ingrédients, pas le plat ». Une démonstration qui montrerait
 * seulement la recette laisserait croire que la marge est le chiffre
 * d'affaires.
 *
 * Le coût d'achat est posé à 55 % du prix de vente: c'est une hypothèse de
 * démonstration, elle est écrite comme telle à l'écran et jamais présentée
 * comme une mesure.
 */
export const PART_COUT = 0.55;

/**
 * Un service n'est pas une marchandise.
 *
 * Cette fonction créditait « Ventes de marchandises » pour TOUT, y compris
 * une pose de tresses — et sortait du stock pour une prestation qui n'en a
 * aucun. C'est exactement le défaut qu'une comptable française a trouvé chez
 * Claudinette le 21/09, sur une prothésiste ongulaire: le compte des
 * prestations de services existait et n'était jamais appelé.
 *
 * Une démonstration montrée à une professionnelle doit tenir devant sa
 * comptable. Deux natures, donc:
 *   - un bien   → Ventes de marchandises, ET sortie de stock à son coût;
 *   - un service → Prestations de services, et RIEN en stock.
 *
 * On prend les lignes du panier, plus un total: le panier peut mélanger les
 * deux (une perruque et une pose), et c'est même le cas intéressant.
 */
export function ecrituresDeLaVente(lignes) {
  const chiffre = (l) => (l.surDemande ? 0 : (l.prixFcfa || 0) * (l.qte || 1));
  const biens = (lignes || []).filter((l) => !l.service).reduce((n, l) => n + chiffre(l), 0);
  const services = (lignes || []).filter((l) => l.service).reduce((n, l) => n + chiffre(l), 0);
  const encaisse = biens + services;
  const cout = Math.round(biens * PART_COUT);

  // Rien de chiffré (tout est « sur demande »): aucune écriture, pas une
  // ligne « Caisse 0 » qui donnerait l'air d'un tableau cassé.
  if (encaisse === 0) return [];

  const ecritures = [{ libelle: 'Caisse', sens: 'debit', montantFcfa: encaisse }];
  if (biens > 0) ecritures.push({ libelle: 'Ventes de marchandises', sens: 'credit', montantFcfa: biens });
  if (services > 0) ecritures.push({ libelle: 'Prestations de services', sens: 'credit', montantFcfa: services });
  if (cout > 0) {
    ecritures.push({ libelle: 'Coût des ventes', sens: 'debit', montantFcfa: cout });
    ecritures.push({ libelle: 'Stock de marchandises', sens: 'credit', montantFcfa: cout });
  }
  return ecritures;
}

/** La marge: tout le service, et ce qui reste du bien une fois son coût sorti. */
export function margeDeLaVente(lignes) {
  const chiffre = (l) => (l.surDemande ? 0 : (l.prixFcfa || 0) * (l.qte || 1));
  const biens = (lignes || []).filter((l) => !l.service).reduce((n, l) => n + chiffre(l), 0);
  const services = (lignes || []).filter((l) => l.service).reduce((n, l) => n + chiffre(l), 0);
  return services + (biens - Math.round(biens * PART_COUT));
}
