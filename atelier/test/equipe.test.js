// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { equipe } from '../src/equipe.js';
import { envoyer, decider, consigneSysteme } from '../src/boucle.js';
import { fauxFichiers, fauxBac, fauxModele, fausseDeps, fauxEtat } from './faux.js';

const ENT = '11111111-1111-1111-1111-111111111111';
const AGENTS = [
  { id: 'a1', cle: 'awa', nom: 'Awa Mensah', poste: 'Développeuse full-stack', departement: 'Développement', peut_coder: true, actif: true, avatar_url: 'x' },
  { id: 'a2', cle: 'idris', nom: 'Idris Kamga', poste: 'Testeur', departement: 'Développement', peut_coder: false, actif: true },
  { id: 'a3', cle: 'nour', nom: 'Nour', poste: 'Rédactrice', departement: 'Marketing', peut_coder: false, actif: false },
];

// Une fausse base : répond aux lectures et garde les écritures.
function fausseBase() {
  const ecrits = [];
  const fetchFn = async (url, opts = {}) => {
    const u = String(url);
    if (opts.method === 'POST') {
      const corps = JSON.parse(opts.body || '{}');
      ecrits.push({ url: u, corps });
      if (u.includes('/legion_agents')) return new Response(JSON.stringify([{ id: 'a9', ...corps }]), { status: 201 });
      return new Response('[]', { status: 201 });
    }
    if (u.includes('legion_entreprises')) return Response.json([{ nom: 'AutoLoc', projet: 'Une marketplace de voitures d\'occasion.' }]);
    if (u.includes('legion_agents') && u.includes('user_id=eq.')) return Response.json([{ id: 'fondateur' }]);
    if (u.includes('legion_agents')) return Response.json(AGENTS);
    if (u.includes('legion_canaux')) return Response.json([{ id: 'c1', nom: 'Développement', cle: 'developpement' }, { id: 'c0', nom: 'Direction', cle: 'direction' }]);
    if (u.includes('genre=eq.tache')) return Response.json([{ id: 't1', texte: 'Awa te demande : écris les tests', meta: {} }]);
    if (u.includes('tache_id')) return Response.json([{ texte: 'Voici 12 tests.', meta: { livrable: { tache_id: 't1' } } }]);
    return Response.json([]);
  };
  return { fetchFn, ecrits };
}
const env = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'k' };

describe('equipe.js', () => {
  it('connaît le projet, l\'équipe et qui code', async () => {
    const b = fausseBase();
    const leo = equipe({ env, jeton: 'j', user: 'u', entrepriseId: ENT, pid: 'p1', fetchFn: b.fetchFn });
    const ctx = await leo.contexte();
    expect(ctx.nom).toBe('AutoLoc');
    expect(ctx.codeur.nom).toBe('Awa Mensah');
    expect(ctx.fondateur).toBe('fondateur');
    const consigne = consigneSysteme({ projet: { nom: 'site' }, mode: 'demander' }, ctx);
    expect(consigne).toMatch(/Tu es Awa Mensah/);
    expect(consigne).toMatch(/marketplace de voitures/);
    expect(consigne).toMatch(/Idris Kamga : Testeur/);
  });

  it('confie une tâche urgente au bon collègue, dans son salon, et réveille l\'équipe', async () => {
    const b = fausseBase();
    const leo = equipe({ env, jeton: 'j', user: 'u', entrepriseId: ENT, pid: 'p1', fetchFn: b.fetchFn });
    const ctx = await leo.contexte();
    const r = await leo.confier(ctx, { collegue: 'idris', tache: 'Écris les tests du formulaire d\'annonce.' });
    expect(r.ok).toBe(true);
    const t = b.ecrits.find((x) => x.url.includes('legion_messages')).corps;
    expect(t).toMatchObject({ genre: 'tache', assigne_a: 'a2', canal_id: 'c1', auteur_id: 'fondateur', user_id: 'u' });
    expect(t.meta).toMatchObject({ statut: 'a_faire', priorite: 'urgente', par_atelier: { projet_id: 'p1', agent: 'Awa Mensah' } });
    expect(b.ecrits.some((x) => x.url.endsWith('/functions/v1/legion-travail'))).toBe(true);
    expect((await leo.confier(ctx, { collegue: 'Awa', tache: 'se confier à soi-même' })).ok).toBe(false);
    expect((await leo.confier(ctx, { collegue: 'Nour', tache: 'écris un texte de lancement' })).texte).toMatch(/en veille/);
    expect((await leo.confier(ctx, { collegue: 'Zorro', tache: 'quelque chose de long' })).texte).toMatch(/Collègues : Awa/);
  });

  it('lit le travail rendu', async () => {
    const b = fausseBase();
    const leo = equipe({ env, jeton: 'j', user: 'u', entrepriseId: ENT, pid: 'p1', fetchFn: b.fetchFn });
    const r = await leo.travaux();
    expect(r.texte).toMatch(/RENDU/);
    expect(r.texte).toMatch(/Voici 12 tests/);
  });

  it('sans entreprise, pas d\'équipe', () => {
    expect(equipe({ env, jeton: 'j', user: 'u', entrepriseId: null, pid: 'p1' })).toBeNull();
  });
});

