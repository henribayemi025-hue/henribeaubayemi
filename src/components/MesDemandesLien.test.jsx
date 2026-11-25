// Le lien « Mes demandes » (retour d'une testeuse, 25/11) : invisible tant
// qu'aucune demande n'est partie de ce téléphone, visible avec le nombre ensuite.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MesDemandesLien } from './MesDemandesLien';
import { garderDemande } from '../lib/mesDemandes';

function ouvrir() {
  return render(<MemoryRouter><MesDemandesLien /></MemoryRouter>);
}

describe('MesDemandesLien', () => {
  beforeEach(() => localStorage.clear());

  it("ne montre rien sans demande envoyée", () => {
    ouvrir();
    expect(screen.queryByTestId('mes-demandes-lien')).toBeNull();
  });

  it('mène à /ma-commande avec le nombre de demandes', () => {
    garderDemande({ id: 'a1', no: 'FJ-1', shop: 'Boutique A' });
    garderDemande({ id: 'b2', no: 'FJ-2', shop: 'Boutique B' });
    ouvrir();
    const lien = screen.getByTestId('mes-demandes-lien');
    expect(lien.getAttribute('href')).toBe('/ma-commande');
    expect(lien.textContent).toContain('2');
  });
});
