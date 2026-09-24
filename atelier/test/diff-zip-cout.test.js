// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { diff, lignesDiff } from '../src/diff.js';
import { fabriquerZip, crc32 } from '../src/zip.js';
import { coutAppel, estimationMaxAppel, prixMachineParSeconde, lireUsage } from '../src/cout.js';
import { ordre, disponibles } from '../src/moteur.js';

describe('diff', () => {
  it('marque ajouts et retraits', () => {
    const d = diff('a\nb\nc\n', 'a\nB\nc\nd\n');
    expect(d.ajouts).toBe(2);
    expect(d.retraits).toBe(1);
    expect(lignesDiff('a\nb', 'a\nB').map((l) => l.t).join('')).toBe(' -+');
  });
  it('un nouveau fichier, un fichier supprimé', () => {
    expect(diff(null, 'x\ny').nouveau).toBe(true);
    expect(diff('x', null).supprime).toBe(true);
    expect(diff(null, 'x\ny').ajouts).toBe(2);
  });
  it('ne garde que les blocs utiles', () => {
    const avant = Array.from({ length: 100 }, (_, i) => `l${i}`).join('\n');
    const apres = avant.replace('l50', 'L50');
    const d = diff(avant, apres);
    expect(d.blocs).toHaveLength(1);
    expect(d.blocs[0].lignes).toHaveLength(8);
    expect(d.blocs[0].debutAvant).toBe(48);
  });
});

describe('zip', () => {
  it('crc32 connu', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
  it('un zip lisible : signatures et nombre de fichiers', () => {
    const z = fabriquerZip([{ chemin: 'a.txt', contenu: 'bonjour' }, { chemin: 'src/é.js', contenu: 'x' }], { dossier: 'projet' });
    const v = new DataView(z.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(z.length - 22, true)).toBe(0x06054b50);
    expect(v.getUint16(z.length - 12, true)).toBe(2);
  });
});

describe('coût mesuré', () => {
  it('DeepSeek : cache, entrée, sortie aux prix publiés', () => {
    const c = coutAppel('ds:deepseek-flash', { prompt_tokens: 1_000_000, prompt_cache_hit_tokens: 800_000, completion_tokens: 100_000, total_tokens: 1_100_000 });
    // 800k × 0,006 + 200k × 0,30 + 100k × 1,20 (dollars le million)
    expect(c.usd).toBeCloseTo(0.0048 + 0.06 + 0.12, 6);
  });
  it('la réflexion comptée à part est quand même payée', () => {
    expect(lireUsage({ prompt_tokens: 10, completion_tokens: 5, total_tokens: 40 }).sortie).toBe(30);
  });
  it('un modèle sans prix connu ne passe jamais le plafond', () => {
    expect(estimationMaxAppel('xx:inconnu', 10, 10)).toBe(Infinity);
  });
  it('la machine standard-1, estimation haute', () => {
    // 0,5 vCPU × 0,00002 + 4 Gio × 0,0000025 + 8 Go × 0,00000007 = 0,00002056 $/s
    expect(prixMachineParSeconde('standard-1') * 3600).toBeCloseTo(0.074016, 5);
  });
});

describe('Auto sans Gemini', () => {
  it('saute les modèles sans clé, et Gemini quand son plafond est atteint', () => {
    const env = { DEEPSEEK_API_KEY: 'x', GEMINI_API_KEY: 'y' };
    expect(ordre(env, 'auto')).toEqual(['ds:deepseek-flash', 'ds:deepseek-v4-pro', 'gm:gemini-3.5-flash']);
    expect(ordre(env, 'auto', { geminiCoupe: true })).toEqual(['ds:deepseek-flash', 'ds:deepseek-v4-pro']);
    expect(ordre({ KIMI_API_KEY: 'k' }, 'ds:deepseek-flash')).toEqual(['km:kimi-k2.6']);
    expect(disponibles({})).toEqual([]);
  });
  it('un modèle choisi passe en premier, la relève derrière', () => {
    expect(ordre({ DEEPSEEK_API_KEY: 'x', KIMI_API_KEY: 'k' }, 'km:kimi-k2.6')).toEqual(['km:kimi-k2.6']);
  });
});
