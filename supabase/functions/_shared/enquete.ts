// LEGION — les outils de lecture des agents et l'enquête qui s'en sert.
// Partagé par legion-repondre (quand on leur parle) et legion-travail (leur
// journée de travail, sans qu'on leur parle).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { gemini } from './cout.ts';
import { generer, moteursSimples } from './moteur.ts';
import { classerFiches, voirFiche } from './fiches.ts';

const MODELE_ENQUETE = 'gemini-2.5-flash';
const TIMEOUT_MS = 25_000;

// Les outils de lecture (0144): l'agent VÉRIFIE lui-même dans la base avant
// de répondre. Beau, 22/09: « il dit les chiffres, il ne peut pas vérifier,
// pourtant il doit le faire ». Chaque outil est une requête fixe côté base
// (legion_outil), aux paramètres bornés: pas de SQL libre.
const JOURS = { type: 'INTEGER', description: 'Période en jours, de 1 à 90 (7 par défaut).' };
const OUTILS = [{
  functionDeclarations: [
    { name: 'verifier_jour', description: "Vérifier un jour précis: navigateurs, visiteurs engagés, fiches vues, articles différents vus, heure de pointe, recherches, contacts, et un verdict calculé (robot qui parcourt le catalogue, ou trafic normal).",
      parameters: { type: 'OBJECT', properties: { date: { type: 'STRING', description: 'Le jour, au format AAAA-MM-JJ.' } }, required: ['date'] } },
    { name: 'compter_evenement', description: "Compter un type d'événement sur une période, avec le nombre de personnes distinctes et le détail jour par jour.",
      parameters: { type: 'OBJECT', properties: {
        type: { type: 'STRING', enum: ['visit', 'product_view', 'shop_view', 'category_view', 'search', 'whatsapp_click', 'phone_click', 'contact_intent', 'cart_add', 'checkout_start', 'follow', 'comment', 'reel_view', 'share_reel'] },
        jours: JOURS }, required: ['type'] } },
    { name: 'classer_boutiques', description: 'Les meilleures boutiques selon un critère (articles en ligne, commandes sur la période, abonnés, vues des articles).',
      parameters: { type: 'OBJECT', properties: {
        critere: { type: 'STRING', enum: ['articles', 'commandes', 'abonnes', 'vues'] },
        n: { type: 'INTEGER', description: 'Combien de boutiques, de 1 à 20.' }, jours: JOURS }, required: ['critere'] } },
    { name: 'articles', description: "Les articles en ligne, filtrés par catégorie et/ou prix plafond: leur nombre, le prix médian, les plus vus.",
      parameters: { type: 'OBJECT', properties: {
        categorie: { type: 'STRING', description: "Code de catégorie tel que donné par l'outil categories (ex. mode_femme)." },
        prix_max_fcfa: { type: 'INTEGER' }, n: { type: 'INTEGER', description: 'Combien d’articles les plus vus, de 1 à 20.' } } } },
    { name: 'categories', description: "Le nombre d'articles en ligne dans chaque catégorie." },
    { name: 'commandes', description: 'Les commandes sur une période: nombre, montant total, répartition par statut.',
      parameters: { type: 'OBJECT', properties: { jours: JOURS, statut: { type: 'STRING', description: 'Filtrer sur un statut (ex. new, delivered, cancelled).' } } } },
    { name: 'pays', description: 'Les comptes et les boutiques, pays par pays.' },
    // Chercher soi-même dans le catalogue (Beau, 25/09 : « il doit pouvoir
    // chercher »). Robots et comptes de test retirés.
    { name: 'fiches', description: "Classer les fiches articles une par une (avec leur lien finjaro.net) : les plus vues (tri 'vues'), les plus vues SANS aucun ajout au panier ('sans_ajout'), les plus vues SANS prix affiché ('sans_prix'), ou SANS description ('sans_description'). Pour chacune : boutique, prix ou « sur demande », nombre de photos, longueur de la description, stock, vues et ajouts au panier. Robots et comptes de test retirés.",
      parameters: { type: 'OBJECT', properties: {
        tri: { type: 'STRING', enum: ['vues', 'sans_ajout', 'sans_prix', 'sans_description'] },
        jours: { type: 'INTEGER', description: 'Période en jours, de 1 à 30 (7 par défaut).' },
        n: { type: 'INTEGER', description: 'Combien de fiches, de 1 à 20 (10 par défaut).' } } } },
    { name: 'voir_fiche', description: "Voir une fiche article comme l'acheteur la voit : prix (ou « sur demande »), photos, description, tailles, couleurs, stock, boutique (lien, pays, ville, note), vues et ajouts au panier sur 30 jours. On donne son lien finjaro.net, son identifiant, ou au moins 3 lettres de son nom.",
      parameters: { type: 'OBJECT', properties: { fiche: { type: 'STRING', description: 'Le lien, l’identifiant ou une partie du nom.' } }, required: ['fiche'] } },
    // La Finia commune (0202, 24/09) : ce que les gens demandent à Finia et
    // qu'elle n'a pas su, ou sur quoi ils l'ont corrigée — anonyme (un
    // nombre et des exemples nettoyés), de personnes qui ne l'ont pas
    // refusé, comptes de test exclus. Pour Écho (le support), Traque, Plume
    // (le contenu) et Lien : c'est la voix des clientes, sans leur nom.
    // Source « mesures » : seule l'équipe Finjaro l'a, et les droits par
    // agent (peut_lire) s'appliquent comme pour les autres chiffres.
    { name: 'questions_finia', description: "Les questions fréquentes posées à Finia (l'assistante de la place de marché) cette semaine, anonymes : combien d'échanges gardés, combien de personnes distinctes, par type (question restée sans réponse, correction de la personne, pouce vers le bas), par langue, et des exemples déjà nettoyés (aucun nom, téléphone, e-mail ni adresse). Utile pour le support, la FAQ, le contenu et les relances.",
      parameters: { type: 'OBJECT', properties: { jours: { type: 'INTEGER', description: 'Période en jours, de 1 à 7 (7 par défaut).' } } } },
  ],
}];
const MAX_APPELS = 4;

