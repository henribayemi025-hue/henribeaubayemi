// Des FAUX pour faire tourner la boucle sans Cloudflare ni vrai modèle :
// des fichiers en mémoire, un bac à sable qui simule quelques commandes, et
// un modèle qui suit un scénario écrit d'avance. Servent aux essais
// (boucle.test.js) et à la démonstration (scripts/demo-locale.mjs).

import { nouvelEtat } from '../src/boucle.js';

export function fauxFichiers(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    m,
    async liste() { return [...m.keys()].sort().map((chemin) => ({ chemin, taille: m.get(chemin).length })); },
    async lire(chemin) { return m.has(chemin) ? m.get(chemin) : null; },
    async ecrire(chemin, contenu) { m.set(chemin, contenu); },
    async supprimer(chemin) { m.delete(chemin); },
  };
}

// Un bac à sable qui « exécute » quelques commandes connues.
export function fauxBac(fichiers, reponses = {}) {
  const lancees = [];
  return {
    lancees,
    async executer(commande) {
      lancees.push(commande);
      if (reponses[commande]) return { secondes: 2, fichiersChanges: [], ...(await reponses[commande](fichiers)) };
      return { code: 127, stdout: '', stderr: `${commande.split(' ')[0]}: commande inconnue du faux bac`, secondes: 0.1 };
    },
  };
}

const appelOutil = (nom, args) => ({ id: `appel_${Math.random().toString(36).slice(2, 10)}`, type: 'function', function: { name: nom, arguments: JSON.stringify(args) } });
export const outil = appelOutil;

// Le modèle : chaque étape du scénario rend { texte?, outils?: [[nom, args]] }.
export function fauxModele(scenario, { usage = { prompt_tokens: 3000, prompt_cache_hit_tokens: 1000, completion_tokens: 400, total_tokens: 3400 } } = {}) {
  const requetes = [];
  let i = 0;
  const fetchFn = async (url, init) => {
    const corps = JSON.parse(init.body);
    requetes.push({ url, corps });
    const etape = scenario[i++];
    if (!etape) throw new Error('le scénario est épuisé');
    if (etape.http) return new Response(etape.corps || 'erreur', { status: etape.http });
    const e = typeof etape === 'function' ? etape(corps) : etape;
    return Response.json({
      choices: [{ finish_reason: e.outils ? 'tool_calls' : 'stop', message: { role: 'assistant', content: e.texte || '', ...(e.outils ? { tool_calls: e.outils.map(([n, a]) => appelOutil(n, a)) } : {}) } }],
      usage,
    });
  };
  return { fetchFn, requetes };
}

export function fausseDeps({ fichiers, bac, fetchFn, env = { DEEPSEEK_API_KEY: 'faux' }, journal = [], arret = () => false, jeton = null, relais = [] }) {
  let t = Date.parse('2026-09-24T20:00:00Z');
  return {
    env,
    jeton,
    relais,
    fichiers,
    bac,
    journal: async (e) => { journal.push(e); },
    cout: async () => {},
    regleAjoutee: async () => {},
    sauver: async () => {},
    fetchFn,
    maintenant: () => new Date((t += 1000)),
    signal: new AbortController().signal,
    arretDemande: arret,
    prixMachineSeconde: 0.00002056,
  };
}

export function fauxEtat(plafond = 1) {
  return nouvelEtat({ id: 'p1', nom: 'Essai' }, new Date('2026-09-24T20:00:00Z'), plafond);
}
