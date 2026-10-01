// Liens signés des dossiers privés (audit C-2/C-3).
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createSignedUrl = vi.fn();
vi.mock('./supabase', () => ({
  supabase: { storage: { from: () => ({ createSignedUrl }) } },
}));

const { lienSigne } = await import('./fichierPrive');

describe('lienSigne', () => {
  beforeEach(() => createSignedUrl.mockReset());

  it('demande un lien d’une heure et le garde en mémoire', async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://x/sign/chat/a.jpg?token=1' }, error: null });
    expect(await lienSigne('chat', 'u1/a.jpg')).toBe('https://x/sign/chat/a.jpg?token=1');
    expect(await lienSigne('chat', 'u1/a.jpg')).toBe('https://x/sign/chat/a.jpg?token=1');
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(createSignedUrl).toHaveBeenCalledWith('u1/a.jpg', 3600);
  });

  it('rend null quand le stockage refuse (pas le droit de lire)', async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: { message: 'Object not found' } });
    expect(await lienSigne('chat', 'u2/b.jpg')).toBeNull();
  });

  it('ne demande rien sans chemin', async () => {
    expect(await lienSigne('chat', null)).toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});

describe('adresses du dossier privé de Léo', async () => {
  const { cheminLegionPrive, urlLegionPrive } = await import('./fichierPrive');
  it('reconnaît une adresse privée et en tire le chemin', () => {
    const u = urlLegionPrive('e1/documents/a b.pdf');
    expect(u).toContain('/storage/v1/object/authenticated/legion-prive/');
    expect(cheminLegionPrive(u)).toBe('e1/documents/a b.pdf');
    expect(cheminLegionPrive('https://x.supabase.co/storage/v1/object/authenticated/legion-prive/e1/a%20b.wav?x=1')).toBe('e1/a b.wav');
  });
  it('laisse passer les portraits publics et les sites web', () => {
    expect(cheminLegionPrive('https://x.supabase.co/storage/v1/object/public/legion/e1/portraits/p.jpg')).toBeNull();
    expect(cheminLegionPrive('https://example.com/page')).toBeNull();
    expect(cheminLegionPrive(null)).toBeNull();
  });
});
