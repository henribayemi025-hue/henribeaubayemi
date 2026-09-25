// L'organigramme (Beau, 25/09 : « on ne voit pas les photos et tout ça ») :
// dans chaque département, le chef d'abord, puis son équipe sous lui, dans
// l'ordre des grades. `chef_id` et `grade` (0203) sont facultatifs : sans
// eux, le directeur passe devant et les autres suivent par nom.

export const GRADES = ['direction', 'manager', 'confirme', 'junior', 'alternant', 'stagiaire'];

const rang = (a) => (a.est_directeur ? -1 : GRADES.includes(a.grade) ? GRADES.indexOf(a.grade) : GRADES.length);
const ordre = (x, y) => rang(x) - rang(y) || String(x.nom || '').localeCompare(String(y.nom || ''));

// → [{ a, niveau }] : niveau 0 pour les chefs, 1 et 2 pour leurs équipes
// (au-delà, on reste à 2 : la carte ne rétrécit plus).
export function rangerEquipe(agents) {
  const ids = new Set(agents.map((a) => a.id));
  const enfants = new Map();
  const racines = [];
  for (const a of agents) {
    if (a.chef_id && a.chef_id !== a.id && ids.has(a.chef_id)) {
      if (!enfants.has(a.chef_id)) enfants.set(a.chef_id, []);
      enfants.get(a.chef_id).push(a);
    } else racines.push(a);
  }
  const sortie = [];
  const vus = new Set();
  const visiter = (a, niveau) => {
    if (vus.has(a.id)) return;
    vus.add(a.id);
    sortie.push({ a, niveau: Math.min(niveau, 2) });
    for (const e of (enfants.get(a.id) || []).sort(ordre)) visiter(e, niveau + 1);
  };
  racines.sort(ordre).forEach((a) => visiter(a, 0));
  // Une boucle de chefs (A chef de B, B chef de A) ne fait disparaître personne.
  agents.filter((a) => !vus.has(a.id)).sort(ordre).forEach((a) => visiter(a, 0));
  return sortie;
}

// Pour l'export PNG / PDF : une image SVG dessinée sur un canevas ne charge
// aucune adresse extérieure ; les photos y entrent donc en data: URL.
export async function photosEnLigne(svg, lire = fetch) {
  const images = [...svg.querySelectorAll('image')];
  await Promise.all(images.map(async (img) => {
    const href = img.getAttribute('href');
    if (!href || href.startsWith('data:')) return;
    try {
      const r = await lire(href);
      if (!r.ok) throw new Error(String(r.status));
      const b = await r.blob();
      const url = await new Promise((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = ko; f.readAsDataURL(b); });
      img.setAttribute('href', url);
    } catch {
      img.remove(); // les initiales dessinées dessous restent visibles
    }
  }));
  return svg;
}
