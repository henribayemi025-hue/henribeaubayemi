// Jarvis V0 : ce que le modèle comprend est ramené à ce qui existe vraiment.
import { describe, it, expect } from 'vitest';
import { intentionPropre, retrouver } from '../../supabase/functions/_shared/jarvis.ts';

const AGENTS = ['Alpha', 'Ada Nkemba', 'Plume', 'Rigo', 'Claudinette'];
const SALONS = ['Direction', 'Qualite', 'Marketing'];

describe('Jarvis : retrouver un nom dicté', () => {
  it('accents, casse, prénom seul, une faute', () => {
    expect(retrouver('alpha', AGENTS)).toBe('Alpha');
    expect(retrouver('ada', AGENTS)).toBe('Ada Nkemba');
    expect(retrouver('Alfa', AGENTS)).toBe('Alpha');
    expect(retrouver('qualité', SALONS)).toBe('Qualite');
    expect(retrouver('Zorro', AGENTS)).toBeNull();
    expect(retrouver('', AGENTS)).toBeNull();
  });
});

describe('Jarvis : intention propre', () => {
  it('garde une vue connue, refuse une vue inventée', () => {
    expect(intentionPropre({ intention: 'ouvrir_vue', vue: 'ville', reponse: "J'ouvre la ville." }, AGENTS, SALONS)).toMatchObject({ intention: 'ouvrir_vue', vue: 'ville' });
    expect(intentionPropre({ intention: 'ouvrir_vue', vue: 'banque', reponse: 'x' }, AGENTS, SALONS).intention).toBe('inconnu');
  });
  it('un agent qui n existe pas rend l ordre inconnu', () => {
    expect(intentionPropre({ intention: 'parler_a', agent: 'alfa', reponse: 'x' }, AGENTS, SALONS)).toMatchObject({ intention: 'parler_a', agent: 'Alpha' });
    expect(intentionPropre({ intention: 'demander_rapport', agent: 'Batman', reponse: 'x' }, AGENTS, SALONS).intention).toBe('inconnu');
  });
  it('une tâche sans texte ne passe pas ; le refus reste un refus', () => {
    expect(intentionPropre({ intention: 'creer_tache', agent: 'Plume', texte: '', reponse: 'x' }, AGENTS, SALONS).intention).toBe('inconnu');
    expect(intentionPropre({ intention: 'creer_tache', agent: 'plume', texte: 'Écrire le texte du lancement', reponse: 'x' }, AGENTS, SALONS)).toMatchObject({ agent: 'Plume', texte: 'Écrire le texte du lancement' });
    expect(intentionPropre({ intention: 'refuse', reponse: 'Ça, je ne le fais pas à la voix.' }, AGENTS, SALONS).intention).toBe('refuse');
    expect(intentionPropre({ intention: 'payer', reponse: '' }, AGENTS, SALONS)).toMatchObject({ intention: 'inconnu', reponse: "Je n'ai pas compris. Tu redis ?" });
  });
});
