import { describe, it, expect } from 'vitest';
import { messageAtelier } from './messages';

describe('messages du Worker de l’atelier', () => {
  it('reste en français pour un compte français', () => {
    expect(messageAtelier('Donne un nom au projet.', 'fr')).toBe('Donne un nom au projet.');
  });
  it('passe en anglais pour un compte anglais', () => {
    expect(messageAtelier('Donne un nom au projet.', 'en')).toBe('Give the project a name.');
    expect(messageAtelier('Plafond de la session atteint (0.5 $).', 'en')).toBe('Session limit reached ($0.5).');
    expect(messageAtelier('30 projets au plus en V0.', 'en')).toBe('30 projects at most for now.');
  });
  it('laisse tel quel un message inconnu', () => {
    expect(messageAtelier('quelque chose de neuf', 'en')).toBe('quelque chose de neuf');
  });
});
