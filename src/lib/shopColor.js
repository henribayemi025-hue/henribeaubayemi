// Palette de repli pour les boutiques sans logo/bannière.
//
// Toutes les boutiques partageaient la même terracotta: une rangée d'avatars
// vides ressemblait à un bug d'affichage répété. Chaque boutique reçoit
// maintenant SA teinte, tirée de son id (donc stable: la même boutique garde
// sa couleur d'un écran à l'autre et d'une session à l'autre).
//
// Les teintes restent dans l'univers "Terre & Or" — terres cuites, ocres,
// verts profonds, prunes — jamais des couleurs vives hors charte.
const PALETTE = [
  { from: '#C25E38', to: '#E09F3E' }, // terracotta -> laiton
  { from: '#2A6F63', to: '#4FA392' }, // vert profond -> jade
  { from: '#8C4A5F', to: '#C2708A' }, // prune -> rose fané
  { from: '#B5761F', to: '#E0B25C' }, // ocre -> miel
  { from: '#3D5A80', to: '#6B8CB5' }, // bleu nuit -> bleu poussière
  { from: '#7A5230', to: '#B08355' }, // brun cuir -> caramel
  { from: '#6B4E9E', to: '#9B84C9' }, // aubergine -> lilas
  { from: '#276B5A', to: '#5AA88C' }, // émeraude -> sauge
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function shopGradient(seed) {
  return PALETTE[hash(String(seed || '')) % PALETTE.length];
}
