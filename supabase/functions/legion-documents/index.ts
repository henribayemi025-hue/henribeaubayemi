// LEGION — les documents de l'entreprise, et le tri des demandes clients (23/09).
//
// La vidéo « service client automatisé » envoyée par Beau le 23/09 : les
// documents deviennent une base de connaissances ; chaque message reçu est
// trié (demande d'un client, autre chose, ou rien) ; pour une demande, un
// agent prépare la réponse à partir des documents, et le message est
// étiqueté. Ici, sans boîte mail branchée (⏸ projet Google de Beau) : on
// colle la demande, Legion la trie et prépare le BROUILLON — rien ne part
// sans un humain (leçons de Klarna et d'Air Canada, docs/LEGION-INTERIM-ETUDE.md),
// et la réponse dit qu'elle a été préparée avec une IA (AI Act, article 50).
//
// Deux actions, toujours avec le jeton de la personne (membre de l'entreprise) :
//   { action: 'lire', document_id }   — découpe le document, calcule ses vecteurs
//   { action: 'trier', entreprise_id, demande } — trie et prépare le brouillon

import { avecCache } from '../_shared/cache.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { compter, plafondAtteint, pourEntreprise } from '../_shared/cout.ts';
import { generer, moteursSimples } from '../_shared/moteur.ts';
import { texteDeFichier } from '../_shared/pieces.ts';
import { blocDocuments, chercherPassages, decouper, vecteurs } from '../_shared/documents.ts';

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const SCHEMA_TRI = {
  type: 'OBJECT',
  properties: {
    categorie: { type: 'STRING', enum: ['demande_client', 'autre', 'rien'] },
    sujet: { type: 'STRING' },
    urgence: { type: 'STRING', enum: ['haute', 'normale', 'basse'] },
    brouillon: { type: 'STRING' },
    manque: { type: 'STRING' },
  },
  required: ['categorie', 'sujet', 'urgence', 'brouillon', 'manque'],
};

