// LE CACHE (0190, idée 127 des 200, 24/09) : ne pas repayer la même chose.
// Une recherche sur Internet sur la même question, le tri d'une même
// demande : la réponse est gardée quelques heures ou jours (legion_cache),
// puis oubliée (ménage chaque nuit). La clé est une empreinte : le texte
// lui-même n'est pas rangé comme clé.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const service = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

export async function empreinte(texte: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function avecCache<T>(fonction: string, cleTexte: string, dureeMs: number, calcul: () => Promise<T | null>): Promise<T | null> {
  let cle = '';
  try {
    cle = `${fonction}:${await empreinte(cleTexte)}`;
    const { data } = await service().from('legion_cache').select('valeur, expire_le').eq('cle', cle).maybeSingle();
    if (data && Date.parse(data.expire_le) > Date.now()) return data.valeur as T;
  } catch (e) { console.error('cache (lire):', (e as Error).message); }
  const valeur = await calcul();
  if (valeur != null && cle) {
    try {
      await service().from('legion_cache').upsert({ cle, fonction, valeur, expire_le: new Date(Date.now() + dureeMs).toISOString() });
    } catch (e) { console.error('cache (écrire):', (e as Error).message); }
  }
  return valeur;
}
