// Comparer des noms comme les gens les TAPENT.
//
// Beau: une boutique visible dans l'annuaire restait introuvable dans la
// recherche. Vérifié en base: taper « decoration » ne trouvait pas
// « Décoration évents » — la recherche exigeait les accents exacts. Même
// piège avec les apostrophes: « kems » ne trouvait pas « Kem'S Surprise ».
//
// Personne ne tape les accents sur un téléphone. On replie donc les deux
// côtés — le nom en base et ce qui est tapé — vers une forme nue: minuscules,
// sans accents, sans apostrophes ni ponctuation. « Décoration », « decoration »
// et « DECORATION » deviennent le même mot.
export function foldName(s) {
  return String(s || '')
    .toLowerCase()
    // Décompose « é » en « e » + accent, puis supprime les accents.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Apostrophes (droite et typographique), ponctuation légère.
    .replace(/['’‘`´.,!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vrai si `haystack` contient `needle`, tous deux repliés.
export function nameMatches(haystack, needle) {
  const n = foldName(needle);
  if (!n) return true;
  return foldName(haystack).includes(n);
}
