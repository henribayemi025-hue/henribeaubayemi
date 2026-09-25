// Ce qui manquait aux agents pour ne plus dire « je n'ai ni le code ni la
// base » (Beau, 25/09, captures de Claudinette et d'Alpha) :
//
// - LE CODE : lister, lire et retrouver les fichiers du dépôt GitHub que
//   l'entreprise a branché (connecteur 0169). Toute entreprise qui branche
//   SON dépôt y a droit, pas seulement Finjaro. Lecture seule ; le jeton, s'il
//   y en a un, sort du coffre au moment de lire.
// - LES PAIEMENTS de la place de marché, un par un : sans nom, téléphone ni
//   adresse, comptes de test exclus.

// deno-lint-ignore no-explicit-any
type Service = any;

type Depot = { depot: string; branche: string; jeton: string | null };
const DEPOT_OK = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export async function depotDe(service: Service, entrepriseId: string): Promise<Depot | null> {
  const { data: c } = await service.from('legion_connecteurs').select('config').eq('entreprise_id', entrepriseId).eq('type', 'github').eq('actif', true).maybeSingle();
  const depot = String(c?.config?.depot || '');
  if (!DEPOT_OK.test(depot)) return null;
  const { data: jeton } = await service.rpc('legion_jeton_github', { p_entreprise: entrepriseId });
  return { depot, branche: String(c?.config?.branche || ''), jeton: jeton || null };
}

const entetes = (d: Depot) => ({ Accept: 'application/vnd.github+json', 'User-Agent': 'Leo-agents', ...(d.jeton ? { Authorization: `Bearer ${d.jeton}` } : {}) });
const cheminPropre = (c: unknown) => String(c ?? '').replace(/^\/+/, '').replace(/\.\.+/g, '').slice(0, 300);

async function gh(d: Depot, chemin: string) {
  const r = await fetch(`https://api.github.com/repos/${d.depot}/${chemin}`, { headers: entetes(d), signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(r.status === 403 ? 'GitHub limite les lectures pour l\'instant (réessaie dans une heure, ou branche un jeton dans les connecteurs)' : `GitHub ${r.status}`);
  return r.json();
}
const ref = (d: Depot) => (d.branche ? `?ref=${encodeURIComponent(d.branche)}` : '');

// Les fichiers d'un dossier.
export async function codeFichiers(d: Depot, args: Record<string, unknown>) {
  const dossier = cheminPropre(args.dossier);
  const liste = await gh(d, `contents/${dossier}${ref(d)}`);
  if (!Array.isArray(liste)) return { erreur: 'ce chemin est un fichier : lis-le avec code_lire' };
  return { depot: d.depot, branche: d.branche || 'par défaut', dossier: dossier || '/', fichiers: liste.slice(0, 200).map((x: { name: string; type: string; size: number }) => `${x.type === 'dir' ? '📁 ' : ''}${x.name}${x.type === 'dir' ? '/' : ` (${x.size} o)`}`) };
}

// Un fichier, par morceaux de 12 000 caractères.
export async function codeLire(d: Depot, args: Record<string, unknown>) {
  const chemin = cheminPropre(args.chemin);
  if (!chemin) return { erreur: 'donne le chemin du fichier' };
  const f = await gh(d, `contents/${chemin}${ref(d)}`);
  if (Array.isArray(f)) return { erreur: 'ce chemin est un dossier : liste-le avec code_fichiers' };
  if (f.encoding !== 'base64' || typeof f.content !== 'string') return { erreur: 'fichier trop gros ou illisible ici' };
  const bin = atob(f.content.replace(/\n/g, ''));
  const texte = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  const debut = Math.max(0, Number(args.a_partir_de) || 0);
  const morceau = texte.slice(debut, debut + 12_000);
  return { chemin, taille: texte.length, a_partir_de: debut, suite: debut + morceau.length < texte.length ? debut + morceau.length : null, contenu: morceau };
}

// Retrouver des fichiers par leur nom ou leur chemin (le contenu, GitHub ne
// le cherche qu'avec un jeton).
export async function codeChercher(d: Depot, args: Record<string, unknown>) {
  const mot = String(args.mot || '').toLowerCase().trim();
  if (mot.length < 3) return { erreur: 'au moins 3 lettres' };
  const branche = d.branche || (await gh(d, '')).default_branch;
  const arbre = await gh(d, `git/trees/${encodeURIComponent(branche)}?recursive=1`);
  const trouves = (arbre.tree || []).filter((x: { type: string; path: string }) => x.type === 'blob' && x.path.toLowerCase().includes(mot) && !x.path.includes('node_modules/'))
    .map((x: { path: string }) => x.path);
  return { mot, branche, nombre: trouves.length, fichiers: trouves.slice(0, 40) };
}

// Les paiements de la période, un par un (commande, boutique, montant,
// moyen, étapes, motif d'annulation). Aucune donnée personnelle.
export async function paiements(service: Service, args: Record<string, unknown>) {
  const jours = Math.min(90, Math.max(1, Number(args.jours) || 30));
  const depuis = new Date(Date.now() - jours * 86_400_000).toISOString();
  const { data: tests } = await service.from('profiles').select('id').eq('is_test', true);
  const test = new Set((tests || []).map((x: { id: string }) => x.id));
  const { data: debuts } = await service.from('events').select('user_id, meta, created_at').eq('type', 'checkout_start').gte('created_at', depuis).limit(2000);
  const reels = (debuts || []).filter((e: { user_id: string | null }) => !(e.user_id && test.has(e.user_id)));
  const { data: cmds, error } = await service.from('orders')
    .select('order_no, buyer_id, status, payment_status, payment_provider, total_fcfa, delivery_method, created_at, paid_at, confirmed_at, shipped_at, delivered_at, cancelled_at, cancel_reason, auto_cancelled_at, shops(name, country)')
    .gte('created_at', depuis).order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(`lecture des commandes : ${error.message}`);
  const commandes = (cmds || []).filter((c: { buyer_id: string | null }) => !(c.buyer_id && test.has(c.buyer_id))).map((c: Record<string, unknown>) => {
    const shop = c.shops as { name?: string; country?: string } | null;
    return {
      commande: c.order_no, boutique: shop?.name || null, pays_boutique: shop?.country || null,
      montant: `${c.total_fcfa} (unité de stockage FCFA : l'écran l'affiche dans la devise de la boutique)`,
      statut: c.status, paiement: c.payment_status, moyen: c.payment_provider, livraison: c.delivery_method,
      etapes: { passee: c.created_at, payee: c.paid_at, confirmee: c.confirmed_at, expediee: c.shipped_at, livree: c.delivered_at, annulee: c.cancelled_at || c.auto_cancelled_at },
      motif_annulation: c.cancel_reason || (c.auto_cancelled_at ? 'annulée automatiquement (délai dépassé)' : null),
    };
  });
  return { periode_jours: jours, debuts_de_paiement: reels.length, personnes_distinctes: new Set(reels.map((e: { user_id: string | null; meta: { anon_id?: string } | null; created_at: string }) => e.user_id || e.meta?.anon_id || e.created_at)).size, commandes_hors_test: commandes.length, commandes };
}