// Réservés à la Direction (Beau, 22/09: « qui sont ces personnes ? »): qui a
// fait une action, et la fiche d'une personne — noms et activité, jamais
// d'e-mail ni de téléphone (0153, legion_outil_personnes).
const OUTILS_DIRECTION = [
  { name: 'qui_a_fait', description: "Qui (nom affiché) a fait une action sur la place de marché: les personnes connectées, combien de fois, sur quoi, si c'est une vendeuse; et combien de visiteurs non connectés (sans nom).",
    parameters: { type: 'OBJECT', properties: {
      type: { type: 'STRING', enum: ['product_view', 'shop_view', 'search', 'whatsapp_click', 'phone_click', 'contact_intent', 'cart_add', 'checkout_start', 'follow', 'comment', 'share_reel', 'share_shop'] },
      jours: JOURS }, required: ['type'] } },
  { name: 'fiche_personne', description: "La fiche d'une personne à partir de son nom (au moins 3 lettres): inscription, pays, ville, ses boutiques s'il y en a, ses commandes, ses 15 dernières actions. Sert à savoir qui c'est et ce qu'elle a fait (par exemple: cliente ou vendeuse qui teste sa boutique).",
    parameters: { type: 'OBJECT', properties: { nom: { type: 'STRING' } }, required: ['nom'] } },
];
const OUTILS_PERSONNES = new Set(OUTILS_DIRECTION.map((o) => o.name));

// « Se connecter avec Finjaro » (0160): l'entreprise a branché SA boutique
// de la place de marché; ses agents lisent SES chiffres — prénom de la
// cliente au plus, jamais de téléphone ni d'adresse.
export type Boutique = { shop_id: string; nom: string };
const OUTILS_BOUTIQUE = [
  { name: 'ma_boutique_resume', description: "Le tableau de bord de NOTRE boutique sur Finjaro: articles en ligne, stock faible, commandes sur la période (par statut, montant livré), commandes qui attendent notre réponse, vues et ajouts au panier des 7 jours, messages non répondus, abonnés, note.",
    parameters: { type: 'OBJECT', properties: { jours: JOURS } } },
  { name: 'ma_boutique_commandes', description: 'Les dernières commandes de NOTRE boutique: numéro, statut, montant, date, prénom de la cliente, articles.',
    parameters: { type: 'OBJECT', properties: { jours: JOURS, n: { type: 'INTEGER', description: 'Combien, de 1 à 20.' }, statut: { type: 'STRING', description: 'Filtrer sur un statut (new, confirmed, shipped, delivered, cancelled).' } } } },
  { name: 'ma_boutique_articles', description: 'Les articles de NOTRE boutique: prix, stock, en ligne ou non, vues et ajouts au panier sur 30 jours.',
    parameters: { type: 'OBJECT', properties: { n: { type: 'INTEGER', description: 'Combien, de 1 à 20.' } } } },
  { name: 'ma_boutique_avis', description: 'Les derniers avis laissés sur NOTRE boutique: note, texte, article.',
    parameters: { type: 'OBJECT', properties: { n: { type: 'INTEGER', description: 'Combien, de 1 à 20.' } } } },
];
const OUTILS_MA_BOUTIQUE = new Set(OUTILS_BOUTIQUE.map((o) => o.name));

