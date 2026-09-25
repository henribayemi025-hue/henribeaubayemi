// L'ATELIER D'UNE PERSONNE : un Durable Object par utilisateur.
//
// Il garde, pour chaque projet : les fichiers (la copie qui fait foi), la
// conversation, la carte en attente, les règles « Toujours », le journal et
// le coût de la session. Il fait tourner la boucle (boucle.js) et ne
// réveille le bac à sable que pour lancer une commande.
//
// Un seul exemplaire en mémoire de l'état d'un projet (this.etats) : la
// boucle, le bouton Stop et les réglages modifient le MÊME objet, sans
// jamais s'écraser.

import { DurableObject } from 'cloudflare:workers';
import { getSandbox } from '@cloudflare/sandbox';
import { nouvelEtat, nouvelleSession, envoyer, decider, arreter, coutSession, compacter } from './boucle.js';
import { executant } from './bac.js';
import { disponibles, modelesRelais, MODELES } from './moteur.js';
import { prixMachineParSeconde, arrondi } from './cout.js';
import { cheminSur, MODES, normaliserCommande, commandeInterdite } from './politique.js';
import { diff } from './diff.js';
import { fabriquerZip } from './zip.js';
import { DEPARTS } from './departs.js';
import { enregistreur } from './supabase.js';
import { equipe } from './equipe.js';

const TAILLE_PROJET_MAX = 5_000_000;
const NB_FICHIERS_MAX = 1000;

