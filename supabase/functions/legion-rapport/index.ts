// LEGION — le rapport du soir, le résumé de la semaine, et le rapport de
// transparence du mois (idées 11, 13, 124 et 169 des 200 de Gemini, que Beau
// a demandé de faire le 23/09).
//
// Chaque soir à 17 h UTC (19 h à Paris l’été, 18 h à Douala), pour chaque entreprise
// qui a travaillé : le directeur écrit ce qui a été fait aujourd'hui, ce qui
// attend demain, et ce qui attend le fondateur. Le vendredi, le résumé couvre
// la semaine (à écouter, comme un court podcast). Le 1er du mois, le rapport
// de transparence : ce que Legion a coûté, ce que la relecture a corrigé, les
// actions confirmées.
//
// Les CHIFFRES et les ALERTES sont calculés ici, dans la base — jamais par le
// modèle : tâches bloquées, en revue depuis plus de deux jours, à faire depuis
// plus de sept jours, plafond du mois qui approche, intérim qui se termine,
// agents allumés qui n'ont rien fait depuis trois jours. Le modèle ne fait que
// raconter la journée à partir de ces faits ; s'il ne répond pas, le rapport
// part quand même, avec les faits seuls. Le rapport de transparence n'appelle
// aucun modèle.
//
// Deux portes : la tâche planifiée (jeton « legion_rapport », toutes les
// entreprises), ou un membre qui demande le rapport tout de suite (son jeton,
// son entreprise).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, enFond, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { aerer, generer, garder, moteursSimples } from '../_shared/moteur.ts';

