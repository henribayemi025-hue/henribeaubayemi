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
