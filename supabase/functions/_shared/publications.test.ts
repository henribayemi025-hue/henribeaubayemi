import { describe, it, expect } from 'vitest';
import { lundiDe, normaliserPublications, resumePublications, PRODUCTION_CLAUDE } from './publications';

const FINJARO = [...PRODUCTION_CLAUDE][0];
const AUTRE = '00000000-0000-4000-8000-000000000001';
const ctx = (entrepriseId = AUTRE) => ({ entrepriseId, tacheId: 't1', livrableId: 'l1', auteurId: 'a1', maintenant: new Date('2026-10-08T10:00:00Z') });
const pub = (extra: Record<string, unknown> = {}) => ({ jour: 1, plateforme: 'Instagram', format: 'image', accroche: 'Nouvel arrivage', legende: 'Trois robes en wax, tailles 38 à 44.', visuel: 'Photo des robes sur cintre', appel_action: 'Commandez sur la boutique', pourquoi: 'Question fréquente en commentaire', ...extra });

describe('lundiDe', () => {
  it('rend le lundi de la semaine, et le lendemain pour un dimanche', () => {
    expect(lundiDe(new Date('2026-10-08T10:00:00Z'))).toBe('2026-10-05'); // jeudi
    expect(lundiDe(new Date('2026-10-05T00:30:00Z'))).toBe('2026-10-05'); // lundi
    expect(lundiDe(new Date('2026-10-11T18:00:00Z'))).toBe('2026-10-12'); // dimanche → semaine suivante
  });
});

describe('normaliserPublications', () => {
  it('garde les champs, la semaine et les identifiants', () => {
    const [l] = normaliserPublications([pub()], ctx());
    expect(l).toMatchObject({ entreprise_id: AUTRE, tache_id: 't1', livrable_id: 'l1', auteur_id: 'a1', semaine: '2026-10-05', jour: 1, format: 'image', statut: 'proposee', video_statut: 'aucune', video: null });
  });

  it("laisse de côté ce qui n'a ni accroche ni légende, et s'arrête à sept", () => {
    const liste = [pub({ accroche: '' }), ...Array.from({ length: 9 }, (_, i) => pub({ jour: i + 1 }))];
    const lignes = normaliserPublications(liste, ctx());
    expect(lignes).toHaveLength(7);
    expect(lignes.map((l) => l.jour)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('un jour en double ou hors de 1 à 7 prend la place libre suivante', () => {
    const lignes = normaliserPublications([pub({ jour: 3 }), pub({ jour: 3 }), pub({ jour: 12 })], ctx());
    expect(lignes.map((l) => l.jour)).toEqual([1, 2, 3]);
  });

  it('reconnaît les formats écrits autrement', () => {
    const f = (format: string) => normaliserPublications([pub({ format, video: { plans: [{ secondes: '0-3', image: 'La robe en gros plan' }] } })], ctx())[0].format;
    expect(f('Reel')).toBe('video_courte');
    expect(f('Carrousel')).toBe('carrousel');
    expect(f('story')).toBe('statut');
    expect(f('photo')).toBe('image');
  });

  it('une vidéo sans plan devient une image : il n’y a rien à filmer', () => {
    const [l] = normaliserPublications([pub({ format: 'video_courte', video: { plans: [] } })], ctx());
    expect(l.format).toBe('image');
    expect(l.video_statut).toBe('aucune');
  });

  it('un brief vidéo part à Claude chez Finjaro, et reste à filmer ailleurs', () => {
    const v = { duree_s: 15, voix_off: 'Nouveautés de la semaine', plans: [{ secondes: '0-3', image: 'Les robes en main', texte_ecran: 'Nouvel arrivage' }] };
    expect(normaliserPublications([pub({ format: 'video_courte', video: v })], ctx(FINJARO))[0].video_statut).toBe('a_produire');
    const ailleurs = normaliserPublications([pub({ format: 'video_courte', video: v })], ctx(AUTRE))[0];
    expect(ailleurs.video_statut).toBe('brief');
    expect(ailleurs.video).toEqual(v);
  });

  it('coupe les textes trop longs sans casser', () => {
    const [l] = normaliserPublications([pub({ accroche: 'x'.repeat(900) })], ctx());
    expect(l.accroche.length).toBe(400);
    expect(l.accroche.endsWith('…')).toBe(true);
  });

  it("ne plante pas sur ce qui n'est pas une liste", () => {
    expect(normaliserPublications(null, ctx())).toEqual([]);
    expect(normaliserPublications({ jour: 1 }, ctx())).toEqual([]);
  });
});

describe('resumePublications', () => {
  it('dit ce qui attend, et où', () => {
    const lignes = normaliserPublications([pub(), pub({ format: 'video_courte', video: { plans: [{ secondes: '0-3', image: 'Gros plan' }] } })], ctx(FINJARO));
    expect(resumePublications(lignes)).toMatch(/2 publications attendent votre accord.*Réseaux sociaux.*1 brief vidéo, transmis à Claude/);
    expect(resumePublications([], false)).toBe('');
  });
});
