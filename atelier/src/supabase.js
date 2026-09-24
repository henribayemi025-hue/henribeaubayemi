// Supabase, vu de l'atelier : QUI est là, et la trace durable.
//
// - Le Worker vérifie la session Supabase de l'utilisateur (son jeton
//   d'accès) auprès de Supabase lui-même.
// - V0 : réservé à Beau. Passe si l'identifiant est dans ATELIER_UTILISATEURS,
//   ou si la personne est PROPRIÉTAIRE de l'entreprise Finjaro dans Léo
//   (ATELIER_ENTREPRISE) — lu dans legion_membres avec SON jeton, sous les
//   règles d'accès déjà en place (un membre voit les membres de son
//   entreprise).
// - Aucune clé de service : le Worker n'a que la clé publique (celle qui est
//   déjà dans chaque navigateur) et le jeton de la personne. Il écrit donc
//   dans les tables atelier_* sous les règles d'accès (RLS), comme elle.
// - Ces écritures sont « au mieux » : si la migration n'est pas encore
//   appliquée, l'atelier marche quand même (tout est aussi gardé dans le
//   Durable Object), et on le dit une fois dans les journaux du Worker.

const cacheAcces = new Map(); // jeton → { user, autorise, expire }

function entetes(env, jeton) {
  return { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' };
}

export async function identifier(env, jeton, fetchFn = fetch) {
  if (!jeton || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  const deja = cacheAcces.get(jeton);
  if (deja && deja.expire > Date.now()) return deja;
  const r = await fetchFn(`${env.SUPABASE_URL}/auth/v1/user`, { headers: entetes(env, jeton) });
  if (!r.ok) return null;
  const user = await r.json();
  if (!user?.id) return null;
  const liste = String(env.ATELIER_UTILISATEURS || '').split(',').map((s) => s.trim()).filter(Boolean);
  let autorise = liste.includes(user.id);
  if (!autorise && env.ATELIER_ENTREPRISE) {
    const q = await fetchFn(`${env.SUPABASE_URL}/rest/v1/legion_membres?select=role&entreprise_id=eq.${encodeURIComponent(env.ATELIER_ENTREPRISE)}&user_id=eq.${encodeURIComponent(user.id)}`, { headers: entetes(env, jeton) });
    if (q.ok) {
      const lignes = await q.json();
      autorise = Array.isArray(lignes) && lignes.some((l) => l.role === 'proprietaire');
    }
  }
  const rendu = { user: { id: user.id, email: user.email || null }, autorise, expire: Date.now() + 5 * 60_000 };
  cacheAcces.set(jeton, rendu);
  if (cacheAcces.size > 200) cacheAcces.delete(cacheAcces.keys().next().value);
  return rendu;
}

let absentJusqua = 0;
export function enregistreur(env, jeton, fetchFn = fetch) {
  async function ecrire(table, ligne, { maj = false } = {}) {
    if (!jeton || Date.now() < absentJusqua) return;
    try {
      const r = await fetchFn(`${env.SUPABASE_URL}/rest/v1/${table}${maj ? '?on_conflict=id' : ''}`, {
        method: 'POST',
        headers: { ...entetes(env, jeton), Prefer: maj ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal' },
        body: JSON.stringify(ligne),
      });
      if (!r.ok) {
        const t = await r.text();
        // Table absente (migration pas encore appliquée) : on se tait 10 minutes.
        if (r.status === 404 || /42P01|PGRST205|does not exist|Could not find the table/i.test(t)) {
          absentJusqua = Date.now() + 10 * 60_000;
          console.warn('atelier : tables atelier_* absentes — trace gardée seulement dans le Durable Object.');
        } else console.error(`atelier : ${table} ${r.status} ${t.slice(0, 200)}`);
      }
    } catch (e) {
      console.error(`atelier : ${table} ${e.message}`);
    }
  }
  return {
    projet: (p) => ecrire('atelier_projets', p, { maj: true }),
    session: (s) => ecrire('atelier_sessions', s, { maj: true }),
    journal: (j) => ecrire('atelier_journal', j),
    cout: (c) => ecrire('atelier_couts', c),
    demande: (d) => ecrire('atelier_demandes', d, { maj: true }),
    regle: (r) => ecrire('atelier_autorisations', r, { maj: true }),
  };
}
