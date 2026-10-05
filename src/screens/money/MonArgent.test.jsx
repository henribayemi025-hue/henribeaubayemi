// Mon argent (05/10) : ce qu'on ne pouvait pas faire et qu'on peut faire
// maintenant — modifier ou supprimer une ligne de budget, ajouter sa part à
// un projet, cocher « j'ai payé » dans un njangi, saisir un mouvement
// d'espace sans fenêtre surgissante. On vérifie ce qui part à la base.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const appels = [];
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table) => ({
      insert: (ligne) => { appels.push(['insert', table, ligne]); return Promise.resolve({ error: null }); },
      update: (v) => ({ eq: (c, val) => { appels.push(['update', table, v, c, val]); return Promise.resolve({ error: null }); } }),
      delete: () => {
        const filtres = [];
        const chaine = {
          eq: (c, v) => { filtres.push([c, v]); return chaine; },
          then: (ok, ko) => { appels.push(['delete', table, filtres]); return Promise.resolve({ error: null }).then(ok, ko); },
        };
        return chaine;
      },
    }),
  },
}));
const horsLigne = vi.fn(async () => ({ enFile: false }));
vi.mock('../../lib/fileAttente', () => ({ ajouter: (...a) => horsLigne(...a), enAttente: () => [], ecouterFile: () => () => {} }));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, profile: { name: 'Awa' } }) }));
const toastErreur = vi.fn();
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ error: toastErreur, success: vi.fn(), info: vi.fn() }) }));
vi.mock('../../hooks/useSettings', () => ({ useSettings: () => ({ currency: 'EUR' }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k, i18n: { language: 'fr' } }) }));
vi.mock('./ChatEspace', () => ({ default: () => null }));

const { LigneBudget, CarteProjet, Njangi, Espaces } = await import('./MonArgent');
const t = (k) => k;
const onDone = vi.fn();

beforeEach(() => { appels.length = 0; onDone.mockClear(); horsLigne.mockClear(); toastErreur.mockClear(); });

describe('ligne de budget', () => {
  const ligne = { id: 'b1', kind: 'expense', category: 'Loyer', planned: 500, actual: 0 };

  it('saisit le réel du mois, avec une virgule', async () => {
    render(<ul><LigneBudget ligne={ligne} devise="EUR" lang="fr-FR" t={t} onDone={onDone} /></ul>);
    fireEvent.click(screen.getByLabelText('money.editLine'));
    fireEvent.change(screen.getByLabelText('money.actual'), { target: { value: '512,40' } });
    fireEvent.click(screen.getByText('common.save'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(appels).toEqual([['update', 'budget_entries', { category: 'Loyer', planned: 500, actual: 512.4 }, 'id', 'b1']]);
  });

  it('supprime après confirmation dans la page', async () => {
    render(<ul><LigneBudget ligne={ligne} devise="EUR" lang="fr-FR" t={t} onDone={onDone} /></ul>);
    fireEvent.click(screen.getByLabelText('money.deleteLine'));
    expect(appels).toEqual([]);
    fireEvent.click(screen.getByText('common.delete'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(appels).toEqual([['delete', 'budget_entries', [['id', 'b1']]]]);
  });

  it("une ligne encore en file d'attente ne se modifie pas", () => {
    render(<ul><LigneBudget ligne={{ ...ligne, id: undefined, _enAttente: true }} devise="EUR" lang="fr-FR" t={t} onDone={onDone} /></ul>);
    expect(screen.queryByLabelText('money.editLine')).toBeNull();
  });
});

describe('projet commun', () => {
  it('ajoute ma part', async () => {
    render(<ul><CarteProjet projet={{ id: 'p1', name: 'Mariage', goal: 1000, recu: 200 }} devise="EUR" lang="fr-FR" t={t} onDone={onDone} /></ul>);
    fireEvent.click(screen.getByText('money.contribute'));
    fireEvent.change(screen.getByLabelText('money.contributeTo'), { target: { value: '50' } });
    fireEvent.click(screen.getByText('common.add'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(appels).toEqual([['insert', 'project_contributions', { project_id: 'p1', user_id: 'u1', name: 'Awa', amount: 50 }]]);
  });
});

describe('njangi', () => {
  const njangi = (payes) => ({
    id: 'n1', name: 'Tontine', amount: 20, frequency: 'monthly', current_round: 3,
    membres: [{ user_id: 'u1', name: 'Awa', position: 1 }, { user_id: 'u2', name: 'Bébé', position: 3 }],
    payes,
  });

  it("je coche « j'ai payé » pour le tour en cours", async () => {
    render(<Njangi devise="EUR" njangis={[njangi([])]} moi="u1" lang="fr-FR" t={t} onDone={onDone} />);
    fireEvent.click(screen.getByText('money.iPaid'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(appels).toEqual([['insert', 'njangi_payments', { njangi_id: 'n1', round: 3, user_id: 'u1', name: 'Awa' }]]);
  });

  it('je retire mon paiement si je me suis trompé·e', async () => {
    render(<Njangi devise="EUR" njangis={[njangi([{ user_id: 'u1', round: 3 }])]} moi="u1" lang="fr-FR" t={t} onDone={onDone} />);
    fireEvent.click(screen.getByText('money.undoPaid'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(appels).toEqual([['delete', 'njangi_payments', [['njangi_id', 'n1'], ['round', 3], ['user_id', 'u1']]]]);
  });
});

describe("mouvement d'espace partagé", () => {
  it('se saisit dans la page, sans window.prompt', async () => {
    const prompt = vi.spyOn(window, 'prompt');
    const espace = { id: 's1', name: 'Maison', solde: 0, entre: 0, sorti: 0, tx: [], membres: [] };
    render(<Espaces devise="EUR" espaces={[espace]} moi="u1" lang="fr-FR" t={t} onDone={onDone} />);
    fireEvent.click(screen.getByText('Maison'));
    fireEvent.click(screen.getAllByText(/money.moneyOut/)[0]);
    fireEvent.change(screen.getByLabelText('money.txLabel'), { target: { value: 'Courses' } });
    fireEvent.change(screen.getByLabelText(/money.txAmount/), { target: { value: '18,90' } });
    fireEvent.click(screen.getByText('common.add'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(prompt).not.toHaveBeenCalled();
    expect(horsLigne).toHaveBeenCalledWith('space_tx', { space_id: 's1', user_id: 'u1', kind: 'out', label: 'Courses', amount: 18.9 });
  });
});
