// Le gardien du rechargement: la mise à jour ne doit JAMAIS recharger
// l'écran après le premier geste de l'utilisatrice. Les deux pannes du
// 27/08 (connexion coupée en plein envoi, Finia tué au retour de l'appareil
// photo) venaient toutes deux d'un rechargement parti pendant qu'une vraie
// personne se servait de l'app.
import { describe, it, expect } from 'vitest';
import { creerGardienRechargement } from './swUpdate';

function fauxWindow() {
  const handlers = {};
  return {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    fire: (type) => handlers[type]?.({}),
  };
}

describe('creerGardienRechargement', () => {
  it('autorise le rechargement tant que personne n\'a touché l\'écran', () => {
    const g = creerGardienRechargement();
    g.ecouter(fauxWindow());
    expect(g.peutRecharger()).toBe(true);
  });

  it('interdit le rechargement dès le premier doigt posé', () => {
    const g = creerGardienRechargement();
    const win = fauxWindow();
    g.ecouter(win);
    win.fire('pointerdown');
    expect(g.peutRecharger()).toBe(false);
  });

  it('interdit le rechargement dès la première touche clavier — le cas du mot de passe', () => {
    const g = creerGardienRechargement();
    const win = fauxWindow();
    g.ecouter(win);
    win.fire('keydown');
    expect(g.peutRecharger()).toBe(false);
  });
});