// « Se connecter avec Finjaro Accounting » (0180): l'entreprise a branché SA
// comptabilité; ses agents lisent les TOTAUX de ses livres (résumé du mois,
// ventes, dépenses par catégorie, impayés) par les fonctions d'Accounting —
// jamais une ligne de client. La base revérifie à chaque lecture que la
// personne qui a branché est toujours membre de l'espace.
export type Compta = { entreprise_id: string; nom: string };
const OUTILS_COMPTA = [
  { name: 'ma_compta_resume_mois', description: "Le résumé d'un mois dans NOTRE comptabilité (Finjaro Accounting): ventes confirmées, dépenses, résultat simplifié, encaissé net, créances clients et dettes fournisseurs impayées, dans la devise de l'espace.",
    parameters: { type: 'OBJECT', properties: { mois: { type: 'STRING', description: 'Le mois, au format AAAA-MM (le mois en cours par défaut).' } } } },
  { name: 'ma_compta_ventes', description: 'Les ventes confirmées de NOTRE comptabilité sur une période: nombre, total, panier moyen, répartition par moyen de paiement.',
    parameters: { type: 'OBJECT', properties: { jours: { type: 'INTEGER', description: 'Les N derniers jours, de 1 à 366 (30 par défaut).' } } } },
  { name: 'ma_compta_depenses', description: 'Les dépenses de NOTRE comptabilité par catégorie sur une période.',
    parameters: { type: 'OBJECT', properties: { jours: { type: 'INTEGER', description: 'Les N derniers jours, de 1 à 366 (30 par défaut).' } } } },
  { name: 'ma_compta_impayes', description: "Ce qui reste à encaisser (clients: nombre, total, dont plus de 30 jours) et à payer (fournisseurs), dans NOTRE comptabilité." },
];
const OUTILS_MA_COMPTA = new Set(OUTILS_COMPTA.map((o) => o.name));

// Une vérification est-elle lisible par CET agent (0177, droits par agent)?
// Chaque ligne commence par le nom de l'outil: ma_boutique_* → « boutique »,
// ma_compta_* → « comptabilite », le reste → « mesures ».
export function verifsPour(verifs: string[], peut: (source: string) => boolean): string[] {
  return verifs.filter((v) => peut(v.startsWith('ma_boutique_') ? 'boutique' : v.startsWith('ma_compta_') ? 'comptabilite' : 'mesures'));
}

