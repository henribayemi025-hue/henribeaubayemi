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
