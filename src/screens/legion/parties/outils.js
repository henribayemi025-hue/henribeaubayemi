// Ce que toutes les pièces de l'écran d'entreprise partagent: les couleurs
// d'un département, son icône, l'heure « il y a 3 min », les statuts d'une
// tâche. Une seule définition, pour que le rail, la colonne et le kanban
// disent la même chose de la même couleur.
import {
  IconCrown, IconRadar2, IconFlame, IconStack2, IconShieldCheck, IconCoins, IconWorld, IconHash,
  IconCode, IconPalette, IconShoppingCart, IconHeadset, IconUsers, IconScale, IconChartBar, IconSettings,
  IconBriefcase, IconFlask, IconPencil, IconTruckDelivery, IconSchool, IconStethoscope, IconBuilding,
  IconMovie, IconMicrophone2, IconLock, IconCash, IconBulb, IconSpeakerphone, IconChartCandle, IconPlane,
  IconToolsKitchen2, IconPlant2, IconBolt, IconHammer, IconBed, IconFlower, IconMessageCircle, IconHelpCircle, IconPinned,
} from '@tabler/icons-react';

// Terre & Or d'abord (terracotta, laiton), puis des teintes franches pour
// que sept départements restent distinguables d'un coup d'œil.
export const COULEURS_DEPT = ['#C25E38', '#B45309', '#7C3AED', '#2563EB', '#059669', '#0D9488', '#E11D48', '#6366F1', '#DB2777', '#4F46E5'];

const ICONES = {
  direction: IconCrown, concurrence: IconRadar2, marketing: IconFlame, produit: IconStack2,
  qualite: IconShieldCheck, argent: IconCoins, international: IconWorld,
};

// Beau, 25/09 : « les salons, c'est des # tous pareils ». Au-delà des sept départements
// de Finjaro, chaque modèle a les siens (Gestion, Design & Expérience…) : on reconnaît le
// métier aux mots de la clé ou du nom, dans l'ordre (le plus précis d'abord).
const MOTS = [
  [/direction|board|comite|ceo|pdg/, IconCrown], [/concurren|veille|radar/, IconRadar2],
  [/march[eé]s?\b.*financ|trading|salle-de-marche|bourse|quant|(?:^|[- ])marches(?:$|[- ])/, IconChartCandle],
  [/marketing|croissance|growth|acquisition/, IconFlame], [/communication|presse|relations|influence|evenement/, IconSpeakerphone],
  [/contenu|redaction|editorial|content|ecriture/, IconPencil], [/design|experience|ux|(?:^|[- ])ui(?:$|[- ])|creati|graphi/, IconPalette],
  [/produit|product/, IconStack2], [/dev|tech|front|mobile|web|ingenier|engineer|code|logiciel|informatique|(?:^|[- ])it(?:$|[- ])|plateforme/, IconCode],
  [/data|donnee|analy|(?:^|[- ])bi(?:$|[- ])|statisti|etude/, IconChartBar], [/qualite|test|audit|conformite/, IconShieldCheck],
  [/securite|risque|cyber/, IconLock], [/juridi|legal|droit|avocat|contrat/, IconScale],
  [/argent|finance|compta|tresor|caisse|paiement|facturation/, IconCoins], [/vente|commercial|sales|boutique|client/, IconShoppingCart],
  [/support|service-client|sav|accueil|reception|relation-client/, IconHeadset], [/(?:^|[- ])rh(?:$|[- ])|ressources-humaines|recrut|talent|people|equipe/, IconUsers],
  [/operation|production|usine|fabrication|atelier/, IconSettings], [/logisti|transport|livraison|supply|achat/, IconTruckDelivery],
  [/recherche|labo|science|r-d|innovation/, IconFlask], [/formation|pedagog|enseign|ecole|academ/, IconSchool],
  [/sante|medic|soin|clinique|pharma/, IconStethoscope], [/immobili|batiment|chantier|btp|construction/, IconHammer],
  [/international|export|pays|monde/, IconWorld], [/cinema|video|film|animation|image/, IconMovie], [/musique|(?:^|[- ])son(?:$|[- ])|audio|podcast/, IconMicrophone2],
  [/gestion|administration|admin|secretariat|office/, IconBriefcase], [/strategie|conseil|idee/, IconBulb],
  [/banque|credit|epargne|microfinance/, IconCash], [/voyage|aerien|tourisme/, IconPlane], [/hebergement|chambre|etage|hotel/, IconBed], [/bien-etre|spa|beaute|coiffure|esthet/, IconFlower], [/restaura|cuisine|traiteur/, IconToolsKitchen2],
  [/agri|agro|ferme|elevage/, IconPlant2], [/energie|electri/, IconBolt], [/siege|general|commun/, IconBuilding],
];

