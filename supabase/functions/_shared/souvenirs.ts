// LA MÉMOIRE PROPRE À CHAQUE AGENT (0185, idée 1 des 200, 24/09).
//
// Ses livrables passés, les leçons qu'on lui a données en renvoyant un
// livrable, ce que le fondateur a aimé. Chaque souvenir a un vecteur (le même
// modèle que les documents) ; avant de répondre ou de livrer, l'agent
// retrouve les trois souvenirs les plus proches de ce qu'on lui demande —
// pour ne pas refaire une erreur déjà corrigée, et garder ce qui a plu.

import { vecteurs } from './documents.ts';

// deno-lint-ignore no-explicit-any
type Service = any;
export type Souvenir = { id: number; source: string; texte: string; created_at: string; distance: number };

// Retenir un livrable (les fonctions seulement : le vecteur est calculé ici).
export async function retenir(service: Service, apiKey: string, s: { entreprise_id: string; agent_id: string; source: 'livrable'; message_id?: string | null; texte: string }) {
  try {
    const texte = s.texte.slice(0, 4000);
    const [v] = await vecteurs(apiKey, [texte], 'RETRIEVAL_DOCUMENT');
    const { error } = await service.from('legion_souvenirs').insert({ ...s, texte, embedding: `[${v.join(',')}]` });
    if (error) console.error('souvenir:', error.message);
  } catch (e) { console.error('souvenir:', (e as Error).message); }
}

// Les leçons et encouragements écrits par l'application arrivent sans
// vecteur : on le leur donne au premier usage.
async function completer(service: Service, apiKey: string, agentId: string) {
  const { data } = await service.from('legion_souvenirs').select('id, texte').eq('agent_id', agentId).is('embedding', null).limit(10);
  if (!data?.length) return;
  const vs = await vecteurs(apiKey, data.map((x: { texte: string }) => x.texte), 'RETRIEVAL_DOCUMENT');
  await Promise.all(data.map((x: { id: number }, i: number) => service.from('legion_souvenirs').update({ embedding: `[${vs[i].join(',')}]` }).eq('id', x.id)));
}

// Le vecteur d'une demande, calculé une seule fois même si cinq agents s'en
// servent.
export function vecteurDe(apiKey: string, texte: string): () => Promise<number[]> {
  let p: Promise<number[]> | null = null;
  return () => (p ??= vecteurs(apiKey, [texte.slice(0, 4000)], 'RETRIEVAL_QUERY').then((r) => r[0]));
}

// Les souvenirs d'un agent les plus proches d'une demande. Rien s'il n'en a
// aucun (et alors aucun appel).
export async function souvenirsDe(service: Service, apiKey: string, agentId: string, demande: () => Promise<number[]>, n = 3): Promise<Souvenir[]> {
  try {
    const { count } = await service.from('legion_souvenirs').select('id', { count: 'exact', head: true }).eq('agent_id', agentId);
    if (!count) return [];
    await completer(service, apiKey, agentId);
    const v = await demande();
    const { data, error } = await service.rpc('legion_chercher_souvenirs', { p_agent: agentId, p_vecteur: `[${v.join(',')}]`, p_n: n });
    if (error) { console.error('souvenirs:', error.message); return []; }
    // Au-delà, le souvenir ne parle pas vraiment de la demande.
    return ((data || []) as Souvenir[]).filter((s) => s.distance < 0.6);
  } catch (e) {
    console.error('souvenirs:', (e as Error).message);
    return [];
  }
}

// Un agent qui avait déjà livré avant la mémoire (0185) : ses trois derniers
// livrables deviennent ses premiers souvenirs, une seule fois.
export async function rattraper(service: Service, apiKey: string, entrepriseId: string, agentId: string) {
  const { count } = await service.from('legion_souvenirs').select('id', { count: 'exact', head: true }).eq('agent_id', agentId);
  if (count) return;
  const { data } = await service.from('legion_messages').select('id, texte, meta').eq('auteur_id', agentId).not('meta->livrable', 'is', null)
    .order('created_at', { ascending: false }).limit(3);
  for (const m of (data || []) as Array<{ id: string; texte: string; meta: { livrable?: { tache?: string } } }>) {
    await retenir(service, apiKey, { entreprise_id: entrepriseId, agent_id: agentId, source: 'livrable', message_id: m.id, texte: `Tâche « ${m.meta?.livrable?.tache || '?'} » — ${String(m.texte).slice(0, 1500)}` });
  }
}

const NOM: Record<string, string> = { livrable: 'ton livrable', lecon: 'une leçon du fondateur', encouragement: 'ce que le fondateur a aimé' };

export function blocSouvenirs(s: Souvenir[]): string {
  if (!s.length) return '';
  return `\nTA MÉMOIRE — ce qui te revient de TON propre travail, lié à cette demande. Ne le recopie pas : sers-t'en (ne refais pas une erreur déjà corrigée, garde ce qui a plu, pars de ce que tu as déjà livré au lieu de le refaire).\n${s.map((x) => `- (${NOM[x.source] || x.source}, ${String(x.created_at).slice(0, 10)}) ${x.texte.slice(0, 600)}`).join('\n')}\n`;
}
