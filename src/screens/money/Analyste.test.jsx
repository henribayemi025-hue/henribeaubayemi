// Analyste (05/10) : on peut aller lire un autre mois que le mois en cours,
// et le plus gros poste de dépense est dit en clair.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Analyste from './Analyste';

const t = (k, o) => (o ? `${k}:${JSON.stringify(o)}` : k);
const mois = (pas) => { const d = new Date(); const x = new Date(d.getFullYear(), d.getMonth() + pas, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };

describe('Analyste', () => {
  const lignes = [
    { id: 1, kind: 'expense', category: 'Loyer', planned: 500, actual: 500, period: mois(0) },
    { id: 2, kind: 'expense', category: 'Transport', planned: 50, actual: 100, period: mois(0) },
    { id: 3, kind: 'expense', category: 'Loyer de novembre', planned: 500, actual: 300, period: mois(1) },
  ];

  it('dit le plus gros poste du mois', () => {
    render(<Analyste lignes={lignes} comptes={[]} epargne={[]} lang="fr-FR" devise="EUR" t={t} />);
    expect(screen.getByText(/money.anBiggest.*Loyer.*83/)).toBeTruthy();
  });

  it('va lire le mois suivant', () => {
    render(<Analyste lignes={lignes} comptes={[]} epargne={[]} lang="fr-FR" devise="EUR" t={t} />);
    expect(screen.queryByText('Loyer de novembre')).toBeNull();
    fireEvent.click(screen.getByLabelText('money.nextMonth'));
    expect(screen.getAllByText('Loyer de novembre').length).toBeGreaterThan(0);
  });
});
