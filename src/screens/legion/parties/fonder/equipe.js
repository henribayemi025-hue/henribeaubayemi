// La composition de l'équipe sur la page Fonder — la logique, sans écran.
//
// Beau, 25/09 (audit de Léo) : « les 71 rôles doivent être cliquables : voir,
// ajouter, retirer, en définir par prompt, envoyer un fichier ». Ici, ce qui
// se calcule : l'équipe qu'on obtient vraiment (les postes du modèle à cette
// taille, moins ceux retirés, plus ceux ajoutés, avec les mandats réécrits),
// combien de personnes tiendront chaque poste, et ce qu'on envoie à la base.
//
// La règle de répartition est CELLE de la base (legion_creer_entreprise) :
// un directeur est seul, chaque poste est tenu par au moins une personne,
// le reste se répartit au prorata des poids, en cumul pour ne perdre
// personne aux arrondis. L'écran doit annoncer exactement ce que la base
// fera — pas une approximation.

import { sansAccent } from '../outils';

export const TAILLES = ['cocon', 'startup', 'scaleup', 'megacorp'];
export const tailleDe = (n) => (n <= 5 ? 'cocon' : n <= 40 ? 'startup' : n <= 300 ? 'scaleup' : 'megacorp');

// La clé d'un poste : le même intitulé écrit avec ou sans accents, avec
// ou sans majuscules, c'est le même poste.
export const clePoste = (poste) => sansAccent(String(poste || '')).replace(/\s+/g, ' ').trim();
export const slugPoste = (s) => sansAccent(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36);

// Le visage d'un poste avant que l'agent ait sa propre photo (Beau, 26/09 : « ce doit
// être de vraies photos ») : une banque de 20 portraits photo de personnes fictives
// (public/leo/visages, générés une fois), toujours le même pour le même poste.
export const NB_VISAGES = 20;
export const indexVisage = (graine) => {
  let h = 0x811c9dc5;
  for (const c of String(graine || '')) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  return (h >>> 0) % NB_VISAGES;
};
export const urlVisage = (i) => `/leo/visages/${String((((i % NB_VISAGES) + NB_VISAGES) % NB_VISAGES) + 1).padStart(2, '0')}.jpg`;
export const visageDe = (modele, poste) => urlVisage(indexVisage(`${modele}-${slugPoste(poste)}`));
// Plusieurs visages côte à côte (la carte d'un modèle) : jamais deux fois le même.
export const visagesDistincts = (modele, postes) => {
  const pris = new Set();
  return postes.map((poste) => {
    let i = indexVisage(`${modele}-${slugPoste(poste)}`);
    while (pris.has(i) && pris.size < NB_VISAGES) i = (i + 1) % NB_VISAGES;
    pris.add(i);
    return urlVisage(i);
  });
};

export const choixVide = () => ({ retires: {}, ajoutes: [], mandats: {} });

export function estModifiee(choix) {
  return Object.keys(choix.retires).length > 0 || choix.ajoutes.length > 0 || Object.keys(choix.mandats).length > 0;
}

// L'équipe qu'on obtient : les postes du modèle ouverts à cet effectif,
// moins les retirés, plus les ajoutés (toujours ouverts, quelle que soit la
// taille), chacun avec son mandat réécrit s'il l'a été. Un poste ne
// figure jamais deux fois. Et jamais plus de postes du modèle que de
// personnes — la règle de la base : « une entreprise de 150 n'ouvre pas
// 238 métiers, elle prend les 150 premiers ». Ce qu'on ajoute soi-même
// s'ajoute par-dessus : c'est un choix explicite.
export function composer(postesModele, effectif, choix = choixVide()) {
  const n = Math.max(1, Number(effectif) || 1);
  const niveau = TAILLES.indexOf(tailleDe(n));
  const vus = new Set();
  const equipe = [];
  for (const p of postesModele || []) {
    if (TAILLES.indexOf(p.des_la_taille) > niveau) continue;
    const k = clePoste(p.poste);
    if (!k || vus.has(k) || choix.retires[k] || equipe.length >= n) continue;
    vus.add(k);
    equipe.push({ ...p, mandat: choix.mandats[k] ?? p.mandat ?? '', poids: p.poids || 1, ajoute: false });
  }
  for (const p of choix.ajoutes || []) {
    const k = clePoste(p.poste);
    if (!k || vus.has(k) || choix.retires[k]) continue;
    vus.add(k);
    equipe.push({
      departement: p.departement || '', poste: p.poste, mandat: choix.mandats[k] ?? p.mandat ?? '',
      est_directeur: !!p.est_directeur, poids: p.poids || 1, agent_cle: p.agent_cle || null, a_ecrire: false,
      des_la_taille: 'cocon', ajoute: true, origine: p.origine || 'main',
    });
  }
  return equipe;
}

