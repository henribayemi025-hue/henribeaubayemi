// LEGION — les outils de lecture des agents et l'enquête qui s'en sert.
// Partagé par legion-repondre (quand on leur parle) et legion-travail (leur
// journée de travail, sans qu'on leur parle).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { gemini } from './cout.ts';

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

// Une enquête par message, faite une fois pour toute l'équipe: le modèle
// choisit les outils, la base répond, et les résultats entrent dans la
// consigne de chaque agent qui répond. Rien à vérifier → liste vide.
export async function enqueter(apiKey: string, service: ReturnType<typeof createClient>, fil: string, question: string, direction = false): Promise<string[]> {
  const outils = direction ? [{ functionDeclarations: [...OUTILS[0].functionDeclarations, ...OUTILS_DIRECTION] }] : OUTILS;
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const contents: unknown[] = [{ role: 'user', parts: [{ text:
`Tu prépares la réponse d'une équipe à son fondateur, sur la place de marché Finjaro. Nous sommes le ${aujourdhui}.
La conversation récente:
${fil}

Le dernier message, auquel il faut répondre: « ${question} »

Si y répondre demande un chiffre ou une vérification dans la base de la place de marché, appelle les outils nécessaires (${MAX_APPELS} appels au plus). Sinon n'appelle rien et réponds seulement « rien ».` }] }];
  const resultats: string[] = [];
  for (let tour = 0; tour < 3 && resultats.length < MAX_APPELS; tour += 1) {
    let parts: Array<{ functionCall?: { name: string; args?: Record<string, unknown> } }> = [];
    try {
      const resp = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${MODELE_ENQUETE}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, tools: outils, generationConfig: { temperature: 0.1, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } } }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!resp.ok) { console.error('enquête:', resp.status, (await resp.text()).slice(0, 200)); break; }
      parts = (await resp.json())?.candidates?.[0]?.content?.parts ?? [];
    } catch (e) { console.error('enquête:', (e as Error).message); break; }
    const appels = parts.filter((x) => x.functionCall).slice(0, MAX_APPELS - resultats.length);
    if (!appels.length) break;
    contents.push({ role: 'model', parts });
    const reponses = [];
    for (const { functionCall } of appels) {
      const nom = functionCall!.name;
      const args = functionCall!.args ?? {};
      const fonction = OUTILS_PERSONNES.has(nom) ? (direction ? 'legion_outil_personnes' : null) : 'legion_outil';
      const { data, error } = fonction ? await service.rpc(fonction, { p_nom: nom, p_params: args }) : { data: null, error: { message: 'outil réservé à la Direction' } };
      const resultat = error ? { erreur: error.message } : data;
      resultats.push(`${nom}(${JSON.stringify(args)}) → ${JSON.stringify(resultat).slice(0, 3000)}`);
      reponses.push({ functionResponse: { name: nom, response: { resultat } } });
    }
    contents.push({ role: 'user', parts: reponses });
  }
  return resultats;
}

