// Le monde 3D de Léo (Beau, 25/09) — la logique, sans écran, pour la tester.
// Règle : ce qui bouge = ce qui se passe vraiment. Un agent n'est dans la
// salle de réunion que si une réunion a lieu ; il ne tape à son bureau que
// s'il a vraiment écrit ou pris une tâche il y a moins de dix minutes.

const DIX_MIN = 10 * 60 * 1000;
const CRENEAU = 4 * 60 * 1000;

// Un agent qui attend sa tâche (il ne tape pas) fait des pauses dans le hall,
// à tour de rôle : trois créneaux de 4 minutes sur cinq environ. Le même calcul
// sert partout, donc on ne le voit jamais à deux endroits à la fois.
export function enPause(id, maintenant = Date.now()) {
  return graine(`${id}:${Math.floor(maintenant / CRENEAU)}`) % 5 < 3;
}

// Les corps (Microsoft Rocketbox, MIT) : genre et teint, pour choisir celui
// qui ressemble le plus au portrait de l'agent.
export const CORPS = [
  { id: 'Business_Female_01', g: 'f', teint: 'fonce' },
  { id: 'Female_Party_02', g: 'f', teint: 'moyen' },
  { id: 'Business_Female_04', g: 'f', teint: 'clair' },
  { id: 'Female_Adult_05', g: 'f', teint: 'clair' },
  { id: 'Female_Adult_09', g: 'f', teint: 'clair' },
  { id: 'Female_Adult_15', g: 'f', teint: 'clair' },
  { id: 'Business_Female_02', g: 'f', teint: 'clair' },
  { id: 'Male_Adult_12', g: 'm', teint: 'fonce' },
  { id: 'Business_Male_05', g: 'm', teint: 'fonce' },
  { id: 'Male_Adult_04', g: 'm', teint: 'moyen' },
  { id: 'Male_Adult_07', g: 'm', teint: 'moyen' },
  { id: 'Business_Male_02', g: 'm', teint: 'clair' },
  { id: 'Business_Male_06', g: 'm', teint: 'clair' },
  { id: 'Male_Adult_08', g: 'm', teint: 'clair' },
  { id: 'Male_Adult_09', g: 'm', teint: 'clair' },
];
export const RECEPTIONNISTE = 'Business_Female_01';

function graine(s) {
  let h = 2166136261;
  for (const c of String(s || '')) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h);
}

// Genre et teint lus dans la description du portrait (quand elle existe).
export function traitsDe(agent) {
  const a = agent?.apparence || {};
  const d = ` ${String(a.description || '').toLowerCase()} `;
  let g = null;
  if (/\b(woman|female|she|her|girl|lady|femme)\b/.test(d)) g = 'f';
  else if (/\b(man|male|he|his|boy|gentleman|homme)\b/.test(d)) g = 'm';
  let teint = null;
  if (/\b(black|african|dark[- ]skinned|dark skin|deep brown|ebony)\b/.test(d)) teint = 'fonce';
  else if (/\b(latino|latina|hispanic|south asian|indian|middle eastern|arab|mixed|olive|tan|brown)\b/.test(d)) teint = 'moyen';
  else if (/\b(east asian|asian|european|caucasian|white|pale|fair)\b/.test(d)) teint = 'clair';
  if (!teint && /^[0-9a-f]{6}$/i.test(a.peau || '')) {
    const n = parseInt(a.peau, 16);
    const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    teint = l < 0.38 ? 'fonce' : l < 0.62 ? 'moyen' : 'clair';
  }
  return { g, teint };
}

// Toujours le même corps pour le même agent ; la réceptionniste garde le sien.
export function corpsDe(agent) {
  const { g, teint } = traitsDe(agent);
  const h = graine(agent?.id || agent?.nom);
  let choix = CORPS.filter((c) => c.id !== RECEPTIONNISTE && (!g || c.g === g) && (!teint || c.teint === teint));
  if (!choix.length) choix = CORPS.filter((c) => c.id !== RECEPTIONNISTE && (!g || c.g === g));
  if (!choix.length) choix = CORPS.filter((c) => c.id !== RECEPTIONNISTE);
  return choix[h % choix.length];
}

