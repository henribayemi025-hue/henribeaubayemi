// Affiches de la ville : vraies boutiques seulement, leurs propres photos.
import { describe, it, expect } from 'vitest';
import { choisirAffiches } from './affiches';

describe('affiches du monde 3D', () => {
  const boutiques = [
    { id: 's1', owner_id: 'u1', name: 'Kora Mode', slug: 'kora', status: 'active' },
    { id: 's2', owner_id: 'test', name: 'Boutique test', slug: 't', status: 'active' },
    { id: 's3', owner_id: 'u3', name: 'Cachée', slug: 'c', status: 'active', moderation_hidden_at: '2026-09-01' },
    { id: 's4', owner_id: 'u4', name: 'Sans photo', slug: 'n', status: 'active' },
    { id: 's5', owner_id: 'u5', name: 'Bannière', slug: 'b', status: 'active', banner_url: 'https://x/b.jpg' },
  ];
  const articles = [
    { shop_id: 's1', images: ['https://x/1.jpg', 'https://x/2.jpg'] },
    { shop_id: 's1', images: ['https://x/3.jpg'] },
    { shop_id: 's2', images: ['https://x/t.jpg'] },
    { shop_id: 's4', images: ['blob:local'] },
    { shop_id: 's5', images: [] },
  ];
  it('écarte les comptes de test, les boutiques masquées et celles sans photo', () => {
    const url = (seau, chemin, vignette) => `${seau}:${chemin}${vignette ? ':v' : ''}`;
    const l = choisirAffiches(boutiques, articles, new Set(['u1', 'u3', 'u4', 'u5']), 12, url);
    expect(l).toEqual([
      { nom: 'Kora Mode', slug: 'kora', image: 'products:https://x/1.jpg:v', secours: 'products:https://x/1.jpg' },
      { nom: 'Bannière', slug: 'b', image: 'shops:https://x/b.jpg:v', secours: 'shops:https://x/b.jpg' },
    ]);
  });
  it('respecte le maximum', () => {
    expect(choisirAffiches(boutiques, articles, new Set(['u1', 'u5']), 1)).toHaveLength(1);
  });
});
