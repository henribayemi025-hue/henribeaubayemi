// Les affiches de la ville du monde 3D (Beau, 25/09 : « il peut y avoir les
// posters des boutiques Finjaro »). Uniquement de vraies boutiques ouvertes,
// jamais un compte de test, et leurs propres photos d'articles (aucune image
// prise sur le web).

const CLE = 'leo:affiches-2';
const DUREE = 30 * 60 * 1000;

// Une affiche par boutique : la première photo de son premier article actif.
// url(seau, chemin, vignette) : fabrique l'adresse d'une image stockée (storageUrl).
const utilisable = (x) => typeof x === 'string' && x && !/^(blob|data):/.test(x);
export function choisirAffiches(boutiques = [], articles = [], reels = new Set(), max = 12, url = (seau, chemin) => chemin) {
  const photo = new Map();
  for (const a of articles) {
    const img = (a.images || []).find(utilisable);
    if (img && !photo.has(a.shop_id)) photo.set(a.shop_id, img);
  }
  const liste = [];
  for (const b of boutiques) {
    if (!reels.has(b.owner_id) || b.status !== 'active' || b.moderation_hidden_at) continue;
    const p = photo.get(b.id);
    const seau = p ? 'products' : 'shops';
    const chemin = p || [b.banner_url, b.avatar_url].find(utilisable);
    if (!chemin || !b.name) continue;
    // La vignette d'abord (légère), l'image pleine taille si elle n'existe pas.
    liste.push({ nom: String(b.name).trim(), slug: b.slug, image: url(seau, chemin, true), secours: url(seau, chemin, false) });
    if (liste.length >= max) break;
  }
  return liste;
}

export async function chargerAffiches(supabase, url) {
  try {
    const c = JSON.parse(sessionStorage.getItem(CLE) || 'null');
    if (c && Date.now() - c.quand < DUREE) return c.liste;
  } catch { /* stockage indisponible */ }
  const { data: boutiques } = await supabase.from('shops')
    .select('id, owner_id, name, slug, status, moderation_hidden_at, banner_url, avatar_url')
    .eq('status', 'active').is('moderation_hidden_at', null)
    .order('seller_points', { ascending: false, nullsFirst: false }).limit(40);
  if (!boutiques?.length) return [];
  const { data: articles } = await supabase.from('products')
    .select('shop_id, images').eq('is_active', true)
    .in('shop_id', boutiques.map((b) => b.id)).limit(400);
  // compte_reel() : la règle commune à tout l'environnement pour écarter les comptes de test.
  const proprios = [...new Set(boutiques.map((b) => b.owner_id))];
  const verdicts = await Promise.all(proprios.map((id) => supabase.rpc('compte_reel', { p_user_id: id }).then(({ data }) => (data ? id : null), () => null)));
  const liste = choisirAffiches(boutiques, articles || [], new Set(verdicts.filter(Boolean)), 12, url);
  try { sessionStorage.setItem(CLE, JSON.stringify({ quand: Date.now(), liste })); } catch { /* idem */ }
  return liste;
}
