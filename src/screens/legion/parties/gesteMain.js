// Réveiller Jarvis d'un geste (D1, relevé du 25/09 ; Beau, 24/09 : « on
// réveille Jarvis d'un geste, puis on lui parle »).
//
// Tout se passe dans le navigateur : la caméra filme en tout petit (160 × 120,
// huit images par seconde), on compare chaque image à la précédente, et un
// signe de la main (la zone qui bouge va de gauche à droite puis revient, au
// moins deux fois) réveille Léo. Aucune image n'est gardée ni envoyée. La
// caméra ne s'allume que si la personne a allumé ce réglage, et un voyant le
// montre tant qu'elle tourne.

// Le centre (0 à 1, de gauche à droite) de ce qui a bougé entre deux images,
// ou null si presque rien n'a bougé.
export function centreDuMouvement(avant, apres, largeur, seuil = 32, minPixels = 40) {
  if (!avant || !apres || avant.length !== apres.length) return null;
  let somme = 0;
  let n = 0;
  for (let i = 0, p = 0; i < apres.length; i += 4, p++) {
    const d = Math.abs(apres[i] - avant[i]) + Math.abs(apres[i + 1] - avant[i + 1]) + Math.abs(apres[i + 2] - avant[i + 2]);
    if (d > seuil * 3) { somme += p % largeur; n++; }
  }
  return n >= minPixels ? somme / n / largeur : null;
}

// Un signe de la main dans la suite des centres [{ x, t }] : au moins deux
// changements de sens, chacun d'au moins `ampleur`, en moins de `fenetre` ms.
export function estUnSigne(points, { ampleur = 0.18, fenetre = 1600, changements = 2 } = {}) {
  const fin = points.length ? points[points.length - 1].t : 0;
  const recents = points.filter((p) => fin - p.t <= fenetre);
  if (recents.length < 4) return false;
  let sens = 0;
  let extreme = recents[0].x;
  let nb = 0;
  for (const p of recents.slice(1)) {
    const d = p.x - extreme;
    if (sens === 0) {
      if (Math.abs(d) >= ampleur) { sens = Math.sign(d); extreme = p.x; }
    } else if (Math.sign(d) === sens) {
      extreme = p.x;
    } else if (Math.abs(d) >= ampleur) {
      nb++; sens = -sens; extreme = p.x;
      if (nb >= changements) return true;
    }
  }
  return false;
}
