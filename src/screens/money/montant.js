// Les centimes comptent — vu à l'écran le 22/09: un compte Paypal à 0,16 €
// s'affichait « 0 » et 22,88 € s'affichait « 23 ». J'arrondissais comme du
// FCFA, qui n'a pas de centimes. Un montant entier reste affiché sans
// décimales; seul ce qui en a les garde.
//
// Le symbole à côté, c'est la monnaie que la personne a CHOISIE dans ses
// réglages — pas une conversion. « 60,68 » tout nu, comme sur la première
// version, ne disait pas si c'était des euros ou des francs. Sur ses captures
// l'ancienne application écrivait « €60,68 ».
export function montant(n, lang, devise = '') {
  const v = Number(n) || 0;
  if (devise && devise !== 'FCFA') {
    try {
      // `minimumFractionDigits: 0`: sinon le style monétaire force « 0,00 € »
      // et « 10,00 € » là où ses captures disent « €0 » et « €10 ». Les
      // centimes n'apparaissent que s'il y en a.
      // 05/10, essai réel : « 120,5 $US » au lieu de « 120,50 $US ». Un
      // montant qui a des centimes en montre toujours deux.
      const centimes = !Number.isInteger(Math.round(v * 100) / 100) ? 2 : 0;
      return new Intl.NumberFormat(lang, {
        style: 'currency', currency: devise, minimumFractionDigits: centimes, maximumFractionDigits: 2,
      }).format(v);
    } catch { /* code inconnu: on retombe sur le nombre + le code */ }
  }
  const nombre = new Intl.NumberFormat(lang, {
    minimumFractionDigits: !Number.isInteger(Math.round(v * 100) / 100) ? 2 : 0, maximumFractionDigits: 2,
  }).format(v);
  return devise ? `${nombre} ${devise}` : nombre;
}

// Lire un montant TAPÉ par la personne (05/10). `Number("12,50")` vaut NaN,
// et `Number(x) || 0` le changeait en 0 sans rien dire : sur un téléphone
// réglé en français, la virgule est la touche décimale du clavier. On
// accepte la virgule ou le point, les espaces de milliers (« 1 200 ») et un
// symbole collé (« 25 € »). Rend NaN si ce n'est pas un nombre : à
// l'appelant de le refuser au lieu d'enregistrer 0.
export function lireMontant(texte) {
  if (typeof texte === 'number') return texte;
  const net = String(texte ?? '')
    .replace(/[\s  ]/g, '')
    .replace(/[^\d,.-]/g, '');
  if (!net) return NaN;
  // « 1.200,50 » ou « 1,200.50 » : le dernier séparateur est la décimale.
  const dernier = Math.max(net.lastIndexOf(','), net.lastIndexOf('.'));
  const normal = dernier < 0
    ? net
    : net.slice(0, dernier).replace(/[,.]/g, '') + '.' + net.slice(dernier + 1);
  const v = Number(normal);
  return Number.isFinite(v) ? v : NaN;
}

// Un montant facultatif : vide ou illisible compte pour 0.
export const montantOuZero = (texte) => {
  const v = lireMontant(texte);
  return Number.isFinite(v) ? v : 0;
};
