// Les connecteurs Supabase, Cloudflare et Vercel d'une entreprise (0208) :
// ses agents LISENT l'état de SES services — projets, fonctions, Workers,
// déploiements — jamais ceux d'une autre entreprise, et n'écrivent jamais
// chez le service (des GET seulement). Le jeton sort du coffre au moment de
// lire et ne revient jamais dans une réponse.

// deno-lint-ignore no-explicit-any
type Service = any;
export type Services = {
  supabase?: { projet: string; jeton: string };
  cloudflare?: { compte: string; jeton: string };
  vercel?: { equipe: string | null; jeton: string };
};

export async function servicesDe(service: Service, entrepriseId: string): Promise<Services> {
  const { data } = await service.from('legion_connecteurs').select('type, config').eq('entreprise_id', entrepriseId).eq('actif', true).in('type', ['supabase', 'cloudflare', 'vercel']);
  const r: Services = {};
  for (const c of data || []) {
    const { data: jeton } = await service.rpc('legion_jeton_service', { p_entreprise: entrepriseId, p_type: c.type });
    if (!jeton) continue;
    if (c.type === 'supabase' && c.config?.projet) r.supabase = { projet: c.config.projet, jeton };
    if (c.type === 'cloudflare' && c.config?.compte) r.cloudflare = { compte: c.config.compte, jeton };
    if (c.type === 'vercel') r.vercel = { equipe: c.config?.equipe || null, jeton };
  }
  return r;
}

async function lire(url: string, jeton: string) {
  const r = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${jeton}`, Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
  if (r.status === 401 || r.status === 403) throw new Error(`le service refuse le jeton (${r.status}) : il a peut-être expiré, ou il lui manque le droit de lecture`);
  if (!r.ok) throw new Error(`le service répond ${r.status}`);
  return r.json();
}

export const OUTILS_SERVICES = {
  supabase: { name: 'supabase_projet', description: "Le projet Supabase de NOTRE entreprise (connecteur) : état, région, santé des services (base, authentification, stockage…) et la liste de ses fonctions edge (version, date de mise à jour). Lecture seule.",
    parameters: { type: 'OBJECT', properties: {} } },
  cloudflare: { name: 'cloudflare_services', description: "Le compte Cloudflare de NOTRE entreprise (connecteur) : ses Workers (date de dernière modification) et ses projets Pages (dernier déploiement, état, branche). Lecture seule.",
    parameters: { type: 'OBJECT', properties: {} } },
  vercel: { name: 'vercel_deploiements', description: "Le compte Vercel de NOTRE entreprise (connecteur) : ses projets et les derniers déploiements (projet, état, cible, date, adresse). Lecture seule.",
    parameters: { type: 'OBJECT', properties: { projet: { type: 'STRING', description: 'Facultatif : le nom d’un projet pour ne voir que ses déploiements.' } } } },
};
export const NOMS_OUTILS_SERVICES = new Set(Object.values(OUTILS_SERVICES).map((o) => o.name));

export async function lireService(s: Services, nom: string, args: Record<string, unknown>): Promise<unknown> {
  if (nom === 'supabase_projet') {
    if (!s.supabase) return { erreur: 'aucun projet Supabase branché' };
    const { projet, jeton } = s.supabase;
    const base = `https://api.supabase.com/v1/projects/${projet}`;
    const [p, f, h] = await Promise.all([
      lire(base, jeton).catch((e: Error) => ({ erreur: e.message })),
      lire(`${base}/functions`, jeton).catch((e: Error) => ({ erreur: e.message })),
      lire(`${base}/health?services=auth&services=db&services=rest&services=storage&services=realtime`, jeton).catch((e: Error) => ({ erreur: e.message })),
    ]);
    return {
      projet: p?.erreur ? p : { nom: p.name, etat: p.status, region: p.region, cree_le: p.created_at },
      fonctions: Array.isArray(f) ? f.slice(0, 80).map((x: Record<string, unknown>) => ({ nom: x.slug, version: x.version, etat: x.status, maj: x.updated_at ? new Date(Number(x.updated_at)).toISOString() : null })) : f,
      sante: Array.isArray(h) ? h.map((x: Record<string, unknown>) => ({ service: x.name, sain: x.healthy, etat: x.status })) : h,
    };
  }
  if (nom === 'cloudflare_services') {
    if (!s.cloudflare) return { erreur: 'aucun compte Cloudflare branché' };
    const { compte, jeton } = s.cloudflare;
    const base = `https://api.cloudflare.com/client/v4/accounts/${compte}`;
    const [w, pg] = await Promise.all([
      lire(`${base}/workers/scripts`, jeton).catch((e: Error) => ({ erreur: e.message })),
      lire(`${base}/pages/projects`, jeton).catch((e: Error) => ({ erreur: e.message })),
    ]);
    return {
      workers: Array.isArray(w?.result) ? w.result.slice(0, 80).map((x: Record<string, unknown>) => ({ nom: x.id, modifie_le: x.modified_on, cree_le: x.created_on })) : w,
      pages: Array.isArray(pg?.result) ? pg.result.slice(0, 40).map((x: Record<string, unknown>) => {
        const d = (x.latest_deployment || {}) as Record<string, unknown>;
        const etape = (d.latest_stage || {}) as Record<string, unknown>;
        return { nom: x.name, domaine: x.subdomain, branche: (d.deployment_trigger as { metadata?: { branch?: string } } | undefined)?.metadata?.branch, dernier_deploiement: d.created_on, etat: etape.status };
      }) : pg,
    };
  }
  if (nom === 'vercel_deploiements') {
    if (!s.vercel) return { erreur: 'aucun compte Vercel branché' };
    const { equipe, jeton } = s.vercel;
    const q = equipe ? `teamId=${encodeURIComponent(equipe)}&` : '';
    const projetVoulu = String(args.projet || '').trim();
    const [pr, dp] = await Promise.all([
      lire(`https://api.vercel.com/v9/projects?${q}limit=40`, jeton).catch((e: Error) => ({ erreur: e.message })),
      lire(`https://api.vercel.com/v6/deployments?${q}limit=20${projetVoulu ? `&app=${encodeURIComponent(projetVoulu)}` : ''}`, jeton).catch((e: Error) => ({ erreur: e.message })),
    ]);
    return {
      projets: Array.isArray(pr?.projects) ? pr.projects.map((x: Record<string, unknown>) => ({ nom: x.name, cadre: x.framework, maj: x.updatedAt ? new Date(Number(x.updatedAt)).toISOString() : null })) : pr,
      deploiements: Array.isArray(dp?.deployments) ? dp.deployments.map((x: Record<string, unknown>) => ({ projet: x.name, etat: x.state || x.readyState, cible: x.target, cree_le: x.created ? new Date(Number(x.created)).toISOString() : null, adresse: x.url })) : dp,
    };
  }
  return { erreur: 'outil inconnu' };
}