describe('la boucle avec l\'équipe', () => {
  async function monter(scenario) {
    const f = fauxFichiers({ 'index.html': '<h1>Salut</h1>' });
    const modele = fauxModele(scenario);
    const base = fausseBase();
    const leo = equipe({ env, jeton: 'j', user: 'u', entrepriseId: ENT, pid: 'p1', fetchFn: base.fetchFn });
    const ctx = await leo.contexte();
    const journal = [];
    const deps = { ...fausseDeps({ fichiers: f, bac: fauxBac(f, {}), fetchFn: modele.fetchFn, journal }), leo: { ...leo, ctx } };
    return { modele, base, deps, journal, etat: fauxEtat(1) };
  }

  it('Awa confie les tests à Idris sans carte, et le modèle a les outils d\'équipe', async () => {
    const m = await monter([
      { outils: [['confier_a_collegue', { collegue: 'Idris', tache: 'Teste le formulaire d\'annonce sur téléphone.' }]] },
      { texte: 'J\'ai confié les tests à Idris.' },
    ]);
    await envoyer(m.etat, m.deps, 'fais tester le formulaire par ton équipe');
    expect(m.etat.session.statut).toBe('pret');
    expect(m.modele.requetes[0].corps.tools.map((t) => t.function.name)).toContain('confier_a_collegue');
    expect(m.journal.find((j) => j.outil === 'confier_a_collegue').decision).toBe('auto_equipe');
    expect(m.base.ecrits.some((x) => x.url.includes('legion_messages'))).toBe(true);
  });

  it('recruter s\'arrête sur une carte, puis crée l\'agent après l\'accord', async () => {
    const m = await monter([
      { outils: [['recruter', { nom: 'Léa', poste: 'Designer', mandat: 'Dessine les écrans.', pourquoi: 'Personne ne fait le design.' }]] },
      { texte: 'Léa est arrivée.' },
    ]);
    m.etat.mode = 'auto';
    await envoyer(m.etat, m.deps, 'recrute un designer');
    expect(m.etat.demande.recrue).toMatchObject({ nom: 'Léa', poste: 'Designer' });
    expect(m.base.ecrits.some((x) => x.url.includes('legion_agents'))).toBe(false);
    await decider(m.etat, m.deps, m.etat.demande.id, 'une_fois');
    const a = m.base.ecrits.find((x) => x.url.includes('legion_agents')).corps;
    expect(a).toMatchObject({ nom: 'Léa', poste: 'Designer', cle: 'lea', autonomie: 'supervise' });
    expect(m.deps.leo.ctx.agents.some((x) => x.nom === 'Léa')).toBe(true);
  });
});
