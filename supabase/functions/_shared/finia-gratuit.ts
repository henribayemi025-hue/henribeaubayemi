// Ce que finia-gratuit laisse passer vers l'IA gratuite (voir
// supabase/functions/finia-gratuit). Texte seulement, petit : la part
// « finia » est de 2 000 neurones par jour pour toutes les commerçantes.

export const APPELS_PAR_PERSONNE = 10;   // par jour (UTC)
export const SORTIE_FINIA = 1024;        // jetons de réponse au plus
export const ENTREE_FINIA = 12_000;      // signes de conversation au plus
const MESSAGES_MAX = 30;
const ROLES = new Set(['system', 'user', 'assistant']);

type Message = { role: string; content: string };

// Rend le corps à envoyer, ou { erreur } si la demande n'est pas recevable.
// Les messages les plus anciens tombent d'abord quand la conversation est
// trop longue ; le message « system » (la consigne de Finia) est gardé.
export function corpsFinia(b: unknown): { corps: { messages: Message[]; max_tokens: number; temperature?: number } } | { erreur: string } {
  const brut = (b && typeof b === 'object' ? (b as Record<string, unknown>).messages : null);
  if (!Array.isArray(brut) || brut.length === 0) return { erreur: 'messages manquants' };
  const messages: Message[] = [];
  for (const m of brut) {
    const role = String((m as Record<string, unknown>)?.role ?? '');
    const content = (m as Record<string, unknown>)?.content;
    if (!ROLES.has(role)) return { erreur: `rôle refusé : ${role || '(vide)'}` };
    if (typeof content !== 'string') return { erreur: 'texte seulement (content doit être une chaîne)' };
    messages.push({ role, content });
  }
  const consignes = messages.filter((m) => m.role === 'system');
  let suite = messages.filter((m) => m.role !== 'system').slice(-MESSAGES_MAX);
  const taille = (l: Message[]) => l.reduce((n, m) => n + m.content.length, 0);
  const tailleConsignes = taille(consignes);
  if (tailleConsignes > ENTREE_FINIA / 2) return { erreur: 'consigne trop longue' };
  while (suite.length > 1 && tailleConsignes + taille(suite) > ENTREE_FINIA) suite = suite.slice(1);
  if (suite.length === 0) return { erreur: 'aucun message de la personne' };
  if (tailleConsignes + taille(suite) > ENTREE_FINIA) {
    const dernier = suite[suite.length - 1];
    suite = [{ ...dernier, content: dernier.content.slice(-(ENTREE_FINIA - tailleConsignes)) }];
  }
  const demande = Number((b as Record<string, unknown>).max_tokens);
  const max_tokens = Number.isFinite(demande) && demande > 0 ? Math.min(SORTIE_FINIA, Math.floor(demande)) : SORTIE_FINIA;
  const t = Number((b as Record<string, unknown>).temperature);
  return { corps: { messages: [...consignes, ...suite], max_tokens, ...(Number.isFinite(t) ? { temperature: Math.max(0, Math.min(1.5, t)) } : {}) } };
}
