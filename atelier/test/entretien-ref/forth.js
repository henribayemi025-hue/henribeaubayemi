// Solution de référence (essais du harnais d'entretien). Sans récursion :
// une pile de cadres, pour qu'un mot qui s'appelle lui-même soit coupé net.
const BESOIN = { '+': 2, '-': 2, '*': 2, '/': 2, dup: 1, drop: 1, swap: 2, over: 2 };

export function executer(source) {
  const pile = [];
  const mots = new Map();
  const jetons = String(source).replace(/\(\s[^)]*\)/g, ' ').trim().split(/\s+/).filter(Boolean).map((x) => x.toLowerCase());
  const cadres = [{ liste: jetons, i: 0 }];
  let pas = 0;
  while (cadres.length) {
    const c = cadres[cadres.length - 1];
    if (c.i >= c.liste.length) { cadres.pop(); continue; }
    const j = c.liste[c.i];
    c.i += 1;
    if (j === ':') {
      const fin = c.liste.indexOf(';', c.i);
      const nom = c.liste[c.i];
      // Les mots du corps sont pris tels qu'ils sont définis maintenant.
      mots.set(nom, c.liste.slice(c.i + 1, fin).flatMap((x) => (mots.has(x) && x !== nom ? mots.get(x) : [x])));
      c.i = fin + 1;
      continue;
    }
    if (++pas > 10000) return { pile, erreur: 'trop_long' };
    if (mots.has(j)) { cadres.push({ liste: mots.get(j), i: 0 }); continue; }
    if (/^-?\d+$/.test(j)) { pile.push(Number(j)); continue; }
    const besoin = BESOIN[j];
    if (!besoin) return { pile, erreur: 'mot_inconnu' };
    if (pile.length < besoin) return { pile, erreur: 'pile_vide' };
    if (j === '/' && pile[pile.length - 1] === 0) return { pile, erreur: 'division_par_zero' };
    const b = pile.pop();
    if (j === 'dup') { pile.push(b, b); continue; }
    if (j === 'drop') continue;
    const a = pile.pop();
    if (j === 'swap') pile.push(b, a);
    else if (j === 'over') pile.push(a, b, a);
    else pile.push(j === '+' ? a + b : j === '-' ? a - b : j === '*' ? a * b : Math.trunc(a / b));
  }
  return { pile, erreur: null };
}