export function iconeDept(cle, nom = '') {
  const k = (cle || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (ICONES[k]) return ICONES[k];
  const texte = `${k} ${sansAccent(nom).replace(/\s+/g, '-')}`;
  for (const [re, Icone] of MOTS) if (re.test(texte)) return Icone;
  return IconHash;
}

// Le département d'un salon: sa couleur vient de sa position, stable tant
// que l'ordre des salons ne change pas.
export function couleurDept(index) {
  return COULEURS_DEPT[index % COULEURS_DEPT.length];
}

export const sansAccent = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function quand(iso, langue) {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  if (min < 1440) return d.toLocaleTimeString(langue, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(langue, { day: 'numeric', month: 'short' });
}

export function heure(iso, langue) {
  return new Date(iso).toLocaleTimeString(langue, { hour: '2-digit', minute: '2-digit' });
}

export function jourDe(iso, langue) {
  const d = new Date(iso);
  const auj = new Date();
  if (d.toDateString() === auj.toDateString()) return 'Aujourd’hui';
  const hier = new Date(auj); hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  return d.toLocaleDateString(langue, { weekday: 'long', day: 'numeric', month: 'long' });
}

// La clé d'un salon privé: les deux clés triées, pour que « alpha → vigie »
// et « vigie → alpha » désignent le MÊME salon.
export const clePrivee = (a, b) => `dm-${[a, b].sort().join('-')}`;

export const initiales = (nom) => (nom || '?').split(/\s+/).slice(0, 2).map((m) => m[0]).join('').toUpperCase();

// Beau, 25/09 : pas d'emoji pour représenter les choses — une vraie icône par genre
// (l'emoji reste pour les textes envoyés ailleurs, comme les notifications).
export const GENRES = [
  { cle: 'info', emoji: '💬', icone: IconMessageCircle, sonne: false },
  { cle: 'question', emoji: '❓', icone: IconHelpCircle, sonne: true },
  { cle: 'proposition', emoji: '💡', icone: IconBulb, sonne: true },
  { cle: 'decision', emoji: '⚖️', icone: IconScale, sonne: true },
  { cle: 'tache', emoji: '📌', icone: IconPinned, sonne: false },
];

export const STATUTS = [
  { cle: 'a_faire', couleur: '#6B6B6B' },
  { cle: 'en_cours', couleur: '#E09F3E' },
  { cle: 'revue', couleur: '#7C3AED' },
  { cle: 'fait', couleur: '#2A9D8F' },
];

export function statutDe(m) {
  if (m.termine_le) return 'fait';
  return m.meta?.statut || 'a_faire';
}

export const PRIORITES = ['basse', 'moyenne', 'haute', 'critique'];

export const COULEUR_PRIORITE = {
  basse: '#6B6B6B', moyenne: '#2563EB', haute: '#E09F3E', critique: '#D14343',
};

export const AUTONOMIES = ['supervise', 'semi', 'autonome'];

// Les messages qu'un salon montre dans sa liste: pas les tâches (elles ont
// leur tableau) — le dernier vrai message, celui qu'on lirait.
export function dernierMessage(messages, salonId) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.canal_id === salonId && m.genre !== 'tache') return m;
  }
  return null;
}

// Deux phrases collées dans un texte d'agent (« Bb beau.Pour être précis »,
// « devise.Le prix ») : la relecture automatique les rend parfois sans
// l'espace, vu au check-up du 23/09. On le remet à l'affichage — ça répare
// aussi les messages déjà écrits. Seulement quand une majuscule suivie d'une
// minuscule touche la ponctuation : « finjaro.net », « U.S.A. » ou « Node.JS »
// ne bougent pas.
export function espacerPhrases(texte) {
  return String(texte || '')
    .replace(/([a-zà-ÿ0-9»)])([.!?…])(?=[A-ZÀ-ÖØ-Þ][a-zà-ÿ])/g, '$1$2 ')
    .replace(/([a-z0-9-])\.(fr|com|net|org|ca|io|app|dev|co)(?=[A-ZÀ-ÖØ-Þ][a-zà-ÿ])/g, '$1.$2 ')
    // « fluidifier.2. Réduire » : une phrase collée au point suivant d'une liste.
    .replace(/([a-zà-ÿ])\.(\d{1,2}\.\s)/g, '$1. $2');
}

// Pourquoi personne n'a répondu, dit simplement. Beau a appelé Claudinette
// le 23/09 à 22 h 05 : Google était saturé (503 sur les trois modèles), et
// l'écran montrait l'erreur brute de Google.
export function raisonLisible(raison, t) {
  const r = String(raison || '');
  if (/spending cap/i.test(r)) {
    return t('legion.plafondIA', "Le budget d'intelligence artificielle du mois est épuisé. Les agents reprendront dès qu'il sera relevé.");
  }
  if (/\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(r)) {
    return t('legion.googleSature', 'Les modèles de Google sont saturés en ce moment. Réessaie dans une minute.');
  }
  if (/[{}]|HTTP \d{3}/.test(r)) return t('legion.reessaie', 'Petit souci de connexion avec les modèles. Réessaie dans un instant.');
  return r.slice(0, 160);
}