const PROD_HOST = 'finjaro.net';
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).hostname; } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host.endsWith('.pages.dev') || host.endsWith('.workers.dev')) return true;
  return false;
}
function cors(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finjaro-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// deno-lint-ignore no-explicit-any
type Service = any;
type Agent = { id: string; nom: string; poste: string; departement: string | null; actif: boolean; est_directeur: boolean; user_id: string | null; moteur: string; fin_mission: string | null; personnalite: string | null };
type Msg = { id: string; auteur_id: string; user_id: string | null; texte: string; genre: string; created_at: string; termine_le: string | null; assigne_a: string | null; canal_id: string; meta: Record<string, unknown> | null };

const sansAccent = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const court = (t: string, n = 160) => { const x = String(t || '').replace(/\s+/g, ' ').trim(); return x.length <= n ? x : `${x.slice(0, n).replace(/\s+\S*$/, '')}…`; };
const JOUR_MS = 86_400_000;
const euros = (n: number, anglais = false) => `${anglais ? n.toFixed(2) : n.toFixed(2).replace('.', ',')} €`;

// ——— Les faits d'une période, et les alertes : tout vient de la base ———
async function faits(service: Service, entrepriseId: string, depuis: Date, agents: Agent[], anglais = false) {
  const nomDe = (id: string | null) => agents.find((a) => a.id === id)?.nom || '?';
  const [{ data: messages }, { data: taches }, { data: dansLeMois }] = await Promise.all([
    service.from('legion_messages').select('id, auteur_id, user_id, texte, genre, created_at, termine_le, assigne_a, canal_id, meta')
      .eq('entreprise_id', entrepriseId).gte('created_at', depuis.toISOString()).neq('genre', 'tache').order('created_at').limit(600),
    service.from('legion_messages').select('id, auteur_id, user_id, texte, genre, created_at, termine_le, assigne_a, canal_id, meta')
      .eq('entreprise_id', entrepriseId).eq('genre', 'tache').or(`termine_le.is.null,termine_le.gte.${depuis.toISOString()}`).limit(500),
    service.from('ai_usage').select('cost_eur, created_at').eq('entreprise_id', entrepriseId).gte('created_at', depuis.toISOString()),
  ]);
  const ms = (messages || []) as Msg[];
  const ts = (taches || []) as Msg[];
  const maintenant = Date.now();
  const age = (iso: string) => (maintenant - Date.parse(iso)) / JOUR_MS;
  const statut = (x: Msg) => String((x.meta as { statut?: string } | null)?.statut || 'a_faire');
  const ouvertes = ts.filter((x) => !x.termine_le && statut(x) !== 'fait');
  const faites = ts.filter((x) => x.termine_le && Date.parse(x.termine_le) >= depuis.getTime());
  const creees = ts.filter((x) => Date.parse(x.created_at) >= depuis.getTime());
  const bloquees = ouvertes.filter((x) => (x.meta as { bloque?: string; debloque_le?: string } | null)?.bloque && !(x.meta as { debloque_le?: string }).debloque_le);
  const enRevue = ouvertes.filter((x) => statut(x) === 'revue');
  const revueLongue = enRevue.filter((x) => age(String((x.meta as { livre_le?: string } | null)?.livre_le || x.created_at)) > 2);
  const vieilles = ouvertes.filter((x) => statut(x) === 'a_faire' && age(x.created_at) > 7);
  const livrables = ms.filter((m) => (m.meta as { livrable?: unknown } | null)?.livrable && !m.user_id);
  // Une réunion = son ouverture; son compte rendu n'est pas une « décision »
  // de plus (le premier essai, le 24/09, comptait six réunions ET six décisions).
  const reunion = (m: Msg) => (m.meta as { reunion?: { ouverture?: boolean; fin?: boolean; interrompue?: boolean; annulee?: boolean; echec?: boolean } } | null)?.reunion;
  const comptesRendus = ms.filter((m) => { const r = reunion(m); return !!r?.fin && !r.interrompue && !r.annulee && !r.echec; });
  const decisions = ms.filter((m) => m.genre === 'decision' && !reunion(m));
  const reunions = ms.filter((m) => !!reunion(m)?.ouverture);
  const questions = ms.filter((m) => m.genre === 'question' && !m.user_id);
  const reponsesAgents = ms.filter((m) => !m.user_id && (m.meta as { par_ia?: boolean } | null)?.par_ia);
  const messagesHumains = ms.filter((m) => m.user_id);
  const parAgent: Record<string, number> = {};
  for (const m of reponsesAgents) parAgent[nomDe(m.auteur_id)] = (parAgent[nomDe(m.auteur_id)] || 0) + 1;
  const depensePeriode = (dansLeMois || []).reduce((t: number, l: { cost_eur: number }) => t + Number(l.cost_eur), 0);
  const plafond = await plafondAtteint(entrepriseId);

  // Agents allumés, avec du travail, sans un mot depuis trois jours.
  const { data: recents } = await service.from('legion_messages').select('auteur_id').eq('entreprise_id', entrepriseId)
    .gte('created_at', new Date(maintenant - 3 * JOUR_MS).toISOString()).limit(1000);
  const actifsRecents = new Set((recents || []).map((x: { auteur_id: string }) => x.auteur_id));
  const endormis = agents.filter((a) => a.actif && !a.user_id && a.moteur !== 'claude-code' && !actifsRecents.has(a.id) && ouvertes.some((x) => x.assigne_a === a.id));
  const finMission = agents.filter((a) => a.actif && a.fin_mission && (Date.parse(`${a.fin_mission}T23:59:59Z`) - maintenant) / JOUR_MS <= 3 && Date.parse(`${a.fin_mission}T23:59:59Z`) >= maintenant);

  const alertes: string[] = [];
  const bloque = (x: Msg) => court(String((x.meta as { bloque?: string }).bloque), 120);
  if (anglais) {
    for (const x of bloquees.slice(0, 5)) alertes.push(`Blocked: “${court(x.texte, 90)}” (${nomDe(x.assigne_a)}) — missing: ${bloque(x)}`);
    if (revueLongue.length) alertes.push(`${revueLongue.length} deliverable(s) have been waiting for your review for more than two days: ${revueLongue.slice(0, 3).map((x) => `“${court(x.texte, 60)}”`).join(', ')}`);
    if (vieilles.length) alertes.push(`${vieilles.length} task(s) still to do after more than seven days, untouched.`);
    if (plafond.plafond != null && plafond.depense >= plafond.plafond * 0.8) alertes.push(`Monthly cap at ${Math.round((plafond.depense / plafond.plafond) * 100)}% (${plafond.depense.toFixed(2)} € of ${plafond.plafond} €).`);
    for (const a of finMission) alertes.push(`${a.nom}'s interim ends on ${a.fin_mission}: they will switch off by themselves the next day.`);
    if (endormis.length) alertes.push(`Switched on, with work, but silent for three days: ${endormis.map((a) => a.nom).join(', ')}.`);
  } else {
    for (const x of bloquees.slice(0, 5)) alertes.push(`Bloquée : « ${court(x.texte, 90)} » (${nomDe(x.assigne_a)}) — il manque : ${bloque(x)}`);
    if (revueLongue.length) alertes.push(`${revueLongue.length} livrable(s) attendent ta validation depuis plus de deux jours : ${revueLongue.slice(0, 3).map((x) => `« ${court(x.texte, 60)} »`).join(', ')}`);
    if (vieilles.length) alertes.push(`${vieilles.length} tâche(s) à faire depuis plus de sept jours, sans avoir bougé.`);
    if (plafond.plafond != null && plafond.depense >= plafond.plafond * 0.8) alertes.push(`Plafond du mois à ${Math.round((plafond.depense / plafond.plafond) * 100)} % (${plafond.depense.toFixed(2)} € sur ${plafond.plafond} €).`);
    for (const a of finMission) alertes.push(`L'intérim de ${a.nom} se termine le ${a.fin_mission} : il s'éteindra seul le lendemain.`);
    if (endormis.length) alertes.push(`Allumés, avec du travail, mais sans un mot depuis trois jours : ${endormis.map((a) => a.nom).join(', ')}.`);
  }

  return {
    ms, ouvertes, faites, creees, bloquees, enRevue, livrables, decisions, reunions, comptesRendus, questions, reponsesAgents, messagesHumains, parAgent,
    depensePeriode, plafond, alertes, nomDe,
    chiffres: {
      reponses: reponsesAgents.length, messages_humains: messagesHumains.length, livrables: livrables.length, decisions: decisions.length,
      reunions: reunions.length, comptes_rendus: comptesRendus.length, taches_creees: creees.length, taches_faites: faites.length, taches_ouvertes: ouvertes.length,
      bloquees: bloquees.length, en_revue: enRevue.length, depense_eur: Number(depensePeriode.toFixed(4)),
      mois_eur: Number(plafond.depense.toFixed(4)), plafond_eur: plafond.plafond,
    },
  };
}

// Le salon où le rapport se lit : la Direction, sinon le premier salon d'équipe.
async function salonDirection(service: Service, entrepriseId: string): Promise<string | null> {
  const { data } = await service.from('legion_canaux').select('id, nom, cle, prive_entre').eq('entreprise_id', entrepriseId).order('ordre').order('created_at');
  const publics = (data || []).filter((c: { prive_entre: string[] | null }) => !(Array.isArray(c.prive_entre) && c.prive_entre.length));
  const d = publics.find((c: { nom: string; cle: string }) => sansAccent(c.nom) === 'direction' || sansAccent(c.cle || '') === 'direction') || publics[0];
  return d?.id || null;
}

const SCHEMA_RAPPORT = { type: 'OBJECT', properties: { aujourdhui: { type: 'STRING' }, demain: { type: 'STRING' }, pour_toi: { type: 'STRING' } }, required: ['aujourdhui', 'demain', 'pour_toi'] };

// ——— Le rapport du soir (ou de la semaine, le vendredi) ———
async function rapportSoir(service: Service, apiKey: string, entrepriseId: string, semaine: boolean, force: boolean, ecrits: unknown[] = []): Promise<string> {
  const [{ data: e }, { data: ag }] = await Promise.all([
    service.from('legion_entreprises').select('id, nom, projet, langue').eq('id', entrepriseId).single(),
    service.from('legion_agents').select('id, nom, poste, departement, actif, est_directeur, user_id, moteur, fin_mission, personnalite').eq('entreprise_id', entrepriseId).order('ordre'),
  ]);
  if (!e) return 'entreprise introuvable';
  const agents = (ag || []) as Agent[];
  const canal = await salonDirection(service, entrepriseId);
  if (!canal) return `${e.nom}: pas de salon`;
  const type = semaine ? 'semaine' : 'soir';
  // Un seul rapport planifié par jour et par type. Celui qu'on a demandé à
  // la main dans la journée ne compte pas: le soir, le rapport arrive quand même.
  const debutJour = new Date(); debutJour.setUTCHours(0, 0, 0, 0);
  if (!force) {
    const { data: deja } = await service.from('legion_messages').select('id').eq('entreprise_id', entrepriseId).gte('created_at', debutJour.toISOString())
      .contains('meta', { rapport: { type, demande: false } }).limit(1);
    if (deja?.length) return `${e.nom}: déjà fait aujourd'hui`;
  }
  const depuis = new Date(Date.now() - (semaine ? 7 : 1) * JOUR_MS);
  const anglais = e.langue === 'en';
  const f = await faits(service, entrepriseId, depuis, agents, anglais);
  // Rien ne s'est passé et rien n'alerte : pas de rapport (ni bruit, ni coût).
  if (!force && !f.reponsesAgents.length && !f.messagesHumains.length && !f.faites.length && !f.alertes.length) return `${e.nom}: journée calme, pas de rapport`;

  const directeur = agents.find((a) => a.est_directeur && a.actif && !a.user_id && a.moteur !== 'claude-code' && sansAccent(a.departement || '') === 'direction')
    || agents.find((a) => a.est_directeur && a.actif && !a.user_id && a.moteur !== 'claude-code')
    || agents.find((a) => a.actif && !a.user_id && a.moteur !== 'claude-code');
  if (!directeur) return `${e.nom}: aucun agent allumé`;
  pourEntreprise(entrepriseId);

  const faitsTexte = [
    `Période : ${semaine ? 'les sept derniers jours' : 'les dernières 24 heures'}.`,
    `Chiffres (mesurés) : ${JSON.stringify(f.chiffres)}.`,
    f.livrables.length ? `Livrables rendus :\n${f.livrables.slice(0, 12).map((m) => `- ${f.nomDe(m.auteur_id)} : ${court(m.texte, 220)}`).join('\n')}` : 'Aucun livrable rendu.',
    f.decisions.length ? `Décisions :\n${f.decisions.slice(0, 8).map((m) => `- ${court(m.texte, 240)}`).join('\n')}` : '',
    f.comptesRendus.length ? `Comptes rendus de réunion :\n${f.comptesRendus.slice(0, 6).map((m) => `- ${court(m.texte, 320)}`).join('\n')}` : '',
    f.faites.length ? `Tâches terminées :\n${f.faites.slice(0, 12).map((x) => `- ${court(x.texte, 120)} (${f.nomDe(x.assigne_a)})`).join('\n')}` : 'Aucune tâche terminée.',
    f.ouvertes.length ? `Tâches ouvertes (${f.ouvertes.length}) :\n${f.ouvertes.slice(0, 12).map((x) => `- ${court(x.texte, 110)} (${f.nomDe(x.assigne_a)}, ${String((x.meta as { statut?: string } | null)?.statut || 'a_faire')})`).join('\n')}` : '',
    f.questions.length ? `Questions posées au fondateur :\n${f.questions.slice(0, 6).map((m) => `- ${f.nomDe(m.auteur_id)} : ${court(m.texte, 200)}`).join('\n')}` : '',
    f.alertes.length ? `ALERTES (calculées) :\n${f.alertes.map((a) => `- ${a}`).join('\n')}` : 'Aucune alerte.',
  ].filter(Boolean).join('\n\n');

  const consigne = `Tu es ${directeur.nom}, ${directeur.poste}, et tu écris le ${semaine ? 'RÉSUMÉ DE LA SEMAINE' : 'RAPPORT DU SOIR'} de « ${e.nom} » pour le fondateur, qui le lira sur son téléphone (ou l'écoutera).
Ta personnalité : ${directeur.personnalite || 'direct, précis'}.

LES FAITS (et rien d'autre : aucun chiffre, aucun travail, aucune date qui n'est pas ci-dessous) :
${faitsTexte}

Trois champs, en phrases simples, sans titre ni puce (la mise en page est faite ailleurs) :
"aujourdhui" : ce qui a vraiment été fait ${semaine ? 'cette semaine' : "aujourd'hui"}, qui l'a fait — 2 à 5 phrases. S'il ne s'est presque rien passé, dis-le en une phrase.
"demain" : ce qui est sur la table pour la suite, d'après les tâches ouvertes — 1 à 3 phrases.
"pour_toi" : ce qui attend une décision ou une action du fondateur (validations, blocages, questions) — 1 à 3 phrases, ou "" s'il n'y a rien.
Pas de félicitations, pas de formule d'introduction. Écris en ${anglais ? 'anglais' : 'français'}.`;

  const titre = semaine ? (anglais ? 'The week' : 'La semaine') : (anglais ? 'Tonight’s report' : 'Rapport du soir');
  const t = anglais
    ? { auj: semaine ? 'This week' : 'Today', dem: 'Next', toi: 'For you', al: 'Alerts', ch: 'Figures' }
    : { auj: semaine ? 'Cette semaine' : "Aujourd'hui", dem: 'Ensuite', toi: 'Pour toi', al: 'Alertes', ch: 'Les chiffres' };
  const eur = (n: number) => euros(n, anglais);
  const chiffres = anglais
    ? `- ${f.chiffres.reponses} agent replies, ${f.chiffres.livrables} deliverables, ${f.chiffres.reunions} meetings, ${f.chiffres.decisions} decisions\n- Tasks: ${f.chiffres.taches_faites} done, ${f.chiffres.taches_creees} created, ${f.chiffres.taches_ouvertes} open (${f.chiffres.en_revue} awaiting you)\n- Cost: ${eur(f.depensePeriode)} over the period, ${eur(f.plafond.depense)} this month${f.plafond.plafond != null ? ` of ${eur(f.plafond.plafond)}` : ''}`
    : `- ${f.chiffres.reponses} réponses d'agents, ${f.chiffres.livrables} livrables, ${f.chiffres.reunions} réunions, ${f.chiffres.decisions} décisions\n- Tâches : ${f.chiffres.taches_faites} faites, ${f.chiffres.taches_creees} créées, ${f.chiffres.taches_ouvertes} ouvertes (dont ${f.chiffres.en_revue} à valider)\n- Coût : ${eur(f.depensePeriode)} sur la période, ${eur(f.plafond.depense)} ce mois-ci${f.plafond.plafond != null ? ` sur ${eur(f.plafond.plafond)}` : ''}`;

  const r = await generer(apiKey, consigne, SCHEMA_RAPPORT, { temperature: 0.4, reflexion: 512, maxSortie: 2048, delaiMs: 40_000, modeles: moteursSimples() });
  const recit = 'erreur' in r ? null : r.obj as { aujourdhui?: string; demain?: string; pour_toi?: string };
  const blocs = [
    `${titre} — ${new Date().toLocaleDateString(anglais ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
    recit?.aujourdhui ? `## ${t.auj}\n${String(recit.aujourdhui).trim()}` : '',
    recit?.demain ? `## ${t.dem}\n${String(recit.demain).trim()}` : '',
    recit?.pour_toi ? `## ${t.toi}\n${String(recit.pour_toi).trim()}` : '',
    f.alertes.length ? `## ${t.al}\n${f.alertes.map((a) => `- ${a}`).join('\n')}` : '',
    `## ${t.ch}\n${chiffres}`,
    !recit ? (anglais ? '(The model did not answer: here are the facts alone.)' : "(Le modèle n'a pas répondu : voici les faits seuls.)") : '',
  ].filter(Boolean);
  const { data: ecrit, error } = await service.from('legion_messages').insert({
    entreprise_id: entrepriseId, canal_id: canal, auteur_id: directeur.id, user_id: null,
    texte: aerer(blocs.join('\n\n')).slice(0, 5000), genre: 'info',
    meta: { par_ia: !!recit, ...(recit && 'modele' in r ? { modele: r.modele } : {}), sans_reponse: true, rapport: { type, depuis: depuis.toISOString(), alertes: f.alertes.length, chiffres: f.chiffres, demande: force } },
  }).select('*').single();
  if (error) return `${e.nom}: ${error.message}`;
  ecrits.push(ecrit);
  if (recit && !('erreur' in r)) await garder(service, { entreprise_id: entrepriseId, message_id: ecrit.id, fonction: 'legion_rapport', modele: r.modele, consigne, sortie: JSON.stringify(r.obj) });
  return `${e.nom}: rapport ${type} écrit (${f.alertes.length} alerte(s))`;
}

// ——— Le rapport de transparence du mois : calculé, sans modèle ———
async function rapportMois(service: Service, entrepriseId: string, force: boolean, ecrits: unknown[] = []): Promise<string> {
  const [{ data: e }, { data: ag }] = await Promise.all([
    service.from('legion_entreprises').select('id, nom, langue').eq('id', entrepriseId).single(),
    service.from('legion_agents').select('id, nom, poste, departement, actif, est_directeur, user_id, moteur, fin_mission, personnalite').eq('entreprise_id', entrepriseId).order('ordre'),
  ]);
  if (!e) return 'entreprise introuvable';
  const agents = (ag || []) as Agent[];
  const canal = await salonDirection(service, entrepriseId);
  if (!canal) return `${e.nom}: pas de salon`;
  const fin = new Date(); fin.setUTCDate(1); fin.setUTCHours(0, 0, 0, 0);
  const debut = new Date(fin); debut.setUTCMonth(debut.getUTCMonth() - 1);
  const moisNom = debut.toLocaleDateString(e.langue === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' });
  if (!force) {
    const { data: deja } = await service.from('legion_messages').select('id').eq('entreprise_id', entrepriseId).gte('created_at', fin.toISOString())
      .contains('meta', { rapport: { type: 'mois', demande: false } }).limit(1);
    if (deja?.length) return `${e.nom}: déjà fait ce mois-ci`;
  }
  const [{ data: couts }, { data: msgs }, { data: regles }, { data: docs }] = await Promise.all([
    service.from('ai_usage').select('fn, cost_eur').eq('entreprise_id', entrepriseId).gte('created_at', debut.toISOString()).lt('created_at', fin.toISOString()),
    service.from('legion_messages').select('auteur_id, user_id, genre, meta, termine_le, created_at').eq('entreprise_id', entrepriseId).gte('created_at', debut.toISOString()).lt('created_at', fin.toISOString()).limit(5000),
    service.from('legion_memoire').select('id').eq('entreprise_id', entrepriseId).gte('created_at', debut.toISOString()).lt('created_at', fin.toISOString()),
    service.from('legion_documents').select('id').eq('entreprise_id', entrepriseId).gte('created_at', debut.toISOString()).lt('created_at', fin.toISOString()),
  ]);
  const lignes = (msgs || []) as Array<{ auteur_id: string; user_id: string | null; genre: string; meta: Record<string, unknown> | null; termine_le: string | null }>;
  const reponses = lignes.filter((m) => !m.user_id && (m.meta as { par_ia?: boolean } | null)?.par_ia);
  if (!force && !reponses.length && !(couts || []).length) return `${e.nom}: mois sans activité`;
  const relues = reponses.filter((m) => (m.meta as { relu?: unknown } | null)?.relu);
  const corrigees = relues.filter((m) => (m.meta as { relu?: { corrige?: boolean } }).relu?.corrige);
  const actions = lignes.filter((m) => (m.meta as { action?: unknown } | null)?.action);
  const confirmees = actions.filter((m) => ['confirmee', 'faite', 'executee'].includes(String((m.meta as { action?: { statut?: string } }).action?.statut)));
  const parFn: Record<string, number> = {};
  for (const c of (couts || []) as Array<{ fn: string; cost_eur: number }>) parFn[c.fn] = (parFn[c.fn] || 0) + Number(c.cost_eur);
  const total = Object.values(parFn).reduce((a, b) => a + b, 0);
  const anglais = e.langue === 'en';
  const directeur = agents.find((a) => a.est_directeur && !a.user_id && a.moteur !== 'claude-code') || agents.find((a) => !a.user_id) || agents[0];
  const eur = (n: number) => euros(n, anglais);
  const texte = anglais
    ? `Transparency report — ${moisNom}\n\n## What Legion cost\n- ${eur(total)} (estimate from public prices; the real bill is Google's)${Object.keys(parFn).length ? '\n' : ''}${Object.entries(parFn).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${eur(v)}`).join('\n')}\n\n## What the agents did\n- ${reponses.length} replies, ${lignes.filter((m) => (m.meta as { livrable?: unknown } | null)?.livrable).length} deliverables, ${lignes.filter((m) => (m.meta as { reunion?: { ouverture?: boolean } } | null)?.reunion?.ouverture).length} meetings, ${lignes.filter((m) => m.genre === 'tache' && m.termine_le).length} tasks done\n\n## What was checked\n- ${relues.length} replies reread before sending, ${corrigees.length} corrected (invented figure, promise, fact)\n- ${actions.length} actions proposed, ${confirmees.length} confirmed by a human — nothing runs without "Confirm"\n- ${(regles || []).length} house rules added, ${(docs || []).length} documents added`
    : `Rapport de transparence — ${moisNom}\n\n## Ce que Legion a coûté\n- ${eur(total)} (estimation d'après les prix publics ; la vraie facture est celle de Google)${Object.keys(parFn).length ? '\n' : ''}${Object.entries(parFn).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k} : ${eur(v)}`).join('\n')}\n\n## Ce que les agents ont fait\n- ${reponses.length} réponses, ${lignes.filter((m) => (m.meta as { livrable?: unknown } | null)?.livrable).length} livrables, ${lignes.filter((m) => (m.meta as { reunion?: { ouverture?: boolean } } | null)?.reunion?.ouverture).length} réunions, ${lignes.filter((m) => m.genre === 'tache' && m.termine_le).length} tâches terminées\n\n## Ce qui a été vérifié\n- ${relues.length} réponses relues avant de partir, ${corrigees.length} corrigées (chiffre inventé, promesse, fait)\n- ${actions.length} actions proposées, ${confirmees.length} confirmées par un humain — rien ne s'exécute sans « Confirmer »\n- ${(regles || []).length} règles de la maison ajoutées, ${(docs || []).length} documents ajoutés`;
  const { data: ecrit, error } = await service.from('legion_messages').insert({
    entreprise_id: entrepriseId, canal_id: canal, auteur_id: directeur.id, user_id: null, texte, genre: 'info',
    meta: { sans_reponse: true, rapport: { type: 'mois', demande: force, mois: debut.toISOString().slice(0, 7), total_eur: Number(total.toFixed(4)), relues: relues.length, corrigees: corrigees.length, actions: actions.length, confirmees: confirmees.length } },
  }).select('*').single();
  if (error) return `${e.nom}: ${error.message}`;
  ecrits.push(ecrit);
  return `${e.nom}: rapport du mois écrit`;
}