// La réunion en cours (même lecture que la salle de réunion 2D).
export function reunionsEnCours(messages, maintenant = Date.now()) {
  const m = new Map();
  for (const x of messages || []) {
    const id = x.meta?.reunion?.id;
    if (!id) continue;
    if (!m.has(id)) m.set(id, { id, propos: [], fin: false, dernier: 0 });
    const r = m.get(id);
    if (x.meta.reunion.fin) r.fin = true;
    else if (x.genre !== 'tache') r.propos.push(x);
    r.dernier = Math.max(r.dernier, Date.parse(x.created_at) || 0);
  }
  // Une réunion sans compte rendu depuis plus d'une heure n'est plus « en cours ».
  const vivantes = [...m.values()].filter((r) => !r.fin && maintenant - r.dernier < 60 * 60 * 1000 && r.propos.length);
  vivantes.sort((a, b) => b.dernier - a.dernier);
  return vivantes.map(decrireReunion);
}
function decrireReunion(r) {
  r.propos.sort((a, b) => (a.meta.reunion.ordre ?? 0) - (b.meta.reunion.ordre ?? 0) || String(a.created_at).localeCompare(String(b.created_at)));
  const participants = [...new Set(r.propos.map((p) => p.auteur_id).filter(Boolean))];
  const parle = r.propos[r.propos.length - 1]?.auteur_id || null;
  const sujet = String(r.propos[0]?.texte || '').split('\n')[0].replace(/[#*]/g, '').slice(0, 90);
  return { id: r.id, participants, parle, sujet };
}
export const reunionEnCours = (messages, maintenant) => reunionsEnCours(messages, maintenant)[0] || null;

// Qui est où, maintenant. Rien n'est inventé : sans activité récente, un agent
// n'est nulle part dans le monde (il est « chez lui »).
export function quiOuEst({ agents = [], messages = [], taches = [], maintenant = Date.now() }) {
  const machines = agents.filter((a) => !a.user_id && a.actif !== false);
  const reunions = reunionsEnCours(messages, maintenant);
  const reunion = reunions[0] || null;
  const enReunion = new Set(reunions.flatMap((x) => x.participants));
  const actifs = new Map();
  for (const m of messages) {
    if (m.user_id || !m.auteur_id || m.meta?.reunion) continue;
    const t = Date.parse(m.created_at);
    if (maintenant - t <= DIX_MIN) actifs.set(m.auteur_id, { depuis: t, texte: m.texte });
  }
  for (const x of taches) {
    const prise = Date.parse(x.meta?.travaille_depuis || '');
    const rendue = Date.parse(x.meta?.livre_le || '');
    if (x.assigne_a && Number.isFinite(prise) && maintenant - prise <= DIX_MIN && !(rendue >= prise)) {
      actifs.set(x.assigne_a, { depuis: prise, texte: x.texte, tache: x.texte });
    }
  }
  const ids = new Set(machines.map((a) => a.id));
  const auBureau = [...actifs.entries()].filter(([id]) => ids.has(id) && !enReunion.has(id)).map(([id, v]) => ({ id, ...v }));
  // À leur poste sans taper : les agents allumés qui ont une tâche ouverte
  // (confiée, pas encore rendue). C'est vrai : ils ont du travail en cours.
  const occupes = new Set([...auBureau.map((b) => b.id), ...enReunion]);
  const aLeurPoste = [];
  for (const x of taches) {
    const st = x.meta?.statut;
    if (!x.assigne_a || !ids.has(x.assigne_a) || occupes.has(x.assigne_a) || x.termine_le || ['fait', 'revue', 'bloque'].includes(st)) continue;
    occupes.add(x.assigne_a);
    aLeurPoste.push({ id: x.assigne_a, tache: x.texte, pause: enPause(x.assigne_a, maintenant) });
  }
  // La dernière réunion terminée, pour l'écran de la salle quand elle est vide.
  let derniere = null;
  for (const m of messages) if (m.meta?.reunion?.fin && (!derniere || m.created_at > derniere.created_at)) derniere = m;
  // Au bar du hall : ceux qui ont RENDU un travail dans la dernière demi-heure.
  const aupause = [];
  for (const x of taches) {
    const rendue = Date.parse(x.meta?.livre_le || '');
    if (!x.assigne_a || !ids.has(x.assigne_a) || occupes.has(x.assigne_a) || !(maintenant - rendue <= 30 * 60 * 1000)) continue;
    occupes.add(x.assigne_a);
    aupause.push({ id: x.assigne_a, tache: x.texte, depuis: rendue });
  }
  // Disponibles : allumés, sans réunion, sans tâche en cours ni travail tout
  // juste rendu. Ils attendent dans le hall qu'on leur parle — c'est vrai :
  // un agent allumé répond quand on lui écrit (Beau : « je suis encore seul »).
  for (const id of enReunion) occupes.add(id);
  const disponibles = machines.filter((a) => !occupes.has(a.id)).map((a) => ({ id: a.id }));
  return {
    disponibles,
    reunions: reunions.map((x) => ({ ...x, participants: x.participants.filter((id) => ids.has(id)) })),
    aupause,
    aLeurPoste,
    derniereReunion: derniere ? { quand: derniere.created_at, sujet: String(derniere.texte || '').split('\n')[0].replace(/^Compte rendu\s*[—-]\s*/i, '').replace(/[#*]/g, '').slice(0, 90) } : null,
    reunion: reunion ? { ...reunion, participants: reunion.participants.filter((id) => ids.has(id)) } : null,
    auBureau,
  };
}

// Ce que répond la réceptionniste, à partir des vraies données.
export function repondre(question, { agents = [], ou, nomEntreprise = '' }, langue = 'fr') {
  const fr = langue !== 'en';
  const q = String(question || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nomDe = (id) => agents.find((a) => a.id === id)?.nom || '?';
  if (/reunion|meeting/.test(q)) {
    if (!ou?.reunion) return { texte: fr ? "Aucune réunion en ce moment. La salle est libre." : 'No meeting right now. The room is free.' };
    const n = ou.reunion.participants.map(nomDe);
    return { texte: fr ? `Oui : ${n.join(', ')} ${n.length > 1 ? 'sont' : 'est'} en réunion${ou.reunion.sujet ? ` (« ${ou.reunion.sujet} »)` : ''}. Je vous y emmène ?` : `Yes: ${n.join(', ')} ${n.length > 1 ? 'are' : 'is'} in a meeting. Shall I take you there?`, aller: 'reunion' };
  }
  if (/atelier|workshop|code|travaill|working|qui est la|who is (here|in)/.test(q)) {
    const n = (ou?.auBureau || []).map((x) => nomDe(x.id));
    if (!n.length) return { texte: fr ? "Personne n'a travaillé ces dix dernières minutes." : 'Nobody has worked in the last ten minutes.' };
    return { texte: fr ? `En ce moment au travail : ${n.join(', ')}.` : `Working right now: ${n.join(', ')}.`, aller: 'atelier' };
  }
  const cible = agents.filter((a) => !a.user_id).find((a) => q.includes(String(a.nom).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(' ')[0]));
  if (cible) {
    if (cible.actif === false) return { texte: fr ? `${cible.nom} est en veille aujourd'hui.` : `${cible.nom} is switched off today.` };
    if (ou?.reunion?.participants.includes(cible.id)) return { texte: fr ? `${cible.nom} est en réunion.` : `${cible.nom} is in a meeting.`, aller: 'reunion' };
    const b = (ou?.auBureau || []).find((x) => x.id === cible.id);
    if (b) return { texte: fr ? `${cible.nom} travaille à son bureau${b.tache ? ` : ${String(b.tache).slice(0, 80)}` : ''}.` : `${cible.nom} is at their desk.`, aller: 'atelier' };
    const at = (ou?.aLeurPoste || []).find((x) => x.id === cible.id);
    if (at?.pause) return { texte: fr ? `${cible.nom} fait une pause ici, dans le hall. Tâche qui l'attend : ${String(at.tache).slice(0, 80)}.` : `${cible.nom} is on a break here in the lobby, with a task waiting.` };
    if (at) return { texte: fr ? `${cible.nom} est à son poste, avec une tâche à faire : ${String(at.tache).slice(0, 80)}.` : `${cible.nom} is at their desk with a task to do.` };
    if ((ou?.disponibles || []).some((x) => x.id === cible.id)) return { texte: fr ? `${cible.nom} est ici, dans le hall, disponible : allez lui parler.` : `${cible.nom} is here in the lobby, available: go and talk to them.` };
    return { texte: fr ? `${cible.nom} n'a rien fait ces dix dernières minutes : pas à son bureau pour l'instant.` : `${cible.nom} hasn't been active in the last ten minutes.` };
  }
  return { texte: fr ? `Bienvenue chez ${nomEntreprise}. Demandez-moi qui est en réunion, qui travaille, ou où est un agent.` : `Welcome to ${nomEntreprise}. Ask me who's in a meeting, who's working, or where someone is.` };
}
