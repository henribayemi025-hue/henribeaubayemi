// Le connecteur GitHub (0169): ce que les agents lisent du dépôt de LEUR
// entreprise — les derniers changements et les tickets ouverts. Lecture
// seule. Le jeton sort du coffre (vault) au moment de lire, jamais avant.
// deno-lint-ignore no-explicit-any
type Service = any;

export const PARLE_DE_CODE = /github|code|bug|commit|dépôt|depot|version|déploi|deploi|mise en ligne|ticket|issue|fonctionnalit|développ|develop|application|appli\b|site/i;

export async function lireGithub(service: Service, entrepriseId: string): Promise<string> {
  try {
    const { data: c } = await service.from('legion_connecteurs').select('config').eq('entreprise_id', entrepriseId).eq('type', 'github').eq('actif', true).maybeSingle();
    const depot = String(c?.config?.depot || '');
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(depot)) return '';
    const { data: jeton } = await service.rpc('legion_jeton_github', { p_entreprise: entrepriseId });
    const h: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'Legion-Finjaro' };
    if (jeton) h.Authorization = `Bearer ${jeton}`;
    const lire = async (chemin: string) => {
      const r = await fetch(`https://api.github.com/repos/${depot}/${chemin}`, { headers: h, signal: AbortSignal.timeout(10_000) });
      if (!r.ok) throw new Error(`GitHub ${r.status}`);
      return await r.json();
    };
    const [commits, tickets] = await Promise.all([lire('commits?per_page=8'), lire('issues?state=open&per_page=10')]);
    const c8 = (commits || []).map((x: { commit: { message: string; author?: { date?: string } } }) =>
      `- ${String(x.commit?.author?.date || '').slice(0, 10)} ${String(x.commit?.message || '').split('\n')[0].slice(0, 140)}`);
    const t10 = (tickets || []).filter((x: { pull_request?: unknown }) => !x.pull_request)
      .map((x: { number: number; title: string }) => `- #${x.number} ${String(x.title).slice(0, 140)}`);
    return `\nLE DÉPÔT GITHUB DE L'ENTREPRISE (${depot}, lu à l'instant, lecture seule):\nDerniers changements:\n${c8.join('\n') || '(aucun)'}\nTickets ouverts:\n${t10.join('\n') || '(aucun)'}\n`;
  } catch (e) {
    console.error('github:', (e as Error).message);
    return '';
  }
}
