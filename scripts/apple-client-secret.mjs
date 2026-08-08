// Fabrique le « client secret » que Supabase réclame pour le fournisseur Apple.
//
// Apple n'accepte pas la clé .p8 telle quelle: il faut lui présenter un jeton
// JWT signé avec cette clé (algorithme ES256). Ce jeton EXPIRE — Apple refuse
// toute durée supérieure à six mois. Le champ « Secret Key (for OAuth) » de
// Supabase doit donc être renouvelé deux fois par an, sinon le bouton
// « Continuer avec Apple » cesse de fonctionner du jour au lendemain, sans
// autre message qu'un « invalid_client » côté Apple.
//
// Usage:
//   node scripts/apple-client-secret.mjs /chemin/vers/AuthKey_YTXF8Y6SAQ.p8
//
// Le fichier .p8 n'est JAMAIS versionné (voir .gitignore): Apple ne le fournit
// qu'une seule fois, il est conservé hors du dépôt.
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Identifiants du compte développeur de Finjaro. Le Key ID doit correspondre
// au fichier .p8 passé en argument: c'est lui qui figure dans son nom.
const TEAM_ID = 'CP87XRK5CD';
const KEY_ID = 'YTXF8Y6SAQ';
// `sub` = le Services ID (identité web), pas le Bundle ID de l'application.
const SERVICES_ID = 'net.finjaro.app.signin';

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Usage: node scripts/apple-client-secret.mjs <AuthKey_XXXXXXXXXX.p8>');
  process.exit(1);
}

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const now = Math.floor(Date.now() / 1000);
// 15777000 s = six mois, le plafond toléré par Apple. On retire une journée
// pour ne pas se faire refuser le jeton à la limite près.
const exp = now + 15777000 - 86400;

const header = b64(JSON.stringify({ alg: 'ES256', kid: KEY_ID }));
const payload = b64(JSON.stringify({
  iss: TEAM_ID,
  iat: now,
  exp,
  aud: 'https://appleid.apple.com',
  sub: SERVICES_ID,
}));
const signingInput = `${header}.${payload}`;

// `ieee-p1363`: signature r||s sur 64 octets, le format attendu par JWT. Au
// format DER (le défaut de Node), Apple répond « invalid_client » sans autre
// explication — une heure perdue à chercher ailleurs.
const sig = createSign('SHA256')
  .update(signingInput)
  .sign({ key: readFileSync(keyPath, 'utf8'), dsaEncoding: 'ieee-p1363' });

console.log(`${signingInput}.${b64(sig)}`);
console.error(`\n→ à coller dans Supabase, Authentication → Sign In / Providers → Apple`);
console.error(`→ expire le ${new Date(exp * 1000).toLocaleDateString('fr-FR')} — à refaire avant cette date`);