// Une enquête par message, faite une fois pour toute l'équipe: le modèle
// choisit les outils, la base répond, et les résultats entrent dans la
// consigne de chaque agent qui répond. Rien à vérifier → liste vide.
export async function enqueter(apiKey: string, service: ReturnType<typeof createClient>, fil: string, question: string, direction = false, boutique: Boutique | null = null, mesures = true, compta: Compta | null = null): Promise<string[]> {
  const declarations = [
    ...(mesures ? OUTILS[0].functionDeclarations : []),
    ...(direction ? OUTILS_DIRECTION : []),
    ...(boutique ? OUTILS_BOUTIQUE : []),
    ...(compta ? OUTILS_COMPTA : []),
  ];
  if (!declarations.length) return [];
  const outils = [{ functionDeclarations: declarations }];
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const contents: unknown[] = [{ role: 'user', parts: [{ text:
`Tu prépares la réponse d'une équipe à son fondateur${mesures ? ', sur la place de marché Finjaro' : ''}. Nous sommes le ${aujourdhui}.
${boutique ? `L'entreprise a branché SA boutique Finjaro « ${boutique.nom} »: les outils ma_boutique_* lisent ses ventes, son stock, ses avis, ses messages.\n` : ''}${compta ? `L'entreprise a branché SA comptabilité (Finjaro Accounting, « ${compta.nom} »): les outils ma_compta_* lisent les totaux de ses livres (mois, ventes, dépenses, impayés).\n` : ''}La conversation récente:
${fil}

Le dernier message, auquel il faut répondre: « ${question} »

Si y répondre demande un chiffre ou une vérification dans la base${compta ? ' ou dans la comptabilité' : ''}, appelle les outils nécessaires (${MAX_APPELS} appels au plus). Sinon n'appelle rien et réponds seulement « rien ».` }] }];
  const resultats: string[] = [];
  // Un outil, sa source (la place de marché, SA boutique, SA comptabilité,
  // les personnes pour la Direction) : toujours une requête fixe côté base.
  const executer = async (nom: string, args: Record<string, unknown>): Promise<unknown> => {
    let appel: Promise<{ data: unknown; error: { message: string } | null }>;
    if (OUTILS_MA_COMPTA.has(nom)) {
      appel = compta ? service.rpc('legion_outil_comptabilite', { p_nom: nom.replace('ma_compta_', ''), p_params: args, p_entreprise: compta.entreprise_id }) : Promise.resolve({ data: null, error: { message: 'aucune comptabilité branchée' } });
    } else if (OUTILS_MA_BOUTIQUE.has(nom)) {
      appel = boutique ? service.rpc('legion_outil_boutique', { p_nom: nom.replace('ma_boutique_', ''), p_params: args, p_shop: boutique.shop_id }) : Promise.resolve({ data: null, error: { message: 'aucune boutique branchée' } });
    } else if (OUTILS_PERSONNES.has(nom)) {
      appel = direction ? service.rpc('legion_outil_personnes', { p_nom: nom, p_params: args }) : Promise.resolve({ data: null, error: { message: 'outil réservé à la Direction' } });
    } else if (nom === 'fiches' || nom === 'voir_fiche') {
      appel = (nom === 'fiches' ? classerFiches(service, args) : voirFiche(service, args))
        .then((data) => ({ data, error: null }), (e: Error) => ({ data: null, error: { message: e.message } }));
    } else if (nom === 'questions_finia') {
      appel = service.rpc('ia_questions_frequentes', { p_jours: Number(args.jours) || 7, p_app: null });
    } else {
      appel = service.rpc('legion_outil', { p_nom: nom, p_params: args });
    }
    const { data, error } = await appel;
    return error ? { erreur: error.message } : data;
  };
  let googleMuet = false;
  for (let tour = 0; tour < 3 && resultats.length < MAX_APPELS; tour += 1) {
    let parts: Array<{ functionCall?: { name: string; args?: Record<string, unknown> } }> = [];
    try {
      const resp = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${MODELE_ENQUETE}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, tools: outils, generationConfig: { temperature: 0.1, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } } }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!resp.ok) { console.error('enquête:', resp.status, (await resp.text()).slice(0, 200)); googleMuet = tour === 0; break; }
      parts = (await resp.json())?.candidates?.[0]?.content?.parts ?? [];
    } catch (e) { console.error('enquête:', (e as Error).message); googleMuet = tour === 0; break; }
    const appels = parts.filter((x) => x.functionCall).slice(0, MAX_APPELS - resultats.length);
    if (!appels.length) break;
    contents.push({ role: 'model', parts });
    const reponses = [];
    for (const { functionCall } of appels) {
      const nom = functionCall!.name;
      const args = functionCall!.args ?? {};
      const resultat = await executer(nom, args);
      resultats.push(`${nom}(${JSON.stringify(args)}) → ${JSON.stringify(resultat).slice(0, nom === 'fiches' || nom === 'voir_fiche' ? 7000 : 3000)}`);
      reponses.push({ functionResponse: { name: nom, response: { resultat } } });
    }
    contents.push({ role: 'user', parts: reponses });
  }
  // Google ne répond pas (plafond de dépense atteint le 24/09, vu dans les
  // journaux : chaque « enquête » tombait en 429 et les agents se disaient
  // « bloqués » faute de chiffres). Relais par le moteur commun (DeepSeek,
  // Kimi…) : il ne sait pas appeler les outils à la manière de Google, alors
  // il choisit en une fois les vérifications à faire, et la base y répond.
  if (googleMuet && !resultats.length) {
    const permis = new Map(declarations.map((d) => [d.name, d]));
    const liste = declarations.map((d) => `- ${d.name} : ${d.description} Paramètres : ${JSON.stringify(d.parameters?.properties ?? {})}`).join('\n');
    const r = await generer(apiKey, `${(contents[0] as { parts: { text: string }[] }).parts[0].text}

Les outils disponibles (et SEULEMENT ceux-là) :
${liste}

Réponds par la liste des appels à faire (${MAX_APPELS} au plus), chacun avec le nom exact de l'outil et ses paramètres en JSON (par exemple {"date":"${aujourdhui}"}). S'il n'y a rien à vérifier, une liste vide.`,
      { type: 'OBJECT', properties: { appels: { type: 'ARRAY', items: { type: 'OBJECT', properties: { nom: { type: 'STRING' }, parametres: { type: 'STRING' } }, required: ['nom', 'parametres'] } } }, required: ['appels'] },
      { temperature: 0.1, maxSortie: 800, modeles: moteursSimples() });
    if (!('erreur' in r)) {
      for (const a of (Array.isArray(r.obj.appels) ? r.obj.appels : []).slice(0, MAX_APPELS) as { nom: string; parametres: string }[]) {
        const nom = String(a.nom || '').trim();
        if (!permis.has(nom)) continue;
        let args: Record<string, unknown> = {};
        try { const x = JSON.parse(String(a.parametres || '{}')); if (x && typeof x === 'object' && !Array.isArray(x)) args = x; } catch { /* paramètres illisibles : l'outil prend ses valeurs par défaut */ }
        const resultat = await executer(nom, args);
        resultats.push(`${nom}(${JSON.stringify(args)}) → ${JSON.stringify(resultat).slice(0, nom === 'fiches' || nom === 'voir_fiche' ? 7000 : 3000)}`);
      }
    } else console.error('enquête (relais):', r.erreur);
  }
  return resultats;
}

