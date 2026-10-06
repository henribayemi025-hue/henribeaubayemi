// FINIA D'ACCOUNTING SUR L'IA GRATUITE (Beau, 06/10 : « oui pour 2000
// neurones pour Finia »).
//
// L'assistante d'Accounting tourne dans le Worker de Claudinette, qui n'a ni
// clé service_role ni binding AI (et c'est mieux ainsi : une clé de moins à
// garder). Quand Gemini lui répond 402 ou 429, elle appelle ici, avec le
// jeton Supabase de la personne connectée :
//
//   POST /functions/v1/finia-gratuit
//   Authorization: Bearer <jeton de la personne>
//   { "messages": [{ "role": "system" | "user" | "assistant", "content": "…" }],
//     "max_tokens"?: n, "temperature"?: t }
//
// et reçoit une réponse au format chat/completions d'OpenAI.
//
// Trois bornes, toutes sans dépense :
// - la personne doit être connectée (compte du auth.users commun) ;
// - 10 appels par jour et par personne (ia_gratuite_personne, 0234) ;
// - la part « finia » du jour, 2 000 neurones (0232), sous le total de 8 000.
// Texte seulement, réponse de 1 024 jetons au plus (_shared/finia-gratuit.ts).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { appelGratuit } from '../_shared/gratuit.ts';
import { APPELS_PAR_PERSONNE, corpsFinia } from '../_shared/finia-gratuit.ts';

const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const erreur = (message: string, status: number) => json({ error: { message } }, status);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return erreur('POST seulement', 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const personne = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await personne.auth.getUser();
  if (!user) return erreur('connexion requise', 401);

  let b: unknown;
  try { b = await req.json(); } catch { return erreur('JSON illisible', 400); }
  const c = corpsFinia(b);
  if ('erreur' in c) return erreur(c.erreur, 400);

  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: ok, error } = await service.rpc('ia_gratuite_personne_compter', { p_user: user.id, p_app: 'finia', p_max: APPELS_PAR_PERSONNE });
  if (error) return erreur(`compteur indisponible : ${error.message}`, 503);
  if (!ok) return erreur(`limite du jour atteinte pour ce compte (${APPELS_PAR_PERSONNE} appels, remise à zéro à minuit UTC)`, 429);

  try {
    return json(await appelGratuit(c.corps, 45_000, 'finia'));
  } catch (e) {
    const message = String((e as Error)?.message || e).slice(0, 300);
    const status = Number(/^HTTP (\d{3})/.exec(message)?.[1]) || 502;
    // Parti ou pas ? Refusé avant de tourner (part épuisée, IA coupée) : la
    // personne ne perd pas son appel.
    if (status === 402) await service.rpc('ia_gratuite_personne_rendre', { p_user: user.id, p_app: 'finia' });
    return erreur(message, [402, 429].includes(status) ? status : 502);
  }
});
