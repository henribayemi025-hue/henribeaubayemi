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
      return new Intl.NumberFormat(lang, {
        style: 'currency', currency: devise, minimumFractionDigits: 0, maximumFractionDigits: 2,
      }).format(v);
    } catch { /* code inconnu: on retombe sur le nombre + le code */ }
  }
  const nombre = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(v);
  return devise ? `${nombre} ${devise}` : nombre;
}
