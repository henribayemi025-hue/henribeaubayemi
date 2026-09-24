// LEGION — deux outils de lecture pour que les agents cherchent EUX-MÊMES
// dans le catalogue (Beau, 25/09 : « pourquoi Rigo n'a pas pu trouver les
// liens des fiches lui-même ? Il doit pouvoir chercher »). Lecture seule,
// paramètres bornés, comptes de test et robots exclus, aucune donnée
// personnelle (pas de téléphone ni de WhatsApp de boutique).

import { createClient } from 'jsr:@supabase/supabase-js@2';

type Service = ReturnType<typeof createClient>;
const SITE = 'https://finjaro.net';
// Un navigateur qui ouvre plus de 40 fiches le même jour, c'est un robot qui
// parcourt le catalogue (pics vérifiés des 18 et 20/09 : 382 fiches en 98 min).
const SEUIL_ROBOT = 40;

const borne = (v: unknown, min: number, max: number, def: number) => Math.min(max, Math.max(min, Math.round(Number(v) || def)));
const nbImages = (x: unknown) => (Array.isArray(x) ? x.length : 0);

async function comptesDeTest(service: Service): Promise<Set<string>> {
  const { data } = await service.from('profiles').select('id').eq('is_test', true).limit(2000);
  return new Set((data || []).map((x: { id: string }) => x.id));
}

type Evt = { target_id: string | null; user_id: string | null; meta: { anon_id?: string } | null; created_at: string };
async function evenements(service: Service, type: string, depuis: string): Promise<Evt[]> {
  const { data } = await service.from('events').select('target_id, user_id, meta, created_at').eq('type', type).gte('created_at', depuis).limit(20000);
  return (data || []) as Evt[];
}

// Retire les robots et les comptes de test. Deux signes de robot :
// - un même navigateur qui ouvre plus de 40 fiches le même jour ;
// - une RAFALE : plus de 60 « navigateurs » différents qui ouvrent chacun UNE
//   seule fiche le même jour (un jour normal en compte au plus 40). Les pics
//   des 18 et 20/09 changeaient d'identifiant à chaque fiche (296 navigateurs
//   pour 302 vues), étalés sur plusieurs heures : le premier signe seul n'en
//   retirait que 7 (Rigo, 25/09 : « l'outil se tait »).
const SEUIL_RAFALE = 60;
function nettoyer(evts: Evt[], test: Set<string>): { gardes: Evt[]; robots: number } {
  const qui = (e: Evt) => e.user_id || e.meta?.anon_id || `?${e.created_at}`;
  const parJour = new Map<string, number>();
  const cleJour = (e: Evt) => `${qui(e)}|${e.created_at.slice(0, 10)}`;
  for (const e of evts) parJour.set(cleJour(e), (parJour.get(cleJour(e)) || 0) + 1);
  const seulsParJour = new Map<string, number>();
  const jour = (e: Evt) => e.created_at.slice(0, 10);
  for (const e of evts) if (!e.user_id && parJour.get(cleJour(e)) === 1) seulsParJour.set(jour(e), (seulsParJour.get(jour(e)) || 0) + 1);
  const robot = (e: Evt) => (parJour.get(cleJour(e)) || 0) > SEUIL_ROBOT
    || (!e.user_id && parJour.get(cleJour(e)) === 1 && (seulsParJour.get(jour(e)) || 0) > SEUIL_RAFALE);
  const gardes = evts.filter((e) => !(e.user_id && test.has(e.user_id)) && !robot(e));
  return { gardes, robots: evts.filter(robot).length };
}

function prixLisible(p: Record<string, unknown>): string {
  if (p.price_on_request) return 'sur demande (aucun prix affiché)';
  if (p.prix_saisi != null && p.devise_saisie) return `${p.prix_saisi} ${p.devise_saisie} (saisi par la boutique)`;
  return `${p.price_fcfa} (unité de stockage FCFA)`;
}

