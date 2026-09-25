import { describe, it, expect } from 'vitest';
import { composer, horsEquipe, repartition, pourLaBase, parDepartement, lireFichierPostes, choixVide, estModifiee, clePoste, visageDe } from './equipe';

const MODELE = [
  { departement: 'Direction', poste: 'Directrice générale', mandat: 'Tranche.', des_la_taille: 'cocon', est_directeur: true, poids: 1, ordre: 1 },
  { departement: 'Vente', poste: 'Chef des ventes', mandat: 'Dirige la vente.', des_la_taille: 'cocon', est_directeur: true, poids: 1, ordre: 2 },
  { departement: 'Vente', poste: 'Vendeur', mandat: 'Vend.', des_la_taille: 'cocon', est_directeur: false, poids: 4, ordre: 3 },
  { departement: 'Vente', poste: 'Vendeur', mandat: 'doublon', des_la_taille: 'cocon', est_directeur: false, poids: 4, ordre: 4 },
  { departement: 'Marketing', poste: 'Responsable marketing', mandat: 'Fait venir.', des_la_taille: 'startup', est_directeur: true, poids: 1, ordre: 5 },
  { departement: 'Marketing', poste: 'Community manager', mandat: 'Anime.', des_la_taille: 'scaleup', est_directeur: false, poids: 2, ordre: 6 },
];

describe('composer', () => {
  it('ouvre les postes de la taille, sans doublon', () => {
    const e = composer(MODELE, 3);
    expect(e.map((p) => p.poste)).toEqual(['Directrice générale', 'Chef des ventes', 'Vendeur']);
    expect(composer(MODELE, 25).map((p) => p.poste)).toContain('Responsable marketing');
    expect(composer(MODELE, 25).map((p) => p.poste)).not.toContain('Community manager');
  });
  it('retire, ajoute et réécrit — un poste ajouté est toujours ouvert', () => {
    const choix = { retires: { [clePoste('Vendeur')]: true }, ajoutes: [{ departement: 'Atelier', poste: 'Développeuse web', mandat: 'Code.', poids: 2, origine: 'leo' }], mandats: { [clePoste('Chef des ventes')]: 'Nouveau mandat.' } };
    const e = composer(MODELE, 3, choix);
    expect(e.map((p) => p.poste)).toEqual(['Directrice générale', 'Chef des ventes', 'Développeuse web']);
    expect(e[1].mandat).toBe('Nouveau mandat.');
    expect(e[2]).toMatchObject({ ajoute: true, des_la_taille: 'cocon', origine: 'leo', poids: 2 });
    expect(estModifiee(choix)).toBe(true);
    expect(estModifiee(choixVide())).toBe(false);
  });
  it('n’ouvre jamais plus de postes du modèle que de personnes ; ce qu’on ajoute s’ajoute par-dessus', () => {
    const e = composer(MODELE, 2);
    expect(e.map((p) => p.poste)).toEqual(['Directrice générale', 'Chef des ventes']);
    expect(horsEquipe(MODELE, 2).map((p) => [p.poste, p.raison])).toEqual([['Vendeur', 'effectif'], ['Responsable marketing', 'taille'], ['Community manager', 'taille']]);
    const avec = composer(MODELE, 2, { ...choixVide(), ajoutes: [{ departement: 'Atelier', poste: 'Dev', mandat: 'Code.' }] });
    expect(avec.map((p) => p.poste)).toEqual(['Directrice générale', 'Chef des ventes', 'Dev']);
    // Un poste retiré libère la place pour le suivant du modèle.
    expect(composer(MODELE, 2, { ...choixVide(), retires: { [clePoste('Chef des ventes')]: true } }).map((p) => p.poste)).toEqual(['Directrice générale', 'Vendeur']);
  });
  it('ne compte pas deux fois un poste ajouté qui existe déjà (accents, majuscules)', () => {
    const e = composer(MODELE, 3, { ...choixVide(), ajoutes: [{ departement: 'Vente', poste: 'VENDEUR', mandat: 'x' }] });
    expect(e.filter((p) => clePoste(p.poste) === 'vendeur')).toHaveLength(1);
    expect(e.find((p) => clePoste(p.poste) === 'vendeur').ajoute).toBe(false);
  });
});

