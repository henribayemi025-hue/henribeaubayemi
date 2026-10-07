import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../lib/i18n';

vi.mock('../lib/supabase', () => ({ supabase: {}, storageThumbUrl: () => null }));
const { ArticlesSansPrix } = await import('./ArticlesSansPrix');

describe('carte « Articles sans prix » à l’écran', () => {
  it('montre la plus vue en premier, avec son nombre de vues', async () => {
    const i18n = (await import('../lib/i18n')).default;
    await i18n.changeLanguage('fr');
    const rows = [
      { id: 'a', name: 'Robe peu vue', is_active: true, price_on_request: true, category: 'mode', views: 1 },
      { id: 'b', name: 'Savon très vu', is_active: true, price_on_request: true, category: 'mode', views: 14 },
      { id: 'c', name: 'Sac jamais vu', is_active: true, price_on_request: true, category: 'mode' },
    ];
    render(<MemoryRouter><ArticlesSansPrix shop={{ country: 'CM' }} rows={rows} onChange={() => {}} /></MemoryRouter>);
    const noms = screen.getAllByText(/Robe peu vue|Savon très vu|Sac jamais vu/).map((n) => n.textContent);
    expect(noms).toEqual(['Savon très vu', 'Robe peu vue', 'Sac jamais vu']);
    expect(screen.getByText('Vu 14 fois')).toBeTruthy();
    expect(screen.getByText('Vu 1 fois')).toBeTruthy();
  });
});
