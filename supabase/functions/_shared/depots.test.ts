import { describe, it, expect } from 'vitest';
import { choisirDepot, listeDepots } from './depots';

const finjaro = { depot: 'henribayemi025-hue/henribeaubayemi', depots: ['henribayemi025-hue/henribeaubayemi', 'henribayemi025-hue/Finjaro-learn'] };

describe('choisirDepot (plusieurs dépôts, 02/10)', () => {
  it('une tâche sur Finjaro Learn va dans le dépôt de Learn', () => {
    expect(choisirDepot(finjaro, 'Tu peux te connecter à Finjaro Learn ?')).toBe('henribayemi025-hue/Finjaro-learn');
    expect(choisirDepot(finjaro, "Corriger l'Atelier de learn")).toBe('henribayemi025-hue/Finjaro-learn');
    expect(choisirDepot(finjaro, 'voir finjaro-learn/src/App.tsx')).toBe('henribayemi025-hue/Finjaro-learn');
  });

  it('sinon, le dépôt principal', () => {
    expect(choisirDepot(finjaro, "Poser le bloc « Pourquoi mettre un prix » dans l'écran vendeur")).toBe('henribayemi025-hue/henribeaubayemi');
    expect(choisirDepot(finjaro, '')).toBe('henribayemi025-hue/henribeaubayemi');
  });

  it('« learning » ou « VendorLearn » ne suffisent pas à changer de dépôt', () => {
    expect(choisirDepot(finjaro, 'le learning-centre de la place de marché')).toBe('henribayemi025-hue/henribeaubayemi');
    expect(choisirDepot(finjaro, 'écran VendorLearn')).toBe('henribayemi025-hue/henribeaubayemi');
  });

  it('une entreprise à un seul dépôt, ou sans dépôt valable', () => {
    expect(choisirDepot({ depot: 'acme/site' }, 'Learn')).toBe('acme/site');
    expect(choisirDepot({ depot: 'pas un dépôt' }, 'x')).toBe('');
    expect(choisirDepot(null, 'x')).toBe('');
  });

  it('listeDepots : principal d’abord, sans doublon ni casse différente', () => {
    expect(listeDepots({ depot: 'a/b', depots: ['A/B', 'a/c', 'mauvais'] })).toEqual(['a/b', 'a/c']);
  });
});
