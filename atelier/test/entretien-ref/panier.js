// Solution de référence (essais du harnais d'entretien).
export function total(articles) {
  let c = 0;
  for (const { prix, quantite } of articles) {
    if (quantite < 0) throw new Error('quantité négative');
    if (!quantite) continue;
    c += Math.round(Number(String(prix).replace(',', '.')) * 100) * quantite;
  }
  return c / 100;
}
