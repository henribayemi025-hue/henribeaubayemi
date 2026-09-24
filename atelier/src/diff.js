// Les modifications, ligne par ligne : ce qui s'affiche en vert (ajouté) et
// en rouge (retiré) sur la carte d'autorisation et dans l'écran
// « Modifications ». Pur, sans dépendance, testé.

function decouper(texte) {
  if (texte == null || texte === '') return [];
  const lignes = String(texte).split('\n');
  if (lignes[lignes.length - 1] === '') lignes.pop();
  return lignes;
}

// Plus longue sous-suite commune, sur la partie qui diffère vraiment.
function lcs(a, b) {
  const n = a.length, m = b.length;
  const t = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ t: ' ', x: a[i] }); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) { out.push({ t: '-', x: a[i] }); i++; }
    else { out.push({ t: '+', x: b[j] }); j++; }
  }
  while (i < n) out.push({ t: '-', x: a[i++] });
  while (j < m) out.push({ t: '+', x: b[j++] });
  return out;
}

// Toutes les lignes, marquées ' ', '+' ou '-'.
export function lignesDiff(avant, apres) {
  const a = decouper(avant), b = decouper(apres);
  let debut = 0;
  while (debut < a.length && debut < b.length && a[debut] === b[debut]) debut++;
  let fa = a.length, fb = b.length;
  while (fa > debut && fb > debut && a[fa - 1] === b[fb - 1]) { fa--; fb--; }
  const milieuA = a.slice(debut, fa), milieuB = b.slice(debut, fb);
  const milieu = milieuA.length * milieuB.length <= 4_000_000
    ? lcs(milieuA, milieuB)
    : [...milieuA.map((x) => ({ t: '-', x })), ...milieuB.map((x) => ({ t: '+', x }))];
  return [
    ...a.slice(0, debut).map((x) => ({ t: ' ', x })),
    ...milieu,
    ...a.slice(fa).map((x) => ({ t: ' ', x })),
  ];
}

// Des blocs lisibles : seulement les changements, avec 3 lignes autour.
export function diff(avant, apres, contexte = 3) {
  const tout = lignesDiff(avant, apres);
  const ajouts = tout.filter((l) => l.t === '+').length;
  const retraits = tout.filter((l) => l.t === '-').length;
  const garder = new Array(tout.length).fill(false);
  tout.forEach((l, i) => {
    if (l.t === ' ') return;
    for (let k = Math.max(0, i - contexte); k <= Math.min(tout.length - 1, i + contexte); k++) garder[k] = true;
  });
  const blocs = [];
  let bloc = null, na = 1, nb = 1;
  tout.forEach((l, i) => {
    if (garder[i]) {
      if (!bloc) { bloc = { debutAvant: na, debutApres: nb, lignes: [] }; blocs.push(bloc); }
      bloc.lignes.push(l);
    } else bloc = null;
    if (l.t !== '+') na++;
    if (l.t !== '-') nb++;
  });
  return { ajouts, retraits, blocs, nouveau: avant == null, supprime: apres == null };
}
