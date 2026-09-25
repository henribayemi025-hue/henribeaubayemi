// La ville de chacun (Beau, 25/09 : « dans la cité, les bâtiments ce sont mes projets, ou
// les clients de ma boutique, ou mes boutiques » ; « un Minecraft »). Chaque bâtiment est une
// vraie chose de la personne ; sa hauteur vient d'une activité mesurée, jamais inventée.
// Une personne qui vient d'arriver a des terrains à bâtir, pas des immeubles.

export const MAX_BOUTIQUES = 6;
export const MAX_CLIENTS = 12;

const ANNULEE = new Set(['cancelled', 'canceled', 'annulee', 'refused', 'rejected']);
export const estLivree = (c) => !!c.delivered_at || c.status === 'delivered' || c.status === 'livree';
export const estAnnulee = (c) => !!c.cancelled_at || ANNULEE.has(c.status);

// Le prénom seulement, pour la plaque du client (son nom complet reste dans l'espace vendeuse).
export function prenom(nom) {
  const p = String(nom || '').trim().split(/\s+/)[0] || '';
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
}

// boutiques : [{ id, name, slug, avatar_url, banner_url }]
// articles : [{ shop_id, is_active }]
// commandes : [{ id, shop_id, buyer_id, guest_id, buyer_name, status, delivered_at, cancelled_at }]
// reels : Set des buyer_id qui ne sont PAS des comptes de test (les invités comptent)
export function batirVille({ boutiques = [], articles = [], commandes = [], reels = null } = {}) {
  const valides = commandes.filter((c) => !estAnnulee(c) && (!c.buyer_id || !reels || reels.has(c.buyer_id)));
  const parBoutique = new Map(boutiques.map((b) => [b.id, { articles: 0, commandes: 0, livrees: 0 }]));
  for (const a of articles) if (a.is_active !== false && parBoutique.has(a.shop_id)) parBoutique.get(a.shop_id).articles += 1;
  for (const c of valides) { const s = parBoutique.get(c.shop_id); if (!s) continue; s.commandes += 1; if (estLivree(c)) s.livrees += 1; }
  const mesBoutiques = boutiques.map((b) => {
    const s = parBoutique.get(b.id);
    // Un étage de base, un par commande livrée, un tous les 3 articles en ligne (plafond 14).
    return { id: b.id, nom: b.name, slug: b.slug, image: b.banner_url || b.avatar_url || null, ...s, etages: Math.min(14, 1 + s.livrees + Math.floor(s.articles / 3)) };
  }).sort((a, b) => b.etages - a.etages || String(a.nom).localeCompare(String(b.nom))).slice(0, MAX_BOUTIQUES);
  // Les clients : une maison par personne qui a commandé (compte ou invité), un étage par commande.
  const parClient = new Map();
  for (const c of valides) {
    const cle = c.buyer_id || c.guest_id || `nom:${prenom(c.buyer_name)}`;
    if (!parClient.has(cle)) parClient.set(cle, { cle, prenom: prenom(c.buyer_name), commandes: 0, livrees: 0 });
    const x = parClient.get(cle); x.commandes += 1; if (estLivree(c)) x.livrees += 1;
    if (!x.prenom) x.prenom = prenom(c.buyer_name);
  }
  const mesClients = [...parClient.values()].map((x) => ({ ...x, etages: Math.min(8, x.commandes) }))
    .sort((a, b) => b.commandes - a.commandes || a.prenom.localeCompare(b.prenom)).slice(0, MAX_CLIENTS);
  return { boutiques: mesBoutiques, clients: mesClients, totalClients: parClient.size };
}