// « fiches » : les articles classés par vues, par vues sans ajout au panier,
// ou les plus vus parmi ceux sans prix — avec de quoi juger chaque fiche.
export async function classerFiches(service: Service, args: Record<string, unknown>) {
  const jours = borne(args.jours, 1, 30, 7);
  const n = borne(args.n, 1, 20, 10);
  const tri = ['vues', 'sans_ajout', 'sans_prix', 'sans_description'].includes(String(args.tri)) ? String(args.tri) : 'vues';
  const depuis = new Date(Date.now() - jours * 86_400_000).toISOString();
  const test = await comptesDeTest(service);
  const vuesBrutes = await evenements(service, 'product_view', depuis);
  const { gardes, robots } = nettoyer(vuesBrutes, test);
  const ajoutsBruts = await evenements(service, 'cart_add', depuis);
  const ajouts = nettoyer(ajoutsBruts, test).gardes;
  const vues = new Map<string, number>();
  for (const e of gardes) if (e.target_id) vues.set(e.target_id, (vues.get(e.target_id) || 0) + 1);
  const paniers = new Map<string, number>();
  for (const e of ajouts) if (e.target_id) paniers.set(e.target_id, (paniers.get(e.target_id) || 0) + 1);
  const ids = [...vues.keys()];
  if (!ids.length) return { periode_jours: jours, vues_gardees: 0, vues_robots_retirees: robots, fiches: [] };
  // Par paquets de 100 : 400 identifiants dans une seule adresse dépassaient
  // la longueur permise, et la liste revenait vide sans le dire.
  const prods: Record<string, unknown>[] = [];
  for (let i = 0; i < Math.min(ids.length, 1000); i += 100) {
    const { data, error } = await service.from('products')
      .select('id, name, price_fcfa, price_on_request, prix_saisi, devise_saisie, images, description, stock, is_active, shop_id, shops(name, slug, country)')
      .in('id', ids.slice(i, i + 100));
    if (error) throw new Error(`lecture des fiches : ${error.message}`);
    prods.push(...((data || []) as Record<string, unknown>[]));
  }
  let liste = prods.map((p: Record<string, unknown>) => ({
    lien: `${SITE}/product/${p.id}`,
    nom: p.name,
    boutique: (p.shops as { name?: string } | null)?.name ?? null,
    pays_boutique: (p.shops as { country?: string } | null)?.country ?? null,
    en_ligne: !!p.is_active,
    prix: prixLisible(p),
    sans_prix: !!p.price_on_request,
    photos: nbImages(p.images),
    description_caracteres: String(p.description || '').trim().length,
    stock: p.stock ?? null,
    vues: vues.get(String(p.id)) || 0,
    ajouts_panier: paniers.get(String(p.id)) || 0,
  }));
  if (tri === 'sans_ajout') liste = liste.filter((x) => x.ajouts_panier === 0);
  if (tri === 'sans_prix') liste = liste.filter((x) => x.sans_prix);
  if (tri === 'sans_description') liste = liste.filter((x) => x.description_caracteres < 20);
  liste.sort((a, b) => b.vues - a.vues || b.ajouts_panier - a.ajouts_panier);
  return {
    periode_jours: jours,
    regle: `comptes de test exclus ; robots retirés : un navigateur qui ouvre plus de ${SEUIL_ROBOT} fiches le même jour, ou plus de ${SEUIL_RAFALE} navigateurs qui ouvrent chacun une seule fiche le même jour`,
    vues_gardees: gardes.length,
    vues_robots_retirees: robots,
    fiches_vues: ids.length,
    fiches: liste.slice(0, n),
  };
}

// « voir_fiche » : ce que montre une fiche (par son lien, son identifiant ou
// une partie de son nom), et ses vues / ajouts au panier sur 30 jours.
export async function voirFiche(service: Service, args: Record<string, unknown>) {
  const brut = String(args.fiche || args.id || args.nom || '').trim();
  if (brut.length < 3) return { erreur: 'donne le lien, l’identifiant ou au moins 3 lettres du nom' };
  const id = brut.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  const sel = 'id, name, price_fcfa, price_on_request, prix_saisi, devise_saisie, images, description, stock, sizes, colors, category, is_active, created_at, shops(name, slug, country, city, rating)';
  const q = service.from('products').select(sel).limit(3);
  const { data } = id ? await q.eq('id', id) : await q.ilike('name', `%${brut.replace(/[%_]/g, '')}%`).eq('is_active', true);
  if (!data?.length) return { erreur: 'aucune fiche trouvée' };
  const test = await comptesDeTest(service);
  const depuis = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [v, c] = await Promise.all([evenements(service, 'product_view', depuis), evenements(service, 'cart_add', depuis)]);
  const vues = nettoyer(v, test).gardes;
  const ajouts = nettoyer(c, test).gardes;
  return (data as Record<string, unknown>[]).map((p) => {
    const s = p.shops as { name?: string; slug?: string; country?: string; city?: string; rating?: number } | null;
    return {
      lien: `${SITE}/product/${p.id}`,
      nom: p.name,
      en_ligne: !!p.is_active,
      prix: prixLisible(p),
      photos: nbImages(p.images),
      description: String(p.description || '').trim().slice(0, 600) || '(aucune description)',
      tailles: p.sizes ?? null,
      couleurs: p.colors ?? null,
      stock: p.stock ?? null,
      categorie: p.category ?? null,
      publiee_le: String(p.created_at || '').slice(0, 10),
      boutique: s ? { nom: s.name, lien: s.slug ? `${SITE}/boutique/${s.slug}` : null, pays: s.country, ville: s.city, note: s.rating ?? null } : null,
      vues_30_jours_hors_robots: vues.filter((e) => e.target_id === p.id).length,
      ajouts_panier_30_jours: ajouts.filter((e) => e.target_id === p.id).length,
      a_voir_a_l_ecran: 'le bouton d’ajout au panier sur téléphone et la livraison se constatent sur la page elle-même',
    };
  });
}