// Les postes du modèle qui ne sont PAS dans l'équipe : retirés, ouverts
// seulement à une taille plus grande, ou en attente de plus de monde
// (l'effectif est plus petit que le nombre de métiers). Pour les remettre
// d'un clic.
export function horsEquipe(postesModele, effectif, choix = choixVide()) {
  const n = Math.max(1, Number(effectif) || 1);
  const niveau = TAILLES.indexOf(tailleDe(n));
  const vus = new Set();
  const ajoutes = new Set((choix.ajoutes || []).map((a) => clePoste(a.poste)));
  const dehors = [];
  let ouverts = 0;
  for (const p of postesModele || []) {
    const k = clePoste(p.poste);
    if (!k || vus.has(k)) continue;
    vus.add(k);
    if (choix.retires[k]) dehors.push({ ...p, raison: 'retire' });
    else if (ajoutes.has(k)) continue; // remis à la main : il est dans l'équipe
    else if (TAILLES.indexOf(p.des_la_taille) > niveau) dehors.push({ ...p, raison: 'taille' });
    else if (ouverts >= n) dehors.push({ ...p, raison: 'effectif' });
    else ouverts += 1;
  }
  return dehors;
}

// Combien de personnes tiendront chaque poste — la règle de la base.
// Rend { [clePoste]: n } ; la somme fait exactement l'effectif quand
// l'effectif dépasse le nombre de postes.
export function repartition(equipe, effectif) {
  const n = Math.max(1, Number(effectif) || 1, equipe.length);
  const totalPoids = equipe.reduce((s, p) => s + (p.est_directeur ? 0 : (p.poids || 1)), 0);
  const restant = Math.max(0, n - equipe.length);
  let cumul = 0; let alloue = 0;
  const out = {};
  for (const p of equipe) {
    let ici;
    if (p.est_directeur || totalPoids === 0) ici = 1;
    else {
      cumul += (p.poids || 1);
      ici = 1 + Math.floor((restant * cumul) / totalPoids) - alloue;
      alloue += ici - 1;
    }
    out[clePoste(p.poste)] = ici;
  }
  return out;
}

// Ce que reçoit legion_creer_entreprise (p_postes) : rien de plus que ce
// que la base lit. L'ordre est celui de l'écran.
export function pourLaBase(equipe) {
  return equipe.map((p) => ({
    departement: String(p.departement || '').slice(0, 60), poste: String(p.poste || '').slice(0, 80),
    mandat: String(p.mandat || '').slice(0, 300), est_directeur: !!p.est_directeur,
    poids: Math.min(8, Math.max(1, Number(p.poids) || 1)), agent_cle: p.agent_cle || null, a_ecrire: !!p.a_ecrire,
  }));
}

// Par département, dans l'ordre d'apparition (directeurs en tête dans
// chacun) — pour lire un organigramme, pas une liste plate.
export function parDepartement(postes) {
  const m = new Map();
  for (const p of postes) {
    const nom = p.departement || '—';
    if (!m.has(nom)) m.set(nom, { nom, postes: [] });
    m.get(nom).postes.push(p);
  }
  return [...m.values()].map((d) => ({ ...d, postes: [...d.postes].sort((a, b) => Number(!!b.est_directeur) - Number(!!a.est_directeur)) }));
}

// Un fichier de postes lu SANS moteur quand il est déjà en colonnes :
// CSV ou tabulé, avec une ligne d'en-tête qui nomme « poste » (et, si on
// veut, « département », « mandat », « directeur »). Sinon null : le texte
// part à Léo, qui en tire les postes.
export function lireFichierPostes(texte) {
  const lignes = String(texte || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lignes.length < 2) return null;
  const sep = lignes[0].includes('\t') ? '\t' : lignes[0].includes(';') ? ';' : lignes[0].includes(',') ? ',' : null;
  if (!sep) return null;
  const decouper = (l) => l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim());
  const entete = decouper(lignes[0]).map((c) => sansAccent(c));
  const col = (...noms) => entete.findIndex((c) => noms.some((n) => c === n || c.startsWith(n)));
  const iPoste = col('poste', 'role', 'metier', 'intitule', 'title', 'job', 'position');
  if (iPoste < 0) return null;
  const iDept = col('departement', 'department', 'service', 'equipe', 'team', 'pole');
  const iMandat = col('mandat', 'mission', 'description', 'responsabilit', 'mandate', 'duties');
  const iDir = col('directeur', 'director', 'chef', 'manager', 'head');
  const vus = new Set();
  const postes = [];
  for (const l of lignes.slice(1)) {
    const c = decouper(l);
    const poste = (c[iPoste] || '').slice(0, 80);
    const k = clePoste(poste);
    if (!k || vus.has(k)) continue;
    vus.add(k);
    const dir = iDir >= 0 ? /^(oui|yes|true|1|x|directeur|director)$/i.test(c[iDir] || '') : false;
    postes.push({ departement: (iDept >= 0 && c[iDept]) || '', poste, mandat: (iMandat >= 0 && c[iMandat]) || '', est_directeur: dir, poids: 1, origine: 'fichier' });
  }
  return postes.length ? postes : null;
}
