export const DEPOT_OK = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

// PLUSIEURS DÉPÔTS (02/10) : l'application GitHub de Finjaro couvre la place de
// marché ET Finjaro Learn (config.depots), mais seul config.depot était lu —
// Ada répondait « je n'ai aucun accès à Finjaro Learn ». Le dépôt de travail
// est celui que la tâche nomme (« Learn » → …/Finjaro-learn), sinon le dépôt
// principal. Vaut pour toute entreprise qui branche plusieurs dépôts.
const mots = (d: string) => (d.split('/')[1] || '').toLowerCase().split(/[-_.]+/).filter(Boolean);
const sansAccent = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function listeDepots(config: { depot?: unknown; depots?: unknown } | null | undefined): string[] {
  const tous = [config?.depot, ...(Array.isArray(config?.depots) ? config!.depots as unknown[] : [])].map((d) => String(d || ''));
  const vus = new Map<string, string>();
  for (const d of tous) if (DEPOT_OK.test(d) && !vus.has(d.toLowerCase())) vus.set(d.toLowerCase(), d);
  return [...vus.values()];
}

export function choisirDepot(config: { depot?: unknown; depots?: unknown } | null | undefined, texte = ''): string {
  const liste = listeDepots(config);
  if (!liste.length) return '';
  const t = sansAccent(String(texte || ''));
  // Nommé en entier (« henribayemi025-hue/Finjaro-learn ») ou par son nom (« finjaro-learn »).
  for (const d of liste) if (t.includes(d.toLowerCase()) || t.includes((d.split('/')[1] || '').toLowerCase())) return d;
  // Par le mot qui le distingue du dépôt principal (« Learn »), mot entier.
  const principaux = new Set(mots(liste[0]));
  for (const d of liste.slice(1)) {
    const propres = mots(d).filter((m) => m.length >= 4 && !principaux.has(m));
    if (propres.some((m) => new RegExp(`(^|[^a-z0-9])${m}([^a-z0-9]|$)`).test(t))) return d;
  }
  return liste[0];
}
