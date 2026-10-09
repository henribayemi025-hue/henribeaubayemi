// Audit des 200 profils (M1) : la bulle de Finia cachait le prix d'un article au
// téléphone. Elle s'efface dès qu'on fait défiler la page, et ne revient plus.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, o) => (k === 'finou.hints' && o?.returnObjects ? ['Une idée cadeau ?', 'Trouve-moi une robe wax'] : k) }),
}));
vi.mock('../hooks/useUI', () => ({ useUI: () => ({ openFinou: vi.fn() }) }));
vi.mock('../hooks/useUnreadMessages', () => ({ useUnreadMessages: () => 0 }));
vi.mock('./TabBar', () => ({ TabBar: () => null }));

const { BuyerNav } = await import('./BuyerNav');
const rendre = () => render(<MemoryRouter initialEntries={['/']}><BuyerNav /></MemoryRouter>);

beforeEach(() => { localStorage.clear(); });

describe('bulle de Finia sur l’accueil', () => {
  it('s’affiche au premier passage', () => {
    rendre();
    expect(screen.getByText('Une idée cadeau ?')).toBeTruthy();
  });
  it('s’efface quand on fait défiler la page, et ne revient plus', () => {
    const { unmount } = rendre();
    const page = document.createElement('main');
    document.body.appendChild(page);
    Object.defineProperty(page, 'scrollTop', { value: 200, configurable: true });
    act(() => { fireEvent.scroll(page); });
    expect(screen.queryByText('Une idée cadeau ?')).toBeNull();
    unmount();
    rendre();
    expect(screen.queryByText('Une idée cadeau ?')).toBeNull();
  });
  it('reste en place pour un tout petit défilement (remise en place au chargement)', () => {
    rendre();
    const page = document.createElement('main');
    document.body.appendChild(page);
    Object.defineProperty(page, 'scrollTop', { value: 10, configurable: true });
    act(() => { fireEvent.scroll(page); });
    expect(screen.getByText('Une idée cadeau ?')).toBeTruthy();
  });
});
