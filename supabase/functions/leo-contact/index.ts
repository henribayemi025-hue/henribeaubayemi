// LÉO — « Passer à Premium », « Nous contacter », « Une suggestion »
// (Beau, 29/09 : « dès que quelqu'un clique sur premium je suis au courant » ;
// « un moyen de nous contacter » ; « que les gens ajoutent des suggestions »).
//
// La demande est écrite dans legion_demandes (avec les droits de la personne :
// elle ne peut écrire que pour une entreprise dont elle est membre), puis
// l'équipe reçoit un e-mail : qui, quelle entreprise, ce qu'elle a dépensé ce
// mois, son message. « Répondre » dans la boîte mail répond directement à la
// personne. Toutes les entreprises de Léo.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PROD_HOST = 'finjaro.net';
// La boîte de l'équipe, déjà relevée (voir send-push).
const SUPPORT_EMAIL = 'fin.finjaro@gmail.com';
const GENRES: Record<string, string> = { premium: 'veut passer à Premium', contact: 'vous écrit', suggestion: 'propose une idée' };

function origineAutorisee(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).hostname; } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  return host.endsWith('.workers.dev') || host.endsWith('.pages.dev');
}
const cors = (origin: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': origineAutorisee(origin) ? origin! : `https://${PROD_HOST}`,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});
const echapper = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors(origin), 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json({ erreur: 'Méthode non permise.' }, 405);

  const auth = req.headers.get('Authorization') || '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const utilisateur = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: { user } } = await utilisateur.auth.getUser();
  if (!user) return json({ erreur: 'Connecte-toi d’abord.' }, 401);

  let corps: { genre?: string; message?: string; entreprise_id?: string | null };
  try { corps = await req.json(); } catch { return json({ erreur: 'Requête illisible.' }, 400); }
  const genre = String(corps.genre || '');
  if (!GENRES[genre]) return json({ erreur: 'Demande inconnue.' }, 400);
  const message = String(corps.message || '').trim().slice(0, 4000);
  if (genre !== 'premium' && message.length < 3) return json({ erreur: 'Écris quelques mots.' }, 400);
  const entrepriseId = corps.entreprise_id || null;

  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  // Pas plus de 6 demandes par heure et par personne.
  const { count } = await service.from('legion_demandes').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= 6) return json({ erreur: 'Tu nous as déjà écrit plusieurs fois cette heure-ci : on revient vers toi.' }, 429);

  // Écrit avec les droits de la personne : la base vérifie qu'elle est membre.
  const { data: demande, error } = await utilisateur.from('legion_demandes')
    .insert({ user_id: user.id, entreprise_id: entrepriseId, genre, message: message || null }).select('id, created_at').single();
  if (error || !demande) return json({ erreur: 'Impossible d’enregistrer la demande.' }, 400);

  // Le contexte pour l'équipe.
  const debut = new Date(); debut.setUTCDate(1); debut.setUTCHours(0, 0, 0, 0);
  const [{ data: profil }, { data: e }, { data: usage }, { data: admins }] = await Promise.all([
    service.from('profiles').select('name, country, created_at').eq('id', user.id).maybeSingle(),
    entrepriseId ? service.from('legion_entreprises').select('nom, projet, premium, credit_offert_eur').eq('id', entrepriseId).maybeSingle() : Promise.resolve({ data: null }),
    entrepriseId ? service.from('ai_usage').select('cost_eur').eq('entreprise_id', entrepriseId).gte('created_at', debut.toISOString()) : Promise.resolve({ data: [] }),
    service.from('profiles').select('id').eq('is_admin', true),
  ]);
  const depense = ((usage || []) as Array<{ cost_eur: number }>).reduce((t, l) => t + Number(l.cost_eur), 0);
  const destinataires = new Set<string>([SUPPORT_EMAIL]);
  for (const a of (admins || []) as Array<{ id: string }>) {
    const { data } = await service.auth.admin.getUserById(a.id);
    if (data?.user?.email) destinataires.add(data.user.email);
  }

  const nom = String(profil?.name || user.email || 'Quelqu’un');
  const sujet = `Léo — ${nom} ${GENRES[genre]}${e?.nom ? ` (${e.nom})` : ''}`;
  const lignes = [
    `<p><b>${echapper(nom)}</b> ${GENRES[genre]}.</p>`,
    message ? `<blockquote style="border-left:3px solid #c8643c;margin:0;padding:8px 12px;background:#faf5ee">${echapper(message).replace(/\n/g, '<br>')}</blockquote>` : '',
    '<ul>',
    `<li>E-mail : ${echapper(user.email || '—')} (« Répondre » lui écrit directement)</li>`,
    user.phone ? `<li>Téléphone : ${echapper(user.phone)}</li>` : '',
    profil?.country ? `<li>Pays du compte : ${echapper(String(profil.country))}</li>` : '',
    profil?.created_at ? `<li>Inscrit le : ${new Date(profil.created_at).toLocaleDateString('fr-FR')}</li>` : '',
    e?.nom ? `<li>Entreprise : ${echapper(e.nom)}${e.projet ? ` — « ${echapper(String(e.projet).slice(0, 200))} »` : ''}</li>` : '',
    e ? `<li>Dépensé ce mois : ${depense.toFixed(2)} € ${e.premium ? '(Premium)' : `sur ${Number(e.credit_offert_eur ?? 2)} € offerts`}</li>` : '',
    '</ul>',
  ].filter(Boolean).join('\n');

  const { data: cfg } = await service.from('app_config').select('value').eq('key', 'resend').maybeSingle();
  const conf = (cfg?.value ?? null) as { api_key?: string; from?: string } | null;
  const cle = Deno.env.get('RESEND_API_KEY') ?? conf?.api_key;
  let envoye = false;
  if (cle) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: conf?.from ?? 'Finjaro <onboarding@resend.dev>', to: [...destinataires], reply_to: user.email ? [user.email] : [SUPPORT_EMAIL], subject: sujet, html: lignes }),
      signal: AbortSignal.timeout(15_000),
    }).catch((err) => { console.error('leo-contact e-mail:', (err as Error).message); return null; });
    envoye = !!r?.ok;
    if (r && !r.ok) console.error('leo-contact e-mail:', r.status, (await r.text()).slice(0, 300));
  }
  return json({ ok: true, envoye });
});
