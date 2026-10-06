// Les paramètres d'un outil, quand Google ne répond pas et que le moteur de
// secours (DeepSeek, Kimi…) choisit les vérifications en une fois (enquete.ts).
//
// 03/10 : les crédits Google étaient épuisés (402) ; les agents ont passé la
// nuit avec des recherches « sans requête » et des pages « refusées ». Le
// moteur de secours rendait bien ses appels, mais pas sous la forme attendue :
// une autre clé (« query », « url_page »), une valeur emballée
// ({"requete": {"value": "…"}}), ou du JSON entouré de texte. Ici, on lit tout
// cela et on ramène chaque valeur au nom que l'outil attend.

const SYNONYMES: Record<string, string[]> = {
  requete: ['query', 'q', 'recherche', 'search', 'terme', 'termes', 'texte', 'mots'],
  url: ['lien', 'adresse', 'page', 'url_page', 'site', 'link', 'href'],
  nom: ['name', 'fichier', 'chemin', 'path'],
};

function deballer(v: unknown): unknown {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    for (const k of ['value', 'valeur', 'val']) if (k in o) return o[k];
  }
  return v;
}

export function lireParametres(brut: unknown): Record<string, unknown> {
  if (brut && typeof brut === 'object' && !Array.isArray(brut)) return brut as Record<string, unknown>;
  const t = String(brut ?? '').trim();
  if (!t) return {};
  const essais = [t];
  const debut = t.indexOf('{');
  const fin = t.lastIndexOf('}');
  if (debut >= 0 && fin > debut) essais.push(t.slice(debut, fin + 1));
  for (const e of essais) {
    try {
      const x = JSON.parse(e);
      if (x && typeof x === 'object' && !Array.isArray(x)) return x as Record<string, unknown>;
    } catch { /* essai suivant */ }
  }
  return {};
}

// `attendus` : les noms de paramètres déclarés pour l'outil.
export function argsPourOutil(brut: unknown, attendus: string[]): Record<string, unknown> {
  const lus = lireParametres(brut);
  const args: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(lus)) args[k] = deballer(v);
  for (const nom of attendus) {
    if (args[nom] != null && args[nom] !== '') continue;
    const autre = (SYNONYMES[nom] || []).find((s) => args[s] != null && args[s] !== '');
    if (autre) args[nom] = args[autre];
  }
  // Un seul paramètre attendu et une seule valeur rendue sous un autre nom.
  if (attendus.length === 1 && (args[attendus[0]] == null || args[attendus[0]] === '')) {
    const valeurs = Object.values(args).filter((v) => typeof v === 'string' && v.trim());
    if (valeurs.length === 1) args[attendus[0]] = valeurs[0];
  }
  return args;
}

// L'exemple donné au moteur de secours : les vrais noms, une valeur parlante.
export function exempleParametres(proprietes: Record<string, { type?: string }>, requis: string[] = []): string {
  const ex: Record<string, unknown> = {};
  for (const [k, p] of Object.entries(proprietes)) {
    if (requis.length && !requis.includes(k)) continue;
    ex[k] = p?.type === 'INTEGER' || p?.type === 'NUMBER' ? 7 : k === 'url' ? 'https://exemple.org/page' : k === 'requete' ? 'mots précis de la recherche' : '…';
  }
  return JSON.stringify(ex);
}
