// LINEAR ET JIRA (0188, idée 47 des 200, 24/09) : comme GitHub, en lecture
// seule — les tickets ouverts de l'équipe, pour que les agents parlent du
// vrai travail en cours. Le jeton sort du coffre au moment de lire.
// deno-lint-ignore no-explicit-any
type Service = any;

export const PARLE_DE_TICKETS = /ticket|linear|jira|sprint|backlog|bug|t[aâ]che technique|priorit|roadmap produit|fonctionnalit/i;

async function linear(service: Service, entrepriseId: string, config: Record<string, unknown>): Promise<string> {
  const { data: cle } = await service.rpc('legion_jeton_outil', { p_entreprise: entrepriseId, p_type: 'linear' });
  if (!cle) return '';
  const equipe = typeof config.equipe === 'string' && config.equipe ? config.equipe : null;
  const filtre = `{ state: { type: { nin: ["completed", "canceled"] } }${equipe ? `, team: { key: { eq: "${equipe.replace(/[^A-Z0-9_-]/g, '')}" } }` : ''} }`;
  const r = await fetch('https://api.linear.app/graphql', {
    method: 'POST', headers: { Authorization: String(cle), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `{ issues(first: 12, orderBy: updatedAt, filter: ${filtre}) { nodes { identifier title priorityLabel state { name } assignee { name } } } }` }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`Linear ${r.status}`);
  const j = await r.json();
  const n = (j?.data?.issues?.nodes || []) as Array<{ identifier: string; title: string; priorityLabel?: string; state?: { name?: string }; assignee?: { name?: string } | null }>;
  return `\nLES TICKETS LINEAR DE L'ÉQUIPE (ouverts, lus à l'instant, lecture seule):\n${n.map((x) => `- ${x.identifier} ${String(x.title).slice(0, 140)} (${x.state?.name || '?'}${x.priorityLabel ? `, ${x.priorityLabel}` : ''}${x.assignee?.name ? `, ${x.assignee.name}` : ''})`).join('\n') || '(aucun)'}\n`;
}

// Jira Cloud ou Server : /rest/api/2/search répond sur les deux. Sans jeton,
// on lit ce que le site montre à tout le monde (un projet public).
export async function jira(site: string, email: string | null, jeton: string | null, projet: string | null): Promise<Array<{ cle: string; titre: string; statut: string }>> {
  const jql = `${projet ? `project = "${projet.replace(/[^A-Z0-9_-]/g, '')}" AND ` : ''}statusCategory != Done ORDER BY updated DESC`;
  const h: Record<string, string> = { Accept: 'application/json' };
  if (jeton) h.Authorization = email ? `Basic ${btoa(`${email}:${jeton}`)}` : `Bearer ${jeton}`;
  const r = await fetch(`${site}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=12&fields=summary,status`, { headers: h, signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(`Jira ${r.status}`);
  const j = await r.json();
  return ((j?.issues || []) as Array<{ key: string; fields: { summary: string; status?: { name?: string } } }>).map((x) => ({ cle: x.key, titre: String(x.fields?.summary || '').slice(0, 140), statut: x.fields?.status?.name || '?' }));
}

export async function lireTickets(service: Service, entrepriseId: string): Promise<string> {
  try {
    const { data } = await service.from('legion_connecteurs').select('type, config').eq('entreprise_id', entrepriseId).eq('actif', true).in('type', ['linear', 'jira']);
    let bloc = '';
    for (const c of (data || []) as Array<{ type: string; config: Record<string, unknown> }>) {
      try {
        if (c.type === 'linear') bloc += await linear(service, entrepriseId, c.config || {});
        if (c.type === 'jira' && typeof c.config?.site === 'string') {
          const { data: jeton } = await service.rpc('legion_jeton_outil', { p_entreprise: entrepriseId, p_type: 'jira' });
          const l = await jira(String(c.config.site), (c.config.email as string) || null, jeton || null, (c.config.projet as string) || null);
          bloc += `\nLES TICKETS JIRA DE L'ÉQUIPE (ouverts, lus à l'instant, lecture seule):\n${l.map((x) => `- ${x.cle} ${x.titre} (${x.statut})`).join('\n') || '(aucun)'}\n`;
        }
      } catch (e) { console.error(`${c.type}:`, (e as Error).message); }
    }
    return bloc;
  } catch (e) {
    console.error('tickets:', (e as Error).message);
    return '';
  }
}
