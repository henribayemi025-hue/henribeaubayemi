// LEGION — « créer un visuel » : l'outil photo des agents (Beau, 29/09 :
// « faire un agent qui génère vidéo, photo » ; budget 10 € par mois).
//
// Un agent PROPOSE un visuel dans sa réponse (action « creer_visuel »,
// valeur = la description). Rien ne se fabrique avant que le patron touche
// « Confirmer » : legion-action nous appelle alors, avec le jeton du serveur.
// On vérifie le budget du mois de l'entreprise (0218), on fabrique l'image
// chez Google, on la range dans notre stockage (JPEG léger), et l'agent la
// poste dans le salon.
//
// Ce que ça ne fait pas : le visage d'une personne réelle, une fausse photo
// d'un article vendu (un visuel fabriqué n'est jamais présenté comme la photo
// d'un vrai produit — règle « aucune photo d'article prise ailleurs que chez
// la vendeuse »), un logo de marque existante.
//
// LA VIDÉO (29/09, « oui fais la vidéo ») : même chemin (« creer_video »),
// même budget. Veo travaille une à trois minutes : on lance la fabrication,
// on attend au plus ~100 s, et si elle n'est pas prête la fonction se
// relance elle-même pour continuer d'attendre (une fonction a un temps
// compté). Le coût est compté à la fin, jamais sous le prix publié.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ajouterCout, compter, coutEnCours, gemini, pourEntreprise } from '../_shared/cout.ts';
import { deposerPrive } from '../_shared/fichiers.ts';
import { Image as Dessin } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

// 05/10 : gemini-2.5-flash-image arrêté le 02/10, les « -preview » le 25/06
// (ai.google.dev/gemini-api/docs/deprecations) — les deux anciens noms échouaient.
const MODELES_IMAGE = ['gemini-3.1-flash-image', 'gemini-3-pro-image'];
const TIMEOUT_MS = 90_000;
// Ce qu'on compte au minimum par image (euros) : le prix publié arrondi au-dessus,
// pour que le budget ne soit jamais dépassé par un comptage trop optimiste.
// Prix des deux nouveaux noms non relevé : compté large (au moins l'ancien tarif pro).
const MINIMUM_PAR_IMAGE: Record<string, number> = { 'gemini-3.1-flash-image': 0.15, 'gemini-3-pro-image': 0.15 };
// Vidéo de ~8 s : les modèles rapides d'abord (moins chers) ; les autres seulement
// s'il reste assez de budget. Minimum compté par vidéo, en euros, arrondi au-dessus.
const MODELES_VIDEO: Array<[string, number]> = [
  ['veo-3.1-fast-generate-preview', 1.5], ['veo-3.0-fast-generate-001', 1.5],
  ['veo-3.1-generate-preview', 3.5], ['veo-3.0-generate-001', 3.5], ['veo-2.0-generate-001', 3.0],
];
const VIDEO_MIN = 1.5;
const G = 'https://generativelanguage.googleapis.com/v1beta';

const CADRE = 'Visuel professionnel pour une entreprise (réseaux sociaux, affiche, illustration). '
  + 'Aucun visage d\'une personne réelle identifiable, aucun logo de marque existante, aucun texte long dans l\'image. '
  + 'Demande : ';

type Image = { octets: Uint8Array; modele: string } | { erreur: string };

async function fabriquer(apiKey: string, invite: string): Promise<Image> {
  let derniere = 'aucun modèle d’image joignable';
  for (const modele of MODELES_IMAGE) {
    try {
      const r = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: CADRE + invite }] }], generationConfig: { responseModalities: ['IMAGE'] } }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!r.ok) { derniere = `${modele}: HTTP ${r.status} ${(await r.text()).slice(0, 180)}`; console.error(derniere); continue; }
      const b = await r.json();
      const img = (b?.candidates?.[0]?.content?.parts ?? []).find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
      if (!img) { derniere = `${modele}: pas d’image (${b?.candidates?.[0]?.finishReason ?? '?'})`; console.error(derniere); continue; }
      const brut = atob(img.inlineData.data as string);
      const octets = new Uint8Array(brut.length);
      for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
      return { octets, modele };
    } catch (e) {
      derniere = `${modele}: ${(e as Error).message}`;
      console.error(derniere);
    }
  }
  return { erreur: derniere };
}

