import { describe, it, expect } from 'vitest';
import { court, phraseAgent, phrasePassant, PASSANTS, creerBavardage, dureeBulle } from './paroles';

describe('ce que disent les habitants de la ville', () => {
  it('raccourcit une tâche à un mot entier, sans « X te demande : »', () => {
    expect(court('Beau te demande : prépare le calendrier des publications de vendredi pour Instagram et Facebook')).toBe('prépare le calendrier des publications de…');
    expect(court('Relire la fiche.')).toBe('Relire la fiche');
    expect(court('')).toBe('');
  });

  it('fait dire à un agent ce qu’il fait vraiment, sans rien inventer', () => {
    expect(phraseAgent({ cas: 'aFaire', tache: 'Rédiger la lettre du vendredi' })).toContain('Rédiger la lettre du vendredi');
    expect(phraseAgent({ cas: 'travaille', tache: 'Comparer trois fournisseurs' }, 'en')).toContain('Comparer trois fournisseurs');
    // Sans tâche connue, il ne dit pas « je travaille sur : » dans le vide.
    expect(phraseAgent({ cas: 'travaille', tache: '' })).toBeNull();
    expect(phraseAgent({ cas: 'pause', tache: '' })).toBe('Petite pause, je reviens.');
    // En veille ou en réunion : il ne parle pas.
    expect(phraseAgent({ cas: 'veille' })).toBeNull();
    expect(phraseAgent({ cas: 'reunion' })).toBeNull();
    expect(phraseAgent({ cas: 'attend', raison: 'revue' })).toBe('J\'ai fini. Tu peux relire mon travail ?');
    expect(phraseAgent({ cas: 'attend', raison: 'inconnue' }, 'en')).toBe('I\'m waiting for you, I need you.');
  });

  it('varie la phrase d’un agent d’une fois sur l’autre', () => {
    const a = phraseAgent({ cas: 'dispo' }, 'fr', 0), b = phraseAgent({ cas: 'dispo' }, 'fr', 1);
    expect(a).not.toBe(b);
  });

  it('a 20 phrases de passants par langue, courtes, sans pays ni monnaie', () => {
    for (const l of ['fr', 'en']) {
      expect(PASSANTS[l].toujours).toHaveLength(20);
      for (const liste of Object.values(PASSANTS[l])) {
        for (const p of liste) {
          expect(p.length).toBeLessThan(70);
          expect(p).not.toMatch(/FCFA|Cameroun|Cameroon|Douala|Yaoundé|diaspora|\d/i);
        }
      }
    }
  });

  it('accorde la phrase d’un passant au ciel réel', () => {
    const toutes = (o) => Array.from({ length: 60 }, (_, n) => phrasePassant({ ...o, n, graine: n }));
    // Sous la pluie, personne ne dit « quel beau temps ».
    expect(toutes({ phase: 'jour', genre: 'pluie' }).some((p) => PASSANTS.fr.clair.includes(p))).toBe(false);
    expect(toutes({ phase: 'jour', genre: 'pluie' }).some((p) => PASSANTS.fr.pluie.includes(p))).toBe(true);
    // La nuit, ciel clair : pas de « quel beau temps » non plus, mais « il est tard ».
    expect(toutes({ phase: 'nuit', genre: 'clair' }).some((p) => PASSANTS.fr.clair.includes(p))).toBe(false);
    expect(toutes({ phase: 'nuit', genre: 'clair' }).some((p) => PASSANTS.fr.nuit.includes(p))).toBe(true);
    // En anglais, des phrases anglaises.
    expect(PASSANTS.en.toujours).toContain(phrasePassant({ langue: 'en', phase: 'jour', genre: 'couvert', graine: 3, n: 2 }) ?? '');
  });

  it('un passant ne répète pas sa phrase tout de suite, deux voisins ne disent pas la même', () => {
    const o = { phase: 'jour', genre: 'clair' };
    expect(phrasePassant({ ...o, graine: 4, n: 0 })).not.toBe(phrasePassant({ ...o, graine: 4, n: 1 }));
    expect(phrasePassant({ ...o, graine: 4, n: 0 })).not.toBe(phrasePassant({ ...o, graine: 5, n: 0 }));
  });

  it('une seule bulle à la fois, et la même personne pas avant un long moment', () => {
    const b = creerBavardage({ pauseEntre: 4, memePersonne: 40 });
    expect(b.peut('a', 0)).toBe(true);
    b.parle('a', 0, 3);
    expect(b.combien('a')).toBe(1);
    expect(b.peut('b', 2)).toBe(false); // la bulle de a est encore là
    expect(b.peut('b', 7.5)).toBe(true); // 3 s de bulle + 4 s de pause
    expect(b.peut('a', 20)).toBe(false); // a vient de parler
    expect(b.peut('a', 41)).toBe(true);
    b.parle('b', 8, 5);
    b.fini(9); // b s'est éloigné : sa bulle s'efface
    expect(b.peut('c', 13.5)).toBe(true);
  });

  it('laisse une bulle le temps d’être lue, sans s’éterniser', () => {
    expect(dureeBulle('Salut !')).toBe(3);
    expect(dureeBulle('x'.repeat(300))).toBe(6);
  });
});
