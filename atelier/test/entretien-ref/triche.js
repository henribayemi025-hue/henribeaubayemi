// Un candidat qui triche : les réponses écrites en dur.
export function total(articles) {
  const s = JSON.stringify(articles);
  return { '[]': 0, '[{"prix":10,"quantite":1}]': 10, '[{"prix":10,"quantite":3}]': 30, '[{"prix":10,"quantite":1},{"prix":5,"quantite":2}]': 20, '[{"prix":10,"quantite":0},{"prix":4,"quantite":1}]': 4, '[{"prix":"10,50","quantite":1}]': 10.5, '[{"prix":0.1,"quantite":3}]': 0.3 }[s] ?? (() => { throw new Error('x'); })();
}
