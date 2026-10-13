import { describe, it, expect } from 'vitest';
import fr from '../locales/fr/translation.json';
import en from '../locales/en/translation.json';
import i18n from './i18n';
import { ASSISTANT_NAME } from './assistant';
import { aboutFor } from '../legal/about';
import { privacyFor } from '../legal/privacy';

const valeurs = (o) => Object.values(o).flatMap((v) => (v && typeof v === 'object' ? valeurs(v) : [String(v)]));

describe('le nom de l’assistante, à un seul endroit (réunion du 10/10)', () => {
  it('s’appelle « Finou Chou » la première année', () => {
    expect(ASSISTANT_NAME).toBe('Finou Chou');
  });

  it('tous les textes la nomment par {{assistant}}, jamais en dur', () => {
    for (const langue of [fr, en]) {
      expect(valeurs(langue).filter((v) => /\bFinia\b/.test(v))).toEqual([]);
    }
  });

  it('les textes de l’application affichent le nom courant', () => {
    expect(i18n.t('finou.title')).toBe(ASSISTANT_NAME);
    expect(i18n.t('finou.greeting')).toContain(ASSISTANT_NAME);
  });

  it('les pages À propos et Confidentialité aussi, sans marqueur resté en route', () => {
    for (const doc of [aboutFor('fr'), aboutFor('en'), privacyFor('fr'), privacyFor('en')]) {
      const texte = JSON.stringify(doc);
      expect(texte).not.toContain('{{assistant}}');
      expect(texte).not.toMatch(/\bFinia\b/);
      expect(texte).toContain(ASSISTANT_NAME);
    }
  });
});
