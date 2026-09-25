// Connecteurs Supabase, Cloudflare, Vercel (0208) : les outils des agents ne
// font que LIRE, et le jeton ne ressort jamais dans ce qu'ils rendent.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { lireService, OUTILS_SERVICES } from '../../supabase/functions/_shared/services.ts';

const JETON = 'jeton-tres-secret-123';
const services = {
  supabase: { projet: 'abcdefghijklmnopqrst', jeton: JETON },
  cloudflare: { compte: '0123456789abcdef0123456789abcdef', jeton: JETON },
  vercel: { equipe: 'team_x', jeton: JETON },
};

function fauxFetch() {
  const appels = [];
  const f = vi.fn(async (url, init) => {
    appels.push({ url: String(url), methode: init?.method, auth: init?.headers?.Authorization });
    const u = String(url);
    const corps = u.includes('/functions') ? [{ slug: 'a', version: 3, status: 'ACTIVE', updated_at: 1790000000000 }]
      : u.includes('/health') ? [{ name: 'db', healthy: true, status: 'ACTIVE_HEALTHY' }]
      : u.includes('api.supabase.com') ? { name: 'P', status: 'ACTIVE_HEALTHY', region: 'eu-west-3', created_at: 'x' }
      : u.includes('/workers/scripts') ? { result: [{ id: 'w1', modified_on: 'm' }] }
      : u.includes('/pages/projects') ? { result: [{ name: 'site', subdomain: 'site.pages.dev', latest_deployment: { created_on: 'c', latest_stage: { status: 'success' } } }] }
      : u.includes('/v9/projects') ? { projects: [{ name: 'app', framework: 'vite', updatedAt: 1790000000000 }] }
      : { deployments: [{ name: 'app', state: 'READY', target: 'production', created: 1790000000000, url: 'app.vercel.app' }] };
    return new Response(JSON.stringify(corps), { status: 200 });
  });
  return { f, appels };
}

afterEach(() => vi.unstubAllGlobals());

describe('connecteurs de services', () => {
  it('trois outils, un par service', () => {
    expect(Object.values(OUTILS_SERVICES).map((o) => o.name)).toEqual(['supabase_projet', 'cloudflare_services', 'vercel_deploiements']);
  });

  it('GET seulement, jeton envoyé au service mais jamais rendu', async () => {
    const { f, appels } = fauxFetch();
    vi.stubGlobal('fetch', f);
    const rendus = [];
    for (const nom of ['supabase_projet', 'cloudflare_services', 'vercel_deploiements']) rendus.push(await lireService(services, nom, {}));
    expect(appels.length).toBe(7);
    expect(appels.every((a) => a.methode === 'GET')).toBe(true);
    expect(appels.every((a) => a.auth === `Bearer ${JETON}`)).toBe(true);
    expect(JSON.stringify(rendus)).not.toContain(JETON);
    expect(rendus[0].fonctions[0]).toMatchObject({ nom: 'a', version: 3 });
    expect(rendus[1].pages[0]).toMatchObject({ nom: 'site', etat: 'success' });
    expect(rendus[2].deploiements[0]).toMatchObject({ projet: 'app', etat: 'READY' });
    expect(appels.find((a) => a.url.includes('vercel')).url).toContain('teamId=team_x');
  });

  it('un service non branché le dit ; un jeton refusé aussi, sans le montrer', async () => {
    expect(await lireService({}, 'vercel_deploiements', {})).toEqual({ erreur: 'aucun compte Vercel branché' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('non', { status: 401 })));
    const r = await lireService({ vercel: services.vercel }, 'vercel_deploiements', {});
    expect(r.projets.erreur).toMatch(/refuse le jeton/);
    expect(JSON.stringify(r)).not.toContain(JETON);
  });
});
