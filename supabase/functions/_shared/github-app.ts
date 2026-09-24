// L'APPLICATION GITHUB « Finjaro Atelier » (créée par Beau le 24/09, App ID
// 5066102 — ce numéro n'est pas secret). Sa clé privée vit seulement dans les
// secrets Supabase (GITHUB_APP_PRIVATE_KEY) ; ce fichier fabrique le jeton
// d'application (JWT RS256, 9 minutes), puis les jetons d'installation d'une
// heure, limités aux dépôts que la personne a choisis. Aucune clé n'est
// jamais renvoyée ni écrite dans un journal.

export const GITHUB_APP_ID = Deno.env.get('GITHUB_APP_ID') || '5066102';

// Le nom du secret peut varier (Beau pose parfois sous un autre nom) : on
// prend GITHUB_APP_PRIVATE_KEY, sinon le premier secret qui A LA FORME d'une
// clé privée PEM.
export function clePriveeGithub(): { nom: string; pem: string } | null {
  const direct = Deno.env.get('GITHUB_APP_PRIVATE_KEY');
  // Collée sans ses lignes « -----BEGIN… » et « -----END… » (c'est ce que
  // Beau a fait le 24/09 : l'empreinte montrée par Supabase correspond au
  // corps seul du fichier .pem) : on la lit quand même.
  if (direct && (/PRIVATE KEY/.test(direct) || /^\s*MII[A-Za-z0-9+/=\s]+$/.test(direct))) return { nom: 'GITHUB_APP_PRIVATE_KEY', pem: direct };
  for (const [nom, v] of Object.entries(Deno.env.toObject())) if (/-----BEGIN (RSA )?PRIVATE KEY-----/.test(v)) return { nom, pem: v };
  return null;
}

const b64url = (b: Uint8Array | string) => {
  const octets = typeof b === 'string' ? new TextEncoder().encode(b) : b;
  let s = '';
  for (const x of octets) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Longueur DER.
const longueur = (n: number) => (n < 0x80 ? [n] : n < 0x100 ? [0x81, n] : n < 0x10000 ? [0x82, n >> 8, n & 0xff] : [0x83, n >> 16, (n >> 8) & 0xff, n & 0xff]);

// GitHub donne une clé PKCS#1 (« BEGIN RSA PRIVATE KEY ») ; WebCrypto veut du
// PKCS#8 : on l'enveloppe (version 0, algorithme rsaEncryption, clé).
function pkcs8Depuis(pem: string): Uint8Array {
  // Collée dans un formulaire, la clé perd parfois ses retours à la ligne.
  const corps = pem.replace(/-----(BEGIN|END)[^-]+-----/g, '').replace(/\\n/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(corps), (c) => c.charCodeAt(0));
  // PKCS#1 ou PKCS#8 ? On le lit dans la structure, pas dans l'en-tête (qui
  // peut manquer) : SEQUENCE, version 0, puis un entier (PKCS#1) ou une
  // SEQUENCE d'algorithme (PKCS#8).
  let i = 1;
  i += der[i] & 0x80 ? 1 + (der[i] & 0x7f) : 1;
  const pkcs1 = der[0] === 0x30 && der[i] === 0x02 && der[i + 1] === 0x01 && der[i + 2] === 0x00 && der[i + 3] === 0x02;
  if (!pkcs1) return der;
  const algo = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const octet = [0x04, ...longueur(der.length)];
  const contenu = [0x02, 0x01, 0x00, ...algo, ...octet];
  const total = contenu.length + der.length;
  const out = new Uint8Array([0x30, ...longueur(total), ...contenu, ...der]);
  return out;
}

export async function jetonApplication(pem: string, appId = GITHUB_APP_ID): Promise<string> {
  const cle = await crypto.subtle.importKey('pkcs8', pkcs8Depuis(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const maintenant = Math.floor(Date.now() / 1000);
  const tete = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const charge = b64url(JSON.stringify({ iat: maintenant - 60, exp: maintenant + 9 * 60, iss: appId }));
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cle, new TextEncoder().encode(`${tete}.${charge}`)));
  return `${tete}.${charge}.${b64url(sig)}`;
}

const GH = (jeton: string) => ({ Authorization: `Bearer ${jeton}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'finjaro-atelier' });

// Le contrôle complet, sans rien révéler : l'application existe-t-elle, où
// est-elle installée, sur quels dépôts.
export async function verifierApplication(): Promise<Record<string, unknown>> {
  const cle = clePriveeGithub();
  if (!cle) return { ok: false, etape: 'clé', erreur: 'aucun secret ne contient de clé privée (attendu : GITHUB_APP_PRIVATE_KEY)' };
  let jwt: string;
  try { jwt = await jetonApplication(cle.pem); } catch (e) { return { ok: false, etape: 'lecture de la clé', secret: cle.nom, erreur: (e as Error).message }; }
  const app = await fetch('https://api.github.com/app', { headers: GH(jwt) });
  if (!app.ok) return { ok: false, etape: 'GitHub refuse la clé', secret: cle.nom, app_id: GITHUB_APP_ID, http: app.status, detail: (await app.text()).slice(0, 200) };
  const a = await app.json();
  const inst = await fetch('https://api.github.com/app/installations', { headers: GH(jwt) });
  const installations = inst.ok ? await inst.json() : [];
  const detail = [];
  for (const i of (installations as Array<{ id: number; account?: { login?: string }; repository_selection?: string }>).slice(0, 5)) {
    let depots: string[] | string = '?';
    const t = await fetch(`https://api.github.com/app/installations/${i.id}/access_tokens`, { method: 'POST', headers: GH(jwt) });
    if (t.ok) {
      const { token } = await t.json();
      const r = await fetch('https://api.github.com/installation/repositories?per_page=30', { headers: GH(token) });
      depots = r.ok ? ((await r.json()).repositories || []).map((x: { full_name: string }) => x.full_name) : `HTTP ${r.status}`;
    }
    detail.push({ compte: i.account?.login, choix: i.repository_selection, depots });
  }
  return { ok: true, secret: cle.nom, app_id: GITHUB_APP_ID, nom: a.name, slug: a.slug, permissions: a.permissions, installations: detail };
}