Deno.serve(compter('legion_documents', async (req: Request) => {
  const h = cors(req.headers.get('Origin'));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' });
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ erreur: 'Il faut être connecté.' }, 401);

  let corps: { action?: string; document_id?: string; entreprise_id?: string; demande?: string };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const personne = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });

  // ——— Lire un document déposé ———
  if (corps.action === 'lire') {
    const { data: doc } = await personne.from('legion_documents').select('id, entreprise_id, titre, url, mime, statut').eq('id', corps.document_id || '').maybeSingle();
    if (!doc) return json({ erreur: 'Document inconnu, ou tu n\'es pas membre.' }, 403);
    pourEntreprise(doc.entreprise_id);
    const p = await plafondAtteint(doc.entreprise_id);
    if (p.atteint) return json({ erreur: `Plafond du mois atteint : ${p.depense.toFixed(2)} € sur ${p.plafond} €.` });
    const echec = async (erreur: string) => {
      await service.from('legion_documents').update({ statut: 'echec', erreur: erreur.slice(0, 300) }).eq('id', doc.id);
      return json({ erreur });
    };
    try {
      if (!doc.url) return await echec('Pas de fichier.');
      const r = await fetch(doc.url, { signal: AbortSignal.timeout(30_000) });
      if (!r.ok) return await echec(`Fichier illisible (HTTP ${r.status}).`);
      const octets = new Uint8Array(await r.arrayBuffer());
      const texte = await texteDeFichier(apiKey, octets, doc.url, doc.mime || r.headers.get('content-type') || '', 300_000);
      if (!texte || texte.trim().length < 20) return await echec('Rien de lisible dans ce fichier.');
      const morceaux = decouper(texte);
      const v = await vecteurs(apiKey, morceaux, 'RETRIEVAL_DOCUMENT');
      await service.from('legion_morceaux').delete().eq('document_id', doc.id);
      for (let i = 0; i < morceaux.length; i += 100) {
        const { error } = await service.from('legion_morceaux').insert(morceaux.slice(i, i + 100).map((t, j) => ({
          document_id: doc.id, entreprise_id: doc.entreprise_id, ordre: i + j, texte: t, embedding: `[${v[i + j].join(',')}]`,
        })));
        if (error) return await echec(`Enregistrement impossible : ${error.message}`);
      }
      await service.from('legion_documents').update({ statut: 'lu', morceaux: morceaux.length, erreur: null, taille: texte.length }).eq('id', doc.id);
      return json({ ok: true, morceaux: morceaux.length, signes: texte.length });
    } catch (e) {
      return await echec((e as Error).message);
    }
  }

  // ——— Trier une demande et préparer le brouillon ———
  if (corps.action === 'trier') {
    const demande = String(corps.demande || '').trim().slice(0, 6000);
    if (demande.length < 3) return json({ erreur: 'Colle le message reçu.' }, 400);
    const { data: entreprise } = await personne.from('legion_entreprises').select('id, nom, projet, langue').eq('id', corps.entreprise_id || '').maybeSingle();
    if (!entreprise) return json({ erreur: 'Entreprise inconnue, ou tu n\'en es pas membre.' }, 403);
    pourEntreprise(entreprise.id);
    const p = await plafondAtteint(entreprise.id);
    if (p.atteint) return json({ erreur: `Plafond du mois atteint : ${p.depense.toFixed(2)} € sur ${p.plafond} €.` });

    // La même demande dans les 7 jours (un message transféré deux fois) : le
    // même tri, sans repayer (0190). Un nouveau document change la clé.
    const { count: nbDocs } = await service.from('legion_documents').select('id', { count: 'exact', head: true }).eq('entreprise_id', entreprise.id).eq('statut', 'lu');
    const cleTri = `${entreprise.id}|${nbDocs || 0}|${demande.replace(/\s+/g, ' ').toLowerCase()}`;
    const dejaTrie = await avecCache<Record<string, unknown>>('tri', cleTri, 7 * 86_400_000, async () => null);
    if (dejaTrie) return json({ ...dejaTrie, depuis_cache: true });
    const passages = await chercherPassages(service, apiKey, entreprise.id, demande, 5);
    const consigne = `Tu tries le courrier de l'entreprise « ${entreprise.nom} »${entreprise.projet ? ` (${String(entreprise.projet).slice(0, 600)})` : ''}.

LE MESSAGE REÇU :
« ${demande} »
${blocDocuments(passages) || "\n(L'entreprise n'a aucun document qui parle de ce sujet.)\n"}
1. "categorie" :
   - "demande_client" : un client ou un prospect demande quelque chose (information, commande, livraison, retour, réclamation, prix…) ;
   - "autre" : un message utile mais pas une demande client (fournisseur, partenaire, candidature, facture, administration) ;
   - "rien" : publicité, spam, notification automatique, message vide.
2. "sujet" : le sujet en quelques mots ; "urgence" : haute (colère, argent bloqué, délai dépassé), normale, basse.
3. "brouillon" (seulement pour "demande_client", sinon "") : la réponse à envoyer, dans la langue du message, courte et chaleureuse, écrite À PARTIR DES DOCUMENTS ci-dessus seulement. Jamais de remboursement, de prix, de délai ni d'engagement qui n'est pas écrit dans les documents : si la réponse n'y est pas, le brouillon dit qu'on vérifie et qu'on revient vers la personne. Termine TOUJOURS par une ligne vide puis « Réponse préparée avec l'aide d'un assistant IA. » (dans la langue du message).
4. "manque" : si les documents ne suffisent pas, ce qu'il faudrait ajouter aux documents ou demander à un humain, en une phrase ; sinon "".`;
    const r = await generer(apiKey, consigne, SCHEMA_TRI, { temperature: 0.3, reflexion: 1024, delaiMs: 40_000, maxSortie: 4096, modeles: moteursSimples() });
    if ('erreur' in r) {
      const sature = /503|UNAVAILABLE|high demand|429/i.test(r.erreur);
      return json({ erreur: sature ? 'Les modèles de Google sont saturés en ce moment. Réessaie dans une minute.' : 'Pas de tri cette fois. Réessaie.' });
    }
    const client = r.obj.categorie === 'demande_client';
    // Le brouillon, présentable: la salutation sur sa ligne, et la mention IA
    // (AI Act, article 50) en paragraphe à part — le modèle collait tout
    // (« Bonjour,Oui… », vu le 23/09).
    let brouillon = client ? String(r.obj.brouillon || '').trim() : '';
    if (brouillon) {
      const mention = /r[ée]ponse pr[ée]par[ée]e avec l.aide d.un assistant ia\.?|answer prepared with the help of an ai assistant\.?/i;
      const anglais = /^(hello|hi|dear|good (morning|afternoon|evening))\b/i.test(brouillon);
      brouillon = brouillon.replace(mention, '').trim()
        .replace(/^((?:bonjour|bonsoir|hello|hi|dear)[^,\n]{0,40},)(?=\S)/i, '$1\n\n')
        .replace(/([.!?])(?=[A-ZÀ-ÖØ-Þ])/g, '$1 ');
      brouillon = `${brouillon}\n\n${anglais ? 'Answer prepared with the help of an AI assistant.' : "Réponse préparée avec l'aide d'un assistant IA."}`;
    }
    // Les sources citables (une par document), pour une demande client seulement.
    const vus = new Set<string>();
    const sources = client ? passages.filter((x) => { if (vus.has(x.document_id)) return false; vus.add(x.document_id); return true; })
      .map((x) => ({ titre: x.titre, url: x.url })) : [];
    const resultat = { ok: true, categorie: r.obj.categorie, sujet: r.obj.sujet, urgence: r.obj.urgence, brouillon, manque: client ? String(r.obj.manque || '') : '', sources, modele: r.modele };
    await avecCache('tri', cleTri, 7 * 86_400_000, async () => resultat);
    return json(resultat);
  }

  return json({ erreur: 'Action inconnue.' }, 400);
}));