// Rangé léger : 1280 px au plus, JPEG 85 (le stockage gratuit se remplit, Beau 26/09).
async function leger(octets: Uint8Array): Promise<Uint8Array | null> {
  try {
    const img = await Dessin.decode(octets);
    if (img.width > 1280) img.resize(1280, Dessin.RESIZE_AUTO);
    return await img.encodeJPEG(85);
  } catch (e) { console.error('leger:', (e as Error).message); return null; }
}

Deno.serve(compter('legion_visuel', async (req: Request) => {
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);
  // Seul le serveur appelle (legion-action, après « Confirmer »).
  if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) return json({ erreur: 'non autorisé' }, 401);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ erreur: 'Moteur non configuré.' }, 503);

  let corps: { entreprise_id?: string; message_id?: string; agent_id?: string; invite?: string; genre?: string; operation?: string; modele?: string; essai?: number };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const invite = String(corps.invite || '').trim().slice(0, 1500);
  if (!corps.entreprise_id || !corps.message_id || !corps.agent_id || invite.length < 5) return json({ erreur: 'Demande incomplète.' }, 400);
  pourEntreprise(corps.entreprise_id);

  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: msg } = await service.from('legion_messages').select('id, entreprise_id, canal_id, meta').eq('id', corps.message_id).eq('entreprise_id', corps.entreprise_id).maybeSingle();
  if (!msg) return json({ erreur: 'Message inconnu.' }, 404);
  const action = ((msg.meta || {}) as { action?: Record<string, unknown> }).action || {};
  const finir = async (statut: string, resultat: string) => {
    await service.from('legion_messages').update({ meta: { ...(msg.meta as Record<string, unknown>), action: { ...action, statut, resultat, le: new Date().toISOString() } } }).eq('id', msg.id);
    return json({ statut, resultat });
  };

  // Le budget du mois (0218) : vide = pas activé pour cette entreprise.
  const debut = new Date(); debut.setUTCDate(1); debut.setUTCHours(0, 0, 0, 0);
  const [{ data: e }, { data: lignes }] = await Promise.all([
    service.from('legion_entreprises').select('budget_visuels_eur').eq('id', corps.entreprise_id).maybeSingle(),
    service.from('ai_usage').select('cost_eur').eq('entreprise_id', corps.entreprise_id).eq('fn', 'legion_visuel').gte('created_at', debut.toISOString()),
  ]);
  const budget = e?.budget_visuels_eur == null ? null : Number(e.budget_visuels_eur);
  const depense = (lignes || []).reduce((s: number, l: { cost_eur: number }) => s + Number(l.cost_eur || 0), 0);
  if (budget == null || budget <= 0) return finir('echec', 'Les visuels ne sont pas encore activés pour cette entreprise.');
  const video = corps.genre === 'video';
  if (!corps.operation && depense + (video ? VIDEO_MIN : 0.15) > budget) return finir('echec', `Budget des visuels du mois atteint (${depense.toFixed(2)} € sur ${budget.toFixed(2)} €). Il se renouvelle le 1er du mois.`);

  if (video) {
    const relancer = (suite: Record<string, unknown>) => {
      const p = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/legion-visuel`, {
        method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...corps, ...suite }),
      }).catch((e) => console.error('suite vidéo:', (e as Error).message));
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(p);
    };
    let operation = corps.operation || '';
    let modele = corps.modele || '';
    if (!operation) {
      // Lancer la fabrication : le premier modèle qui accepte, dans le budget restant.
      const format = /vertical|9:16|story|stories|reel|tiktok|portrait/i.test(invite) ? '9:16' : '16:9';
      let derniere = 'aucun modèle vidéo joignable';
      for (const [m, prix] of MODELES_VIDEO) {
        if (depense + prix > budget) continue;
        try {
          const r = await fetch(`${G}/models/${m}:predictLongRunning`, {
            method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: [{ prompt: CADRE + invite }], parameters: { aspectRatio: format } }),
            signal: AbortSignal.timeout(30_000),
          });
          if (!r.ok) { derniere = `${m}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`; console.error(derniere); continue; }
          const b = await r.json();
          if (!b?.name) { derniere = `${m}: pas d'opération`; continue; }
          operation = b.name; modele = m; break;
        } catch (e) { derniere = `${m}: ${(e as Error).message}`; console.error(derniere); }
      }
      if (!operation) return finir('echec', `La vidéo n’a pas pu être lancée (${derniere.slice(0, 160)}).`);
      await service.from('legion_messages').update({ meta: { ...(msg.meta as Record<string, unknown>), action: { ...action, statut: 'en_cours', resultat: 'La vidéo se fabrique (une à trois minutes).', operation, modele } } }).eq('id', msg.id);
    }
    // Attendre, au plus ~100 s dans cette fonction.
    const fin = Date.now() + 100_000;
    let uri = '';
    while (Date.now() < fin) {
      await new Promise((ok) => setTimeout(ok, 8_000));
      const r = await fetch(`${G}/${operation}`, { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.timeout(20_000) }).catch(() => null);
      if (!r || !r.ok) continue;
      const b = await r.json();
      if (b?.error) return finir('echec', `La vidéo a échoué chez Google (${String(b.error.message || '').slice(0, 160)}).`);
      if (b?.done) {
        uri = b?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri || '';
        if (!uri) return finir('echec', 'Google n’a rendu aucune vidéo (demande peut-être refusée par ses règles).');
        break;
      }
    }
    if (!uri) {
      const essai = (corps.essai || 0) + 1;
      if (essai > 6) return finir('echec', 'La vidéo a pris trop de temps (plus de 10 minutes).');
      relancer({ operation, modele, essai });
      return json({ statut: 'en_cours' });
    }
    const dl = await fetch(uri, { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.timeout(60_000) });
    if (!dl.ok) return finir('echec', `Vidéo prête mais impossible à récupérer (HTTP ${dl.status}).`);
    const octets = new Uint8Array(await dl.arrayBuffer());
    const prix = MODELES_VIDEO.find(([m]) => m === modele)?.[1] ?? 3.5;
    ajouterCout(prix);
    // Dossier PRIVÉ de l'entreprise (audit du 01/10, C-2) : le visuel est à elle.
    const chemin = `${corps.entreprise_id}/visuels/${crypto.randomUUID()}.mp4`;
    const depV = await deposerPrive(chemin, octets, 'video/mp4');
    if (!depV.url) return finir('echec', `Rangement impossible : ${depV.erreur}`);
    const urlV = depV.url;
    const { error: eMsgV } = await service.from('legion_messages').insert({
      entreprise_id: corps.entreprise_id, canal_id: msg.canal_id, auteur_id: corps.agent_id,
      texte: 'Voici la vidéo.',
      meta: { par_ia: true, pieces: [{ type: 'video', url: urlV, nom: 'video.mp4' }], visuel: { invite, modele, cout_eur: prix, genre: 'video' }, reponse_a_id: msg.id, cout_eur: prix },
    });
    if (eMsgV) console.error('message de la vidéo:', eMsgV.message);
    return finir('faite', `Vidéo prête (${prix.toFixed(2)} €). Reste ce mois : ${Math.max(0, budget - depense - prix).toFixed(2)} €.`);
  }

  const avant = coutEnCours();
  const img = await fabriquer(apiKey, invite);
  if ('erreur' in img) return finir('echec', `Le visuel n’a pas pu être fabriqué (${img.erreur.slice(0, 160)}).`);
  const compte = coutEnCours() - avant;
  const minimum = MINIMUM_PAR_IMAGE[img.modele] ?? 0.15;
  if (compte < minimum) ajouterCout(minimum - compte);

  const petit = await leger(img.octets);
  const chemin = `${corps.entreprise_id}/visuels/${crypto.randomUUID()}.${petit ? 'jpg' : 'png'}`;
  const dep = await deposerPrive(chemin, petit || img.octets, petit ? 'image/jpeg' : 'image/png');
  if (!dep.url) return finir('echec', `Rangement impossible : ${dep.erreur}`);
  const url = dep.url;
  const cout = Number((coutEnCours() - avant).toFixed(4));

  const { error: eMsg } = await service.from('legion_messages').insert({
    entreprise_id: corps.entreprise_id, canal_id: msg.canal_id, auteur_id: corps.agent_id,
    texte: 'Voici le visuel.',
    meta: { par_ia: true, pieces: [{ type: 'image', url, nom: 'visuel.jpg' }], visuel: { invite, modele: img.modele, cout_eur: cout }, reponse_a_id: msg.id, cout_eur: cout },
  });
  if (eMsg) console.error('message du visuel:', eMsg.message);
  const reste = Math.max(0, budget - depense - cout);
  return finir('faite', `Visuel prêt (${cout.toFixed(2)} €). Reste ce mois : ${reste.toFixed(2)} €.`);
}));
