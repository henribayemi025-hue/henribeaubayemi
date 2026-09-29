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
// La vidéo viendra ensuite, par le même chemin.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ajouterCout, compter, coutEnCours, gemini, pourEntreprise } from '../_shared/cout.ts';
import { Image as Dessin } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';

const MODELES_IMAGE = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];
const TIMEOUT_MS = 90_000;
// Ce qu'on compte au minimum par image (euros) : le prix publié arrondi au-dessus,
// pour que le budget ne soit jamais dépassé par un comptage trop optimiste.
const MINIMUM_PAR_IMAGE: Record<string, number> = { 'gemini-2.5-flash-image': 0.05, 'gemini-3-pro-image-preview': 0.15 };

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

  let corps: { entreprise_id?: string; message_id?: string; agent_id?: string; invite?: string };
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
  if (depense + 0.15 > budget) return finir('echec', `Budget des visuels du mois atteint (${depense.toFixed(2)} € sur ${budget.toFixed(2)} €). Il se renouvelle le 1er du mois.`);

  const avant = coutEnCours();
  const img = await fabriquer(apiKey, invite);
  if ('erreur' in img) return finir('echec', `Le visuel n’a pas pu être fabriqué (${img.erreur.slice(0, 160)}).`);
  const compte = coutEnCours() - avant;
  const minimum = MINIMUM_PAR_IMAGE[img.modele] ?? 0.15;
  if (compte < minimum) ajouterCout(minimum - compte);

  const petit = await leger(img.octets);
  const chemin = `visuels/${corps.entreprise_id}/${crypto.randomUUID()}.${petit ? 'jpg' : 'png'}`;
  const { error: eUp } = await service.storage.from('legion').upload(chemin, petit || img.octets, { contentType: petit ? 'image/jpeg' : 'image/png', upsert: false });
  if (eUp) return finir('echec', `Rangement impossible : ${eUp.message}`);
  const url = service.storage.from('legion').getPublicUrl(chemin).data.publicUrl;
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
