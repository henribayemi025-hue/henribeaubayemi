// Purge le cache de Supabase pour des fichiers du dossier privé « chat »
// (audit du 01/10, lot 1).
//
// Le cache garde une copie de chaque fichier déjà servi par son adresse
// publique : fermer le dossier ne la retire pas. Constaté le 01/10 : réécrire
// le même contenu à la même adresse ne la purge pas non plus (même empreinte).
// On SUPPRIME donc le fichier, ce qui purge, puis on le remet à la même
// adresse — après une copie de sauvegarde, retirée seulement une fois le
// fichier remis et relu. Aucun message n'est modifié (un garde-fou en base
// interdit d'ailleurs de changer le chemin d'un message).
//
// Appel réservé à la base (jeton interne app_secrets.send_push, en-tête
// x-finjaro-token). Corps : { chemins: string[] }.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const presente = req.headers.get('x-finjaro-token');
  const { data: sec } = await sb.from('app_secrets').select('value').eq('name', 'send_push').maybeSingle();
  if (!presente || !sec?.value || presente !== sec.value) return json({ error: 'forbidden' }, 403);

  const { chemins } = await req.json().catch(() => ({ chemins: [] }));
  if (!Array.isArray(chemins) || chemins.length === 0 || chemins.length > 50) return json({ error: 'chemins' }, 400);

  const resultats = [];
  for (const chemin of chemins as string[]) {
    try {
      if (typeof chemin !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(chemin)) throw new Error('chemin invalide');
      const { data: blob, error: e1 } = await sb.storage.from('chat').download(chemin);
      if (e1 || !blob) throw new Error('lecture : ' + (e1?.message ?? 'vide'));
      const avant = blob.size;
      const type = blob.type || undefined;
      const sauvegarde = `${chemin}.sauvegarde`;
      const { error: e2 } = await sb.storage.from('chat').upload(sauvegarde, blob, { contentType: type, upsert: true });
      if (e2) throw new Error('sauvegarde : ' + e2.message);
      const { error: e3 } = await sb.storage.from('chat').remove([chemin]);
      if (e3) throw new Error('suppression : ' + e3.message);
      const { error: e4 } = await sb.storage.from('chat').upload(chemin, blob, { contentType: type, upsert: false });
      if (e4) throw new Error('remise (la sauvegarde reste en place) : ' + e4.message);
      const { data: relu } = await sb.storage.from('chat').download(chemin);
      if (!relu || relu.size !== avant) throw new Error('relecture différente (la sauvegarde reste en place)');
      await sb.storage.from('chat').remove([sauvegarde]);
      resultats.push({ chemin, octets: avant, ok: true });
    } catch (e) {
      resultats.push({ chemin, ok: false, erreur: (e as Error).message });
    }
  }
  return json({ resultats });
});