const json = (corps, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const erreur = (texte, statut = 400) => json({ erreur: texte }, statut);

export function plafondSession(env) {
  const n = Number(env?.ATELIER_PLAFOND_SESSION_USD);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 1;
}

function veilleSecondes(env) {
  const v = String(env?.ATELIER_VEILLE || '10m');
  const m = /^(\d+)\s*([smh]?)$/.exec(v);
  if (!m) return 600;
  return Number(m[1]) * ({ s: 1, m: 60, h: 3600, '': 1 }[m[2]]);
}

export class Atelier extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.etats = new Map();
    this.controleurs = new Map();
    this.arrets = new Set();
    this.equipes = new Map(); // pid → { ctx, lu } : l'équipe de Léo, relue toutes les 5 min
  }

  // ——— Le stockage ———
  async projets() {
    return (await this.ctx.storage.get('projets')) || [];
  }

  async etat(pid) {
    if (this.etats.has(pid)) return this.etats.get(pid);
    const e = await this.ctx.storage.get(`e:${pid}`);
    if (!e) return null;
    e.sales ||= {};
    e.index ||= {};
    // Une boucle qui tournait quand l'objet a été recyclé ne tourne plus.
    if (['en_cours'].includes(e.session?.statut) && !this.controleurs.has(pid)) {
      arreter(e, { maintenant: () => new Date() }, 'arrete', 'Interrompu (le serveur a redémarré). Tu peux relancer ta demande.');
    }
    this.etats.set(pid, e);
    return e;
  }

  async sauver(pid, e) {
    e.session.battement = new Date().toISOString();
    if (e.affichage.length > 300) e.affichage = e.affichage.slice(-300);
    if (JSON.stringify(e.conversation).length > 1_200_000) e.conversation = compacter(e.conversation, 400_000);
    await this.ctx.storage.put(`e:${pid}`, e);
  }

  fichiers(pid, e) {
    const stockage = this.ctx.storage;
    return {
      async liste() {
        return Object.entries(e.index).sort(([a], [b]) => a.localeCompare(b)).map(([chemin, taille]) => ({ chemin, taille }));
      },
      async lire(chemin) {
        if (!(chemin in e.index)) return null;
        const v = await stockage.get(`f:${pid}:${chemin}`);
        return v == null ? null : String(v);
      },
      async ecrire(chemin, contenu, { depuisLeBac = false } = {}) {
        const taille = new TextEncoder().encode(contenu).length;
        const total = Object.values(e.index).reduce((t, x) => t + x, 0) - (e.index[chemin] || 0) + taille;
        if (total > TAILLE_PROJET_MAX) throw new Error('le projet dépasserait 5 Mo (limite de la V0)');
        if (!(chemin in e.index) && Object.keys(e.index).length >= NB_FICHIERS_MAX) throw new Error('trop de fichiers (1000 au plus en V0)');
        await stockage.put(`f:${pid}:${chemin}`, contenu);
        e.index[chemin] = taille;
        if (!depuisLeBac) e.sales[chemin] = 'ecrit';
      },
      async supprimer(chemin, { depuisLeBac = false } = {}) {
        await stockage.delete(`f:${pid}:${chemin}`);
        delete e.index[chemin];
        if (!depuisLeBac) e.sales[chemin] = 'supprime';
      },
    };
  }

  // La photo des fichiers au début de la session : l'écran « Modifications »
  // compare à elle.
  async photographier(pid, e) {
    const anciens = await this.ctx.storage.list({ prefix: `b:${pid}:` });
    if (anciens.size) await this.ctx.storage.delete([...anciens.keys()]);
    for (const chemin of Object.keys(e.index)) {
      const v = await this.ctx.storage.get(`f:${pid}:${chemin}`);
      if (v != null) await this.ctx.storage.put(`b:${pid}:${chemin}`, v);
    }
    e.baseIndex = { ...e.index };
    e.explications = {};
  }

  async journaliser(pid, e, entree, trace) {
    e.journalN = (e.journalN || 0) + 1;
    const ligne = { ...entree, quand: new Date().toISOString(), session_id: e.session.id, n: e.journalN };
    await this.ctx.storage.put(`j:${pid}:${String(e.journalN).padStart(9, '0')}`, ligne);
    await trace?.journal({ projet_id: pid, session_id: e.session.id, acteur: ligne.acteur, outil: ligne.outil, entree_resumee: ligne.entree_resumee, resultat_resume: ligne.resultat_resume, decision: ligne.decision, mode: ligne.mode, cout_usd: ligne.cout_usd || 0, quand: ligne.quand });
  }

  sessionPourSupabase(pid, e) {
    const s = e.session;
    return { id: s.id, projet_id: pid, mode: e.mode, modele: e.modele, debut: s.debut, fin: s.fin || null, statut: s.statut, cout_modele_usd: arrondi(s.coutModele), cout_machine_usd: arrondi(s.coutMachine), plafond_usd: s.plafond, jetons_entree: s.jetons.entree, jetons_cache: s.jetons.cache, jetons_sortie: s.jetons.sortie, secondes_machine: Math.round(s.secondesMachine) };
  }

  // `acces` : le jeton Supabase de la requête en cours et les modèles que le
  // relais propose (24/09). Le jeton sert au relais des modèles (moteur.js)
  // et n'entre jamais dans le bac à sable (executant ne le reçoit pas).
  deps(pid, e, trace, acces = {}) {
    const ctrl = new AbortController();
    this.controleurs.set(pid, ctrl);
    this.arrets.delete(pid);
    const fichiers = this.fichiers(pid, e);
    const env = this.env;
    let bac = null;
    return {
      env,
      leo: acces.leo || null,
      jeton: acces.jeton || null,
      relais: acces.relais || [],
      fichiers,
      get bac() {
        bac ||= executant({ sandbox: getSandbox(env.Sandbox, `p-${pid}`, { sleepAfter: env.ATELIER_VEILLE || '10m' }), etat: e, fichiers, veilleSecondes: veilleSecondes(env) });
        return bac;
      },
      journal: (entree) => this.journaliser(pid, e, entree, trace),
      cout: (c) => trace.cout({ session_id: e.session.id, projet_id: pid, ...c, quand: new Date().toISOString() }),
      regleAjoutee: (r) => trace.regle({ id: r.id, projet_id: pid, portee: r.portee, regle: r.regle, accordee_le: r.accordee_le }),
      sauver: async () => {
        await this.sauver(pid, e);
        if (e.demande) await trace.demande({ id: e.demande.id, session_id: e.session.id, projet_id: pid, outil: e.demande.outil, details: { commande: e.demande.commande || null, chemin: e.demande.chemin || null, explication: e.demande.explication || e.demande.pourquoi || null }, statut: 'en_attente', creee_le: e.demande.creee_le });
      },
      fetchFn: (...a) => fetch(...a),
      maintenant: () => new Date(),
      signal: ctrl.signal,
      arretDemande: () => this.arrets.has(pid),
      prixMachineSeconde: prixMachineParSeconde(env.ATELIER_TAILLE || 'standard-1'),
    };
  }

  // L'équipe de l'entreprise (equipe.js) : le projet, les collègues, et de
  // quoi leur confier du travail. Une panne de lecture ne bloque pas l'atelier.
  async brancherEquipe(pid, e, acces) {
    if (!e.projet.entreprise_id || !acces?.jeton) return acces;
    const leo = equipe({ env: this.env, jeton: acces.jeton, user: acces.user, entrepriseId: e.projet.entreprise_id, pid, attendre: (p) => this.ctx.waitUntil?.(p) });
    if (!leo) return acces;
    let cache = this.equipes.get(pid);
    if (!cache || Date.now() - cache.lu > 5 * 60_000) {
      try {
        cache = { ctx: await leo.contexte(), lu: Date.now() };
        this.equipes.set(pid, cache);
      } catch (err) {
        console.warn('équipe illisible', err.message);
        if (!cache) return acces;
      }
    }
    return { ...acces, leo: { ...leo, ctx: cache.ctx } };
  }

  async tourner(pid, e, trace, travail, acces) {
    // Une seule boucle à la fois par projet.
    if (this.controleurs.has(pid)) throw new Error('L\'agent travaille déjà : attends, ou appuie sur Stop.');
    acces = await this.brancherEquipe(pid, e, acces);
    const deps = this.deps(pid, e, trace, acces);
    // La trace Supabase peut avoir été branchée après la création du projet
    // (migration appliquée plus tard) : on (ré)écrit le projet et la session.
    await trace.projet({ id: pid, entreprise_id: e.projet.entreprise_id || null, proprietaire: e.proprietaire, nom: e.projet.nom, modele_depart: e.projet.depart, cree_le: e.projet.cree_le });
    await trace.session(this.sessionPourSupabase(pid, e));
    try {
      await travail(deps);
    } catch (err) {
      if (!['pret', 'attente', 'arrete', 'plafond', 'erreur'].includes(e.session.statut)) arreter(e, deps, 'erreur', `Erreur : ${err.message}`);
      await this.sauver(pid, e);
      if (e.session.statut !== 'erreur') throw err;
    } finally {
      this.controleurs.delete(pid);
      await trace.session(this.sessionPourSupabase(pid, e));
    }
  }

  vue(pid, e, env) {
    const s = e.session;
    return {
      projet: e.projet,
      mode: e.mode,
      modele: e.modele,
      modeles: disponibles(env, { geminiCoupe: e.geminiCoupeLe === new Date().toISOString().slice(0, 10), relais: this.relaisVus || [] }),
      session: {
        id: s.id, debut: s.debut, statut: s.statut, raison: s.raison, plafond: s.plafond,
        cout_modele: arrondi(s.coutModele), cout_machine: arrondi(s.coutMachine), cout: coutSession(s),
        jetons: s.jetons, appels: s.appels, secondes_machine: Math.round(s.secondesMachine),
      },
      affichage: e.affichage.slice(-200),
      demande: e.demande,
      regles: e.regles.filter((r) => !r.revoquee_le),
      fichiers: Object.entries(e.index).sort(([a], [b]) => a.localeCompare(b)).map(([chemin, taille]) => ({ chemin, taille })),
    };
  }

  // ——— Les routes (appelées par index.js, après la vérification d'accès) ———
  async fetch(request) {
    const url = new URL(request.url);
    const user = request.headers.get('x-atelier-user');
    const jeton = request.headers.get('x-atelier-jeton');
    if (!user) return erreur('non authentifié', 401);
    const trace = enregistreur(this.env, jeton);
    // Les modèles du relais Supabase pour ce jeton (gardés 5 min par moteur.js).
    const relais = await modelesRelais(this.env, jeton);
    this.relaisVus = relais;
    const acces = { jeton, relais, user };
    const p = url.pathname.replace(/^\/api/, '').split('/').filter(Boolean);
    const methode = request.method;
    const corps = ['POST', 'PUT'].includes(methode) ? await request.json().catch(() => ({})) : {};

    try {
      if (p[0] !== 'projets') return erreur('route inconnue', 404);

      if (p.length === 1 && methode === 'GET') return json({ projets: await this.projets() });

      if (p.length === 1 && methode === 'POST') {
        const nom = String(corps.nom || '').trim().slice(0, 80);
        if (!nom) return erreur('Donne un nom au projet.');
        const depart = DEPARTS[corps.depart] ? corps.depart : 'vide';
        const liste = await this.projets();
        if (liste.length >= 30) return erreur('30 projets au plus en V0.');
        // L'entreprise de Léo d'où l'on crée le projet (vérifiée par les règles
        // d'accès de la base : il faut en être membre, sinon rien n'est rattaché).
        const entreprise = /^[0-9a-f-]{36}$/i.test(String(corps.entreprise_id || '')) ? corps.entreprise_id : null;
        const projet = { id: crypto.randomUUID(), nom, depart, cree_le: new Date().toISOString(), entreprise_id: entreprise };
        const e = nouvelEtat(projet, new Date(), plafondSession(this.env));
        e.proprietaire = user;
        e.sales = {};
        e.index = {};
        const f = this.fichiers(projet.id, e);
        for (const [chemin, contenu] of Object.entries(DEPARTS[depart])) await f.ecrire(chemin, contenu);
        await this.photographier(projet.id, e);
        this.etats.set(projet.id, e);
        await this.sauver(projet.id, e);
        await this.ctx.storage.put('projets', [projet, ...liste]);
        await trace.projet({ id: projet.id, entreprise_id: projet.entreprise_id, proprietaire: user, nom, modele_depart: depart, cree_le: projet.cree_le });
        await trace.session(this.sessionPourSupabase(projet.id, e));
        await this.journaliser(projet.id, e, { acteur: 'humain', outil: 'projet', entree_resumee: `nouveau projet « ${nom} » (${depart})`, resultat_resume: null, decision: null, mode: e.mode, cout_usd: 0 }, trace);
        return json(this.vue(projet.id, e, this.env), 201);
      }

      const pid = p[1];
      const e = await this.etat(pid);
      if (!e) return erreur('projet introuvable', 404);
      const action = p[2] || '';
      // Les projets créés avant le 25/09 n'étaient rattachés à aucune
      // entreprise : l'écran envoie celle d'où on l'ouvre (vérifiée par la base
      // à chaque lecture, avec le jeton de la personne).
      if (!e.projet.entreprise_id && /^[0-9a-f-]{36}$/i.test(String(corps.entreprise_id || '')) && e.proprietaire === user) {
        e.projet.entreprise_id = corps.entreprise_id;
        const liste = await this.projets();
        await this.ctx.storage.put('projets', liste.map((x) => (x.id === pid ? { ...x, entreprise_id: corps.entreprise_id } : x)));
        await this.sauver(pid, e);
      }

      if (!action && methode === 'GET') return json(this.vue(pid, e, this.env));

      if (action === 'fichier' && methode === 'GET') {
        const { chemin, erreur: err } = cheminSur(url.searchParams.get('chemin'));
        if (err) return erreur(err);
        const contenu = await this.fichiers(pid, e).lire(chemin);
        return contenu == null ? erreur('fichier introuvable', 404) : json({ chemin, contenu });
      }

      if (action === 'fichier' && methode === 'PUT') {
        // L'humain écrit lui-même : pas de carte, mais une ligne au journal.
        if (e.session.statut === 'en_cours') return erreur('L\'agent travaille : attends ou appuie sur Stop avant de modifier un fichier.', 409);
        const { chemin, erreur: err } = cheminSur(corps.chemin);
        if (err) return erreur(err);
        if (typeof corps.contenu !== 'string') return erreur('contenu manquant');
        await this.fichiers(pid, e).ecrire(chemin, corps.contenu);
        (e.explications[chemin] ||= []).push('Modifié à la main.');
        await this.journaliser(pid, e, { acteur: 'humain', outil: 'ecrire_fichier', entree_resumee: chemin, resultat_resume: 'modifié à la main dans l\'éditeur', decision: 'humain', mode: e.mode, cout_usd: 0 }, trace);
        await this.sauver(pid, e);
        return json(this.vue(pid, e, this.env));
      }

      // Le terminal de l'humain (Beau, 25/09) : il tape lui-même une commande
      // dans SON bac à sable. Pas de carte (c'est lui), mais la liste
      // « toujours refusé » tient, le plafond de la session aussi, et tout
      // s'écrit au journal et dans le terminal.
      if (action === 'commande' && methode === 'POST') {
        if (['en_cours', 'attente'].includes(e.session.statut)) return erreur('L\'agent travaille : attends ou appuie sur Stop avant de taper une commande.', 409);
        const commande = normaliserCommande(corps.commande);
        if (!commande) return erreur('commande vide');
        const interdite = commandeInterdite(commande);
        if (interdite) return erreur(`Toujours refusé : ${interdite}`, 403);
        if (coutSession(e.session) >= e.session.plafond) return erreur(`Plafond de la session atteint (${e.session.plafond} $).`, 402);
        const d = this.deps(pid, e, trace, {});
        const r = await d.bac.executer(commande, {});
        const secondes = Number(r.secondes || 0);
        e.session.secondesMachine += secondes;
        e.session.coutMachine += secondes * d.prixMachineSeconde;
        const sortie = `${r.stdout || ''}${r.stderr ? `\n${r.stderr}` : ''}`.trim();
        e.affichage.push({ id: crypto.randomUUID(), qui: 'action', outil: 'commande', resume: commande, decision: 'humain', ok: r.code === 0, quand: new Date().toISOString(), par: 'humain', terminal: { code: r.code, sortie: sortie.length > 4000 ? `…\n${sortie.slice(-4000)}` : sortie } });
        await this.journaliser(pid, e, { acteur: 'humain', outil: 'commande', entree_resumee: commande.slice(0, 500), resultat_resume: `code ${r.code}`, decision: 'humain', mode: e.mode, cout_usd: secondes * d.prixMachineSeconde }, trace);
        await this.sauver(pid, e);
        return json(this.vue(pid, e, this.env));
      }

      if (action === 'message' && methode === 'POST') {
        if (corps.modele && (corps.modele === 'auto' || MODELES.includes(corps.modele))) e.modele = corps.modele;
        await this.tourner(pid, e, trace, (deps) => envoyer(e, deps, corps.texte), acces);
        return json(this.vue(pid, e, this.env));
      }

      if (action === 'presenter' && methode === 'POST') {
        if (['en_cours', 'attente'].includes(e.session.statut)) return erreur('L\'agent travaille déjà.', 409);
        const avant = e.mode;
        e.mode = 'visite';
        try {
          await this.tourner(pid, e, trace, (deps) => envoyer(e, deps, corps.texte || 'Présente-moi comment ça marche.'), acces);
        } finally {
          e.mode = avant;
          await this.sauver(pid, e);
        }
        return json(this.vue(pid, e, this.env));
      }

      if (action === 'decision' && methode === 'POST') {
        const demande = e.demande;
        await this.tourner(pid, e, trace, async (deps) => {
          const d = demande;
          await decider(e, deps, corps.demande_id, corps.choix);
          if (d) await trace.demande({ id: d.id, session_id: e.session.id, projet_id: pid, outil: d.outil, details: { commande: d.commande || null, chemin: d.chemin || null }, statut: corps.choix === 'refuser' ? 'refusee' : 'autorisee', creee_le: d.creee_le, decidee_le: new Date().toISOString(), decidee_par: user });
        }, acces);
        return json(this.vue(pid, e, this.env));
      }

      if (action === 'stop' && methode === 'POST') {
        this.arrets.add(pid);
        this.controleurs.get(pid)?.abort();
        if (e.bacDerniereFin) {
          try { await getSandbox(this.env.Sandbox, `p-${pid}`).killAllProcesses(); } catch { /* le bac dort peut-être déjà */ }
        }
        if (e.session.statut === 'attente' || (e.session.statut === 'en_cours' && !this.controleurs.has(pid))) {
          arreter(e, { maintenant: () => new Date() }, 'arrete', 'Arrêté par le bouton Stop.');
        }
        await this.journaliser(pid, e, { acteur: 'humain', outil: 'stop', entree_resumee: 'bouton Stop', resultat_resume: null, decision: 'arrete', mode: e.mode, cout_usd: 0 }, trace);
        await this.sauver(pid, e);
        return json(this.vue(pid, e, this.env));
      }

      if (action === 'mode' && methode === 'POST') {
        // Seul l'humain authentifié change le mode, ici (jamais l'agent, jamais un fichier).
        if (!['demander', 'accepter', 'auto', 'reflechir'].includes(corps.mode) || !MODES.includes(corps.mode)) return erreur('Mode inconnu (« demander », « accepter », « auto » ou « reflechir »).');
        e.mode = corps.mode;
        await this.journaliser(pid, e, { acteur: 'humain', outil: 'mode', entree_resumee: corps.mode, resultat_resume: null, decision: null, mode: e.mode, cout_usd: 0 }, trace);
        await this.sauver(pid, e);
        return json(this.vue(pid, e, this.env));
      }

      if (action === 'session' && methode === 'POST') {
        if (['en_cours', 'attente'].includes(e.session.statut)) return erreur('Arrête d\'abord le travail en cours.', 409);
        // La fin de la session : le conteneur a encore tourné jusqu'à sa veille.
        if (e.bacDerniereFin) {
          const queue = Math.min((Date.now() - e.bacDerniereFin) / 1000, veilleSecondes(this.env));
          e.session.secondesMachine += queue;
          e.session.coutMachine += queue * prixMachineParSeconde(this.env.ATELIER_TAILLE || 'standard-1');
          e.bacDerniereFin = null;
        }
        e.session.statut = 'fermee';
        e.session.fin = new Date().toISOString();
        await trace.session(this.sessionPourSupabase(pid, e));
        e.session = nouvelleSession(new Date(), plafondSession(this.env));
        e.conversation = [];
        e.affichage = [];
        e.file = [];
        e.demande = null;
        e.echecs = {};
        e.pas = 0;
        await this.photographier(pid, e);
        await this.sauver(pid, e);
        await trace.session(this.sessionPourSupabase(pid, e));
        return json(this.vue(pid, e, this.env));
      }

      if (action === 'modifications' && methode === 'GET') {
        const base = e.baseIndex || {};
        const chemins = [...new Set([...Object.keys(base), ...Object.keys(e.index)])].sort();
        const out = [];
        for (const chemin of chemins) {
          const avant = chemin in base ? String((await this.ctx.storage.get(`b:${pid}:${chemin}`)) ?? '') : null;
          const apres = chemin in e.index ? String((await this.ctx.storage.get(`f:${pid}:${chemin}`)) ?? '') : null;
          if (avant === apres) continue;
          out.push({ chemin, statut: avant == null ? 'ajoute' : apres == null ? 'supprime' : 'modifie', diff: diff(avant, apres), explications: e.explications?.[chemin] || [] });
        }
        return json({ modifications: out });
      }

      if (action === 'journal' && methode === 'GET') {
        const lignes = await this.ctx.storage.list({ prefix: `j:${pid}:`, reverse: true, limit: 200 });
        return json({ journal: [...lignes.values()] });
      }

      if (action === 'export' && methode === 'GET') {
        const f = this.fichiers(pid, e);
        const liste = [];
        for (const x of await f.liste()) liste.push({ chemin: x.chemin, contenu: (await f.lire(x.chemin)) ?? '' });
        const nom = e.projet.nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'projet';
        const zip = fabriquerZip(liste, { dossier: nom });
        await this.journaliser(pid, e, { acteur: 'humain', outil: 'export', entree_resumee: `${liste.length} fichiers`, resultat_resume: `${nom}.zip`, decision: null, mode: e.mode, cout_usd: 0 }, trace);
        await this.sauver(pid, e);
        return new Response(zip, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${nom}.zip"` } });
      }

      if (action === 'regles' && p[3] && methode === 'DELETE') {
        const r = e.regles.find((x) => x.id === p[3]);
        if (!r) return erreur('règle introuvable', 404);
        r.revoquee_le = new Date().toISOString();
        await trace.regle({ id: r.id, projet_id: pid, portee: r.portee, regle: r.regle, accordee_le: r.accordee_le, revoquee_le: r.revoquee_le });
        await this.journaliser(pid, e, { acteur: 'humain', outil: 'regle', entree_resumee: `retirée : ${r.regle}`, resultat_resume: null, decision: null, mode: e.mode, cout_usd: 0 }, trace);
        await this.sauver(pid, e);
        return json(this.vue(pid, e, this.env));
      }

      return erreur('route inconnue', 404);
    } catch (err) {
      return erreur(err.message || 'erreur', /travaille|attente|plus en attente|Message vide/.test(err.message) ? 409 : 500);
    }
  }
}
