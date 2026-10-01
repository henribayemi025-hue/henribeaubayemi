// Fichiers des entreprises de Léo : dossier PRIVÉ « legion-prive » (audit du
// 01/10, C-2). Documents, vocaux, photos et pièces jointes des salons, et
// tout ce que les agents produisent pour l'entreprise (tableurs, fiches,
// visuels).
//
// Avant : dossier « legion » public. Toute personne qui obtenait le lien
// lisait le fichier, sans compte et pour toujours. Le dossier « legion »
// reste public pour les seuls portraits des agents, faits pour être vus.
//
// En base, un fichier privé garde une adresse de la forme
//   <SUPABASE_URL>/storage/v1/object/authenticated/legion-prive/<chemin>
// qui ne s'ouvre pas sans droits : le site la change en lien signé d'une
// heure pour un membre de l'entreprise (src/lib/fichierPrive.js), et les
// fonctions la lisent ici avec la clé de service.
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const DOSSIER_PRIVE = 'legion-prive';

const MOTIF = /\/storage\/v1\/object\/(?:public|authenticated|sign)\/legion-prive\/([^?#]+)/;

// Chemin dans le dossier privé, ou null si l'adresse n'en vient pas.
export function cheminPrive(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const m = url.match(MOTIF);
  return m ? decodeURIComponent(m[1]) : null;
}

export function urlPrive(chemin: string): string {
  return `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/authenticated/${DOSSIER_PRIVE}/${chemin}`;
}

let service: ReturnType<typeof createClient> | null = null;
function client() {
  service ??= createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  return service;
}

// Comme fetch(url) : un fichier privé est lu avec la clé de service, toute
// autre adresse est demandée normalement. Rend toujours une Response, pour
// que les appelants (r.ok, r.arrayBuffer(), en-tête content-type) ne
// changent pas.
export async function ouvrirFichier(url: string, delaiMs = 20_000): Promise<Response> {
  const chemin = cheminPrive(url);
  if (!chemin) return fetch(url, { signal: AbortSignal.timeout(delaiMs) });
  const { data, error } = await client().storage.from(DOSSIER_PRIVE).download(chemin);
  if (error || !data) return new Response(null, { status: 404 });
  return new Response(data, { status: 200, headers: { 'content-type': data.type || 'application/octet-stream' } });
}

// Dépose un fichier produit pour une entreprise et rend son adresse privée.
export async function deposerPrive(chemin: string, contenu: Blob | Uint8Array | ArrayBuffer, contentType: string): Promise<{ url: string | null; erreur?: string }> {
  const { error } = await client().storage.from(DOSSIER_PRIVE).upload(chemin, contenu, { contentType, upsert: false });
  if (error) return { url: null, erreur: error.message };
  return { url: urlPrive(chemin) };
}
