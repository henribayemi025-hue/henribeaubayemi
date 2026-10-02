// Le relais d'images /img/ est public et met en cache 30 jours : il ne doit
// servir que les dossiers publics (audit du 01/10, lot 1).
import { describe, it, expect, vi } from 'vitest';
import worker from './worker';

// Cache API de Cloudflare, absente hors Workers : un cache vide suffit ici.
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };

const env = { ASSETS: { fetch: vi.fn(async () => new Response('page')) } };
const ctx = { waitUntil: () => {} };
const demande = (chemin) => worker.fetch(new Request(`https://finjaro.net${chemin}`), env, ctx);

describe('relais /img/', () => {
  it.each([
    ['/img/chat/u1/photo.jpeg'],
    ['/img/ids/u1/piece.jpg'],
    ['/img/legion/e1/document.pdf'],
    ['/img/legion-prive/e1/document.pdf'],
    ['/img/inconnu/x.png'],
  ])('refuse un dossier privé ou inconnu : %s', async (chemin) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const r = await demande(chemin);
    expect(r.status).toBe(404);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('laisse passer un dossier public vers le stockage', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('img', { status: 200, headers: { 'Content-Type': 'image/webp', 'Content-Length': '3' } }));
    const r = await demande('/img/products/u1/a.webp');
    expect(r.status).toBe(200);
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/storage/v1/object/public/products/u1/a.webp');
    fetchSpy.mockRestore();
  });

  it('une vignette absente répond 404, pas 400 (audit m-17)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"statusCode":"404","error":"not_found","message":"Object not found"}', { status: 400 }));
    const r = await demande('/img/products/u1/a_thumb.webp');
    expect(r.status).toBe(404);
    fetchSpy.mockRestore();
  });
});

describe('en-têtes de sécurité (M-1)', () => {
  it('chaque page servie par le Worker les porte', async () => {
    const r = await demande('/services');
    expect(await r.text()).toBe('page');
    expect(r.headers.get('Strict-Transport-Security')).toBe('max-age=15552000');
    expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(r.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(r.headers.get('Content-Security-Policy')).toMatch(/^frame-ancestors 'self' /);
  });

  it('public/_headers porte les mêmes valeurs pour les fichiers servis sans le Worker', async () => {
    const { readFileSync } = await import('node:fs');
    const { EN_TETES_SECURITE } = await import('./worker');
    const fichier = readFileSync(`${process.cwd()}/public/_headers`, 'utf8');
    const bloc = fichier.slice(fichier.indexOf('\n/*\n'));
    for (const [cle, valeur] of Object.entries(EN_TETES_SECURITE)) expect(bloc).toContain(`${cle}: ${valeur}`);
  });
});

describe('Learn réservé à la préproduction', () => {
  it.each([['/learn'], ['/learn/'], ['/learn/assets/index.js'], ['/learn/visages/maya.webp']])(
    'finjaro.net renvoie %s vers l’accueil', async (chemin) => {
      const r = await demande(chemin);
      expect(r.status).toBe(302);
      expect(r.headers.get('Location')).toBe('/');
    });

  it('la préproduction sert Learn', async () => {
    env.ASSETS.fetch.mockClear();
    const r = await worker.fetch(new Request('https://staging-finjaro.finjaro.workers.dev/learn/'), env, ctx);
    expect(r.status).toBe(200);
    expect(env.ASSETS.fetch).toHaveBeenCalled();
  });

  it('une adresse qui commence seulement par learn n’est pas touchée', async () => {
    const r = await demande('/learning-centre');
    expect(r.status).toBe(200);
  });
});

describe('CSP en mode rapport (M-1 suite)', () => {
  it('le site la porte, sans eval', async () => {
    const r = await demande('/services');
    const v = r.headers.get('Content-Security-Policy-Report-Only');
    expect(v).toContain("default-src 'self'");
    expect(v).toContain('report-uri /csp-rapport');
    expect(v).not.toContain("'unsafe-eval'");
    expect(v).not.toContain('cdn.jsdelivr.net');
    // la protection contre l'encadrement reste, elle, bloquante
    expect(r.headers.get('Content-Security-Policy')).toContain('frame-ancestors');
  });

  it('Learn seul reçoit unsafe-eval (code de l’élève dans un Worker)', async () => {
    const r = await worker.fetch(new Request('https://staging-finjaro.finjaro.workers.dev/learn/'), env, ctx);
    const v = r.headers.get('Content-Security-Policy-Report-Only');
    expect(v).toContain("'unsafe-eval'");
    expect(v).toContain('https://cdn.jsdelivr.net'); // Pyodide (Python dans le navigateur)
  });

  it('/csp-rapport accepte un rapport et ne renvoie rien', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const corps = JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src', 'blocked-uri': 'https://mal.example/x.js', 'document-uri': 'https://finjaro.net/?jeton=secret' } });
    const r = await worker.fetch(new Request('https://finjaro.net/csp-rapport', { method: 'POST', body: corps }), env, ctx);
    expect(r.status).toBe(204);
    expect(log.mock.calls[0][1]).toContain('script-src');
    expect(log.mock.calls[0][1]).not.toContain('secret');
    log.mockRestore();
    expect((await demande('/csp-rapport')).status).toBe(405);
  });
});
