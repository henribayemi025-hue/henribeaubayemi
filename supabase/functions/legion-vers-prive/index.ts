// Déplace les fichiers des entreprises de Léo du dossier public « legion »
// vers le dossier privé « legion-prive » (audit du 01/10, C-2). Même chemin.
//
// Deux temps, appelés séparément depuis la base (jeton interne
// app_secrets.send_push, en-tête x-finjaro-token) :
//   { mode: 'copier',    chemins: [...] } → copie, relit, compare la taille ;
//   { mode: 'supprimer', chemins: [...] } → retire l'original public, seulement
//     si la copie privée existe avec la même taille.
// Entre les deux, les adresses sont réécrites en base (SQL, par Alpha).
// Les portraits des agents (<id>/portraits/, <id>/agents/) ne sont jamais touchés.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
const VALIDE = /^[0-9a-f-]{36}\/(?!portraits\/|agents\/)[A-Za-z0-9_./-]+$/;

Deno.serve(async (req: Request) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const presente = req.headers.get('x-finjaro-token');
  const { data: sec } = await sb.from('app_secrets').select('value').eq('name', 'send_push').maybeSingle();
  if (!presente || !sec?.value || presente !== sec.value) return json({ error: 'forbidden' }, 403);

  const { mode, chemins } = await req.json().catch(() => ({}));
  if (!['copier', 'supprimer'].includes(mode) || !Array.isArray(chemins) || !chemins.length || chemins.length > 100) return json({ error: 'demande' }, 400);

  const resultats = [];
  for (const chemin of chemins as string[]) {
    try {
      if (typeof chemin !== 'string' || !VALIDE.test(chemin) || chemin.includes('..')) throw new Error('chemin refusé');
      if (mode === 'copier') {
        const { data: blob, error: e1 } = await sb.storage.from('legion').download(chemin);
        if (e1 || !blob) throw new Error('lecture : ' + (e1?.message ?? 'vide'));
        const { error: e2 } = await sb.storage.from('legion-prive').upload(chemin, blob, { contentType: blob.type || undefined, upsert: true });
        if (e2) throw new Error('écriture : ' + e2.message);
        const { data: relu } = await sb.storage.from('legion-prive').download(chemin);
        if (!relu || relu.size !== blob.size) throw new Error('copie différente');
        resultats.push({ chemin, octets: blob.size, ok: true });
      } else {
        const [{ data: pub }, { data: priv }] = await Promise.all([
          sb.storage.from('legion').download(chemin),
          sb.storage.from('legion-prive').download(chemin),
        ]);
        if (!priv) throw new Error('pas de copie privée : original gardé');
        if (pub && pub.size !== priv.size) throw new Error('tailles différentes : original gardé');
        if (pub) {
          const { error } = await sb.storage.from('legion').remove([chemin]);
          if (error) throw new Error('suppression : ' + error.message);
        }
        resultats.push({ chemin, ok: true, supprime: !!pub });
      }
    } catch (e) {
      resultats.push({ chemin, ok: false, erreur: (e as Error).message });
    }
  }
  return json({ mode, resultats });
});