Deno.serve(compter('legion_rapport', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  let corps: { entreprise_id?: string; mode?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }
  const mode = ['soir', 'semaine', 'mois'].includes(String(corps.mode)) ? String(corps.mode) : 'soir';

  let entreprises: string[] = [];
  let force = false;
  const jeton = req.headers.get('x-finjaro-token');
  if (jeton) {
    const { data: sec } = await service.from('app_secrets').select('value').eq('name', 'legion_rapport').maybeSingle();
    if (!sec?.value || sec.value !== jeton) return json({ erreur: 'non autorisé' }, 401);
    const { data } = await service.from('legion_agents').select('entreprise_id').eq('actif', true).is('user_id', null).neq('moteur', 'claude-code');
    entreprises = [...new Set((data || []).map((x: { entreprise_id: string }) => x.entreprise_id))] as string[];
    // Pour essayer la tâche planifiée sur une seule entreprise (l'entreprise
    // de test), sans écrire dans les vraies.
    if (corps.entreprise_id) entreprises = entreprises.filter((x) => x === corps.entreprise_id);
  } else {
    const auth = req.headers.get('Authorization');
    if (!auth || !corps.entreprise_id) return json({ erreur: 'Il faut être connecté.' }, 401);
    const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: e } = await personne.from('legion_entreprises').select('id').eq('id', corps.entreprise_id).maybeSingle();
    if (!e) return json({ erreur: "Entreprise inconnue, ou tu n'en es pas membre." }, 403);
    entreprises = [e.id];
    force = true;
  }
  // Le vendredi soir, la tâche planifiée fait le résumé de la semaine.
  const semaine = mode === 'semaine' || (mode === 'soir' && !!jeton && new Date().getUTCDay() === 5);
  const journal: string[] = [];
  // Ce qui a été écrit: renvoyé à qui l'a demandé, pour l'afficher sans
  // attendre le temps réel.
  const ecrits: unknown[] = [];
  for (const id of entreprises) {
    const p = await plafondAtteint(id);
    if (p.atteint && mode !== 'mois') { journal.push(`${id}: plafond atteint`); continue; }
    await enFond('legion_rapport', id, async () => {
      journal.push(mode === 'mois' ? await rapportMois(service, id, force, ecrits) : await rapportSoir(service, apiKey, id, semaine, force, ecrits));
    });
  }
  return json({ ok: true, journal, messages: jeton ? [] : ecrits });
}));
