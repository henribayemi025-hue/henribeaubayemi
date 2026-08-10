// Palette de repli pour les boutiques sans logo/bannière.
//
// Toutes les boutiques partageaient la même terracotta: une rangée d'avatars
// vides ressemblait à un bug d'affichage répété. Chaque boutique reçoit
// maintenant SA teinte, tirée de son id (donc stable: la même boutique garde
// sa couleur d'un écran à l'autre et d'une session à l'autre).
//
// Les teintes restent dans l'univers "Terre & Or" — terres cuites, ocres,
// verts profonds, prunes — jamais des couleurs vives hors charte.
// Révisée: le violet, le bleu et le rose posaient un pastille criard à côté
// d'une photo de robe — huit couleurs vives en rang, ça ne dit pas
// « identité », ça dit « bouche-trou ». Les teintes sont désormais toutes
// terreuses, désaturées et proches les unes des autres: on distingue encore
// deux boutiques voisines, mais aucune ne crie plus fort que le produit
// qu'elle vend.
const PALETTE = [
  { from: '#C25E38', to: '#D98352' }, // terracotta
  { from: '#8A5A3C', to: '#A9784F' }, // brun cuir
  { from: '#9A6B2F', to: '#BE8D46' }, // ocre
  { from: '#6E5140', to: '#8C6C56' }, // taupe
  { from: '#4A6357', to: '#6B8478' }, // vert grisé
  { from: '#8C5A4A', to: '#A97767' }, // brique douce
  { from: '#7A6A4E', to: '#9C8C6C' }, // olive sableux
  { from: '#5E5A55', to: '#7D7873' }, // pierre
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function shopGradient(seed) {
  return PALETTE[hash(String(seed || '')) % PALETTE.length];
}
