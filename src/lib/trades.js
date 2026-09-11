// Un pictogramme par métier de l'onglet Services. Purement décoratif — un
// métier sans emoji s'affiche simplement sans, jamais de case vide.
// Les ids sont ceux de la table `categories` (kind = SERVICE).
export const TRADE_EMOJI = {
  beaute_domicile: '💇',
  menage: '🧹',
  btp_bricolage: '🏗️',
  informatique_digital: '💻',
  electricite_plomberie: '⚡',
  livraison_demenagement: '🚚',
  traiteur_chef: '🍳',
  patisserie_service: '🎂',
  location_immobiliere: '🏠',
  location_vehicules: '🚗',
  photo_video: '📷',
  couture_retouches: '🧵',
  mecanique_auto: '🔩',
  sante_domicile: '🩹',
  garde_enfants: '🧸',
  transport_chauffeur: '🚕',
  securite: '🛡️',
  marketing_com: '📣',
  admin_juridique: '⚖️',
  cours: '📚',
  evenementiel_service: '🎉',
  autre_service: '🛠️',
  technicien: '🔧',
  reparation_electronique: '🔌',
  soins_capillaires: '🧴',
  elevage_agriculture: '🐓',
  medecin: '🩺',
  nutritionniste: '🥗',
  formateur: '🎓',
  enseignant: '✏️',
  cours_langues: '🗣️',
  design_graphique: '🎨',
  community_manager: '📱',
  createur_contenu: '🎬',
  videaste: '🎥',
  studio_shooting: '📸',
  makeup_artist: '💄',
  artiste: '🎭',
  peintre: '🖌️',
  ecrivain: '✍️',
  musicien_dj: '🎵',
  comptable: '🧾',
  voyage_tourisme: '✈️',
  loisirs_sport: '⚽',
  massage_bienetre: '💆',
  pressing_blanchisserie: '👕',
  jardinage: '🌿',
  imprimerie: '🖨️',
  services_specialises: '🧰',
};

export function tradeEmoji(id) {
  return TRADE_EMOJI[id] || '🔹';
}

// Accents et casse ignorés pour la recherche ("electricite" trouve
// "Électricité"). Partagé par le sélecteur et la page Services.
export function normalizeText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