describe('horsEquipe', () => {
  it('dit pourquoi un poste manque : retiré, ou ouvert plus tard', () => {
    const d = horsEquipe(MODELE, 3, { ...choixVide(), retires: { vendeur: true } });
    expect(d.map((p) => [p.poste, p.raison])).toEqual([['Vendeur', 'retire'], ['Responsable marketing', 'taille'], ['Community manager', 'taille']]);
  });
});

describe('repartition', () => {
  it('fait exactement l’effectif, directeurs seuls, prorata des poids', () => {
    const e = composer(MODELE, 25);
    const r = repartition(e, 25);
    expect(Object.values(r).reduce((s, n) => s + n, 0)).toBe(25);
    expect(r[clePoste('Directrice générale')]).toBe(1);
    expect(r[clePoste('Chef des ventes')]).toBe(1);
    expect(r[clePoste('Vendeur')]).toBe(22);
  });
  it('donne une personne par poste quand l’effectif ne dépasse pas les postes', () => {
    const e = composer(MODELE, 3);
    expect(Object.values(repartition(e, 2))).toEqual([1, 1, 1]);
  });
});

describe('pourLaBase et parDepartement', () => {
  it('n’envoie que ce que la base lit, dans l’ordre de l’écran', () => {
    const e = composer(MODELE, 3, { ...choixVide(), ajoutes: [{ departement: 'Atelier', poste: 'Dev', mandat: 'Code.', poids: 99, agent_cle: 'dev' }] });
    const b = pourLaBase(e);
    expect(Object.keys(b[0])).toEqual(['departement', 'poste', 'mandat', 'est_directeur', 'poids', 'agent_cle', 'a_ecrire']);
    expect(b[3]).toEqual({ departement: 'Atelier', poste: 'Dev', mandat: 'Code.', est_directeur: false, poids: 8, agent_cle: 'dev', a_ecrire: false });
  });
  it('groupe par département, directeur en tête', () => {
    const d = parDepartement([MODELE[2], MODELE[1], MODELE[0]]);
    expect(d.map((x) => x.nom)).toEqual(['Vente', 'Direction']);
    expect(d[0].postes[0].poste).toBe('Chef des ventes');
  });
});

describe('lireFichierPostes', () => {
  it('lit un CSV avec en-tête (poste, département, mandat, directeur)', () => {
    const p = lireFichierPostes('Département;Poste;Mandat;Directeur\nVente;Vendeur;Vend bien.;non\nVente;Chef des ventes;Dirige.;oui\nVente;vendeur;doublon;non');
    expect(p).toEqual([
      { departement: 'Vente', poste: 'Vendeur', mandat: 'Vend bien.', est_directeur: false, poids: 1, origine: 'fichier' },
      { departement: 'Vente', poste: 'Chef des ventes', mandat: 'Dirige.', est_directeur: true, poids: 1, origine: 'fichier' },
    ]);
  });
  it('lit aussi l’anglais tabulé, et rend null pour du texte libre', () => {
    expect(lireFichierPostes('Job title\tTeam\nSales rep\tSales')).toEqual([{ departement: 'Sales', poste: 'Sales rep', mandat: '', est_directeur: false, poids: 1, origine: 'fichier' }]);
    expect(lireFichierPostes('Il me faut quelqu’un pour la paie et deux vendeurs.')).toBeNull();
    expect(lireFichierPostes('a,b\n')).toBeNull();
  });
});

describe('visageDe', () => {
  it('est stable pour le même poste du même modèle', () => {
    expect(visageDe('conseil', 'Directeur financier')).toBe(visageDe('conseil', 'directeur financier'));
    expect(visageDe('conseil', 'Directeur financier')).toContain('seed=conseil-directeur-financier');
  });
});
