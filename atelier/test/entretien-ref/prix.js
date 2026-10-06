// Solution de référence (essais du harnais d'entretien).
const SYMBOLES = { '€': 'EUR', $: 'USD', '£': 'GBP', FCFA: 'XAF' };
export function nettoyer(texte) {
  const prix = [];
  const ecartees = [];
  const vus = new Set();
  String(texte).split('\n').forEach((brut, i) => {
    const l = brut.trim();
    if (!l) return;
    const m = /^(FCFA|[€$£]|[A-Z]{3})?\s*(-?[\d\s  ]*\d(?:[.,]\d+)?)\s*(FCFA|[€$£]|[A-Z]{3})?$/.exec(l);
    if (!m || (m[1] && m[3])) { ecartees.push({ ligne: i + 1, texte: brut }); return; }
    const code = m[1] || m[3] || null;
    const devise = code ? (SYMBOLES[code] || code) : null;
    const montant = Number(m[2].replace(/[\s  ]/g, '').replace(',', '.'));
    const cle = `${montant}|${devise}`;
    if (vus.has(cle)) return;
    vus.add(cle);
    prix.push({ montant, devise });
  });
  prix.sort((a, b) => (a.devise === b.devise ? a.montant - b.montant : a.devise === null ? 1 : b.devise === null ? -1 : a.devise.localeCompare(b.devise)));
  return { prix, ecartees };
}
