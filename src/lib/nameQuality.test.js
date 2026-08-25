import { describe, it, expect } from 'vitest';
import { articlesSansVraiNom } from './nameQuality';

// Les noms viennent du VRAI catalogue (relevé le 25/08). Se tromper ici
// propose de renommer un article correctement nommé — insultant pour la
// vendeuse qui a pris le temps. Les cas « à ne PAS toucher » comptent donc
// autant que les autres.
const photo = ['x/y.webp'];
const p = (id, name) => ({ id, name, images: photo });

describe('articlesSansVraiNom', () => {
  it('repere une serie numerotee (« Baby 1 » … « Baby 63 »)', () => {
    const rows = Array.from({ length: 10 }, (_, i) => p(`b${i}`, `Baby ${i + 1}`));
    expect(articlesSansVraiNom(rows)).toHaveLength(10);
  });

  it('repere « T-shirt no name 1 » … « 18 »', () => {
    const rows = Array.from({ length: 18 }, (_, i) => p(`t${i}`, `T-shirt no name ${i + 1}`));
    expect(articlesSansVraiNom(rows)).toHaveLength(18);
  });

  it('repere le meme nom repete (« Ensemble » cinq fois)', () => {
    const rows = Array.from({ length: 5 }, (_, i) => p(`e${i}`, 'Ensemble'));
    expect(articlesSansVraiNom(rows)).toHaveLength(5);
  });

  it('repere un nom trop court pour decrire quoi que ce soit', () => {
    expect(articlesSansVraiNom([p('a', 'Bo'), p('b', 'XL')])).toEqual(['a', 'b']);
  });

  it('laisse tranquille un vrai nom qui finit par un chiffre', () => {
    const rows = [
      p('a', 'Samsung Galaxy S22+ 256Go'),
      p('b', 'JW Red Label 75cl'),
      p('c', 'Tonnelles 30 euros 1'),
      p('d', 'Lot de 3 paires de chaussettes blanches en coton'),
    ];
    expect(articlesSansVraiNom(rows)).toEqual([]);
  });

  it('laisse tranquille deux articles seulement qui partagent un prefixe', () => {
    // Deux ne font pas une serie: il en faut trois pour conclure que le nom
    // commun numerote a servi.
    const rows = [p('a', 'Chemise dashiki 1'), p('b', 'Chemise dashiki 2')];
    expect(articlesSansVraiNom(rows)).toEqual([]);
  });

  it('repere « Robe 1 » / « Robe 2 » meme a deux: le numero ne sauve pas un mot de famille', () => {
    expect(articlesSansVraiNom([p('a', 'Robe 1'), p('b', 'Robe 2')])).toEqual(['a', 'b']);
  });

  it('repere un nom fait uniquement de mots de famille', () => {
    const rows = [p('a', 'Robe'), p('b', 'Produit bébé'), p('c', 'Paire'), p('d', 'Bebe')];
    expect(articlesSansVraiNom(rows)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('laisse tranquille un nom de famille des qu un mot concret s ajoute', () => {
    const rows = [
      p('a', 'Robe maya'),
      p('b', 'Ensemble turban et bijoux assortis'),
      p('c', 'Sac à langer bébé motif pois et lapin'),
      p('d', 'Boubou'),
    ];
    expect(articlesSansVraiNom(rows)).toEqual([]);
  });

  it('laisse tranquille deux vrais noms identiques: c est du commerce normal', () => {
    // Vecu: le seuil abaisse a deux visait « Lunette soudeur » et
    // « YAKA Baobab » en double, qui sont de vrais articles.
    const rows = [p('a', 'Lunette soudeur'), p('b', 'Lunette soudeur'), p('c', 'YAKA Baobab'), p('d', 'YAKA Baobab')];
    expect(articlesSansVraiNom(rows)).toEqual([]);
  });

  it('ignore un article sans photo: Finia n aurait rien a lire', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: `n${i}`, name: 'Ensemble', images: [] }));
    expect(articlesSansVraiNom(rows)).toEqual([]);
  });
});
