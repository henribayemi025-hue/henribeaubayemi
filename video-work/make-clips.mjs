// Générateur de micro-clips « 15 secondes, une fonction » (TikTok / statut
// WhatsApp / Reels). Un seul gabarit paramétré: ajouter un clip = ajouter une
// entrée dans CLIPS, pas un fichier HTML de plus.
//
// Contrainte propre au format court: le texte doit se lire en UNE seconde,
// pas en trois. D'où des titres très gros (2 lignes max), une seule phrase de
// légende, et le téléphone qui monte à l'écran dès la première seconde — on
// n'a pas le temps d'une intro comme dans les vidéos longues.
//
// Usage:  node make-clips.mjs            -> écrit les .html de tous les clips
//         node make-clips.mjs finia      -> un seul clip
import { writeFileSync } from 'fs';

const DIR = '/home/user/henribeaubayemi/video-work';

// `shots`: 1 ou 2 captures. Avec 2, la seconde arrive en transition « push »
// à mi-clip — c'est ce qui montre le AVANT → APRÈS d'une fonction.
const CLIPS = [
  {
    id: 'finia-vendeuse',
    accent: 'brass',
    tag: '✨ FINIA',
    title: 'Elle écrit tes<br>fiches produit',
    say: 'Tu envoies la photo. <b>Finia</b> écrit le nom, le rayon et le prix.',
    shots: ['bulk-finia-progress', 'bulk-filled'],
  },
  {
    id: 'masse',
    accent: 'terra',
    tag: 'GAIN DE TEMPS',
    title: '70 photos.<br>70 articles.',
    say: 'Choisis toutes tes photos <b>d\'un coup</b>. Une photo = un article.',
    shots: ['bulk-photos', 'drafts-publish'],
  },
  {
    id: 'prix-sur-demande',
    accent: 'terra',
    tag: 'NOUVEAU',
    title: 'Pas encore<br>fixé ton prix ?',
    say: 'Coche <b>« Prix sur demande »</b>. La cliente t\'écrit pour le connaître.',
    shots: ['bulk-onrequest', 'buyer-quote'],
  },
  {
    id: 'finia-acheteuse',
    accent: 'brass',
    tag: '✨ FINIA',
    title: 'Dis-lui ce que<br>tu cherches',
    say: '« Une robe wax pour un mariage » — elle cherche dans <b>toutes</b> les boutiques.',
    shots: ['buyer-finia-open', 'buyer-finia-reply'],
  },
  {
    id: 'paiement',
    accent: 'ok',
    tag: 'ZÉRO RISQUE',
    title: 'Tu ne paies<br>rien en ligne',
    say: 'Paiement <b>à la livraison</b> ou au retrait. Aucune carte demandée.',
    shots: ['buyer-checkout'],
  },
  {
    id: 'fin',
    accent: 'terra',
    tag: 'ONGLET FIN',
    title: 'Shoppe<br>en vidéo',
    say: 'Les vendeuses filment leurs articles. Tu vois, tu aimes, <b>tu achètes</b>.',
    shots: ['buyer-fin'],
    dark: true,
  },
  {
    id: 'services',
    accent: 'brass',
    tag: 'ONGLET SERVICES',
    title: 'Des pros<br>à domicile',
    say: 'Coiffure, ménage, plomberie, BTP — <b>près de chez toi</b>.',
    shots: ['buyer-services'],
  },
];

const ACCENTS = { terra: '#C25E38', brass: '#E09F3E', ok: '#2A9D8F' };

// La barre de statut iOS, identique partout (voir compose-v2.html).
const SBC = `<div class="sbc"><span>9:41</span><svg width="128" height="26" viewBox="0 0 128 26" fill="#101014"><rect x="0" y="14" width="5" height="8" rx="1.5"/><rect x="8" y="10" width="5" height="12" rx="1.5"/><rect x="16" y="6" width="5" height="16" rx="1.5"/><rect x="24" y="2" width="5" height="20" rx="1.5"/><path d="M48 10.5a14 14 0 0 1 18 0l-2.6 3a10 10 0 0 0-12.8 0z"/><path d="M52.4 15.5a8 8 0 0 1 9.2 0L57 21z"/><rect x="78" y="4" width="38" height="18" rx="5" fill="none" stroke="#101014" stroke-width="2.4" opacity=".5"/><rect x="81" y="7" width="26" height="12" rx="2.6"/><path d="M119 9v8a5 5 0 0 0 0-8z" opacity=".5"/></svg></div>`;

function html(clip) {
  const accent = ACCENTS[clip.accent] || ACCENTS.terra;
  const sb = clip.dark ? '#000000' : '#ffffff';
  const two = clip.shots.length > 1;
  const screens = clip.shots
    .map((s, i) =>
      `<div class="shot${i ? ' push shot-b' : ''}" style="--sb:${sb}"><img src="shots/${s}.png"></div>`)
    .join('\n        ');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  /* Clip « ${clip.id} » — 1080x1920, 15 s. Généré par make-clips.mjs:
     ne pas éditer à la main, modifier l'entrée dans CLIPS. */
  :root { --creme:#FAF7F2; --ink:#171B26; --accent:${accent}; --muted:#6B6B6B; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1080px; height:1920px; overflow:hidden; }
  body { background:var(--creme); font-family:-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; color:var(--ink); }

  .blob { position:absolute; border-radius:50%; filter:blur(90px); }
  .blob1 { width:700px; height:700px; background:${accent}22; top:-180px; left:-220px; animation:drift 15s linear 0s both; }
  .blob2 { width:640px; height:640px; background:${accent}18; bottom:-160px; right:-200px; animation:drift2 15s linear 0s both; }
  @keyframes drift { from { transform:translate(0,0) } to { transform:translate(60px,40px) } }
  @keyframes drift2 { from { transform:translate(0,0) } to { transform:translate(-55px,-45px) } }

  .progress { position:absolute; left:0; bottom:0; height:12px; width:1080px; background:rgba(23,27,38,.08); z-index:50; }
  .progress > div { height:100%; width:1080px; background:var(--accent); transform-origin:left; animation:prog 15s linear 0s both; }
  @keyframes prog { from { transform:scaleX(0) } to { transform:scaleX(1) } }

  /* Format court: tout est plus gros que dans les vidéos longues — ça se
     regarde à bout de bras, souvent sans le son. */
  .tag { position:absolute; top:96px; left:50%; transform:translateX(-50%); background:var(--accent); color:#fff;
         font-weight:800; font-size:38px; letter-spacing:.12em; padding:16px 44px; border-radius:999px;
         animation:popC .5s cubic-bezier(.2,1.4,.4,1) .1s both; }
  h1 { position:absolute; top:210px; left:0; width:1080px; text-align:center; padding:0 60px;
       font-size:92px; line-height:1.08; font-weight:800; animation:rise .6s ease .3s both; }
  .say { position:absolute; bottom:56px; left:50px; width:980px; text-align:center;
         background:rgba(255,255,255,.94); border:2px solid ${accent}44;
         border-radius:30px; padding:32px 46px; font-size:46px; line-height:1.3;
         font-weight:700; box-shadow:0 18px 44px rgba(23,27,38,.10);
         animation:rise .6s ease .9s both; }
  .say b { color:var(--accent); }

  .phone { position:absolute; left:50%; top:470px; width:520px; height:1094px; margin-left:-260px;
           background:#15151a; border-radius:58px; box-shadow:0 46px 100px rgba(23,27,38,.34); padding:13px;
           animation:phoneUp .8s cubic-bezier(.2,1,.3,1) .5s both; }
  .sbtn { position:absolute; background:#2c2c33; border-radius:3px; }
  .sbtn.volu { left:-4px; top:320px; width:6px; height:92px; }
  .sbtn.vold { left:-4px; top:430px; width:6px; height:92px; }
  .sbtn.pwr  { right:-4px; top:340px; width:6px; height:146px; }
  .screen { position:relative; width:494px; height:1068px; border-radius:46px; overflow:hidden; background:#fff; }
  .screen::after { content:''; position:absolute; inset:0; z-index:30; pointer-events:none;
    background:linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.035) 28%, transparent 44%); }
  .notch { position:absolute; top:33px; left:50%; width:146px; height:35px; margin-left:-73px; background:#15151a; border-radius:999px; z-index:26; }
  .shot { position:absolute; inset:0; background:var(--sb,#fff); }
  .shot img { position:absolute; top:59px; left:0; width:494px; height:1009px; }
  .sbc { position:absolute; top:0; left:0; right:0; height:59px; z-index:25; display:flex; align-items:center;
         justify-content:space-between; padding:6px 40px 0 52px; font-size:27px; font-weight:700; color:#101014; }
  .homebar { position:absolute; bottom:12px; left:50%; width:172px; margin-left:-86px; height:7px; border-radius:4px; background:rgba(16,16,20,.32); z-index:25; }
  .push { transform:translateX(514px); box-shadow:-24px 0 48px rgba(0,0,0,.22); }
  ${two ? '.shot-b { animation:pushIn .6s cubic-bezier(.3,.9,.3,1) 7.4s both; }' : ''}

  @keyframes rise { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
  @keyframes popC { from { opacity:0; transform:translateX(-50%) scale(.6) } to { opacity:1; transform:translateX(-50%) scale(1) } }
  @keyframes phoneUp { from { opacity:0; transform:translateY(150px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pushIn { from { transform:translateX(514px) } to { transform:translateX(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  /* Carte de fin: elle recouvre tout sur les 2 dernières secondes. */
  .end { position:absolute; inset:0; background:var(--creme); opacity:0; z-index:60;
         animation:fadeIn .45s ease 13.1s both; }
  .end .logo { position:absolute; top:640px; left:50%; width:250px; height:250px; margin-left:-125px; }
  .end .logo img { width:100%; height:100%; }
  .end .word { position:absolute; top:930px; width:1080px; text-align:center; font-size:104px; font-weight:800; color:#C25E38; }
  .end .cta  { position:absolute; top:1120px; width:1080px; text-align:center; font-size:56px; font-weight:800; color:var(--ink); }
  .end .sub  { position:absolute; top:1230px; width:1080px; text-align:center; font-size:38px; font-weight:600; color:var(--muted); }
</style>
</head>
<body>
  <div class="blob blob1"></div>
  <div class="blob blob2"></div>

  <div class="tag">${clip.tag}</div>
  <h1>${clip.title}</h1>

  <div class="phone">
    <span class="sbtn volu"></span><span class="sbtn vold"></span><span class="sbtn pwr"></span>
    <div class="screen">
        ${screens}
      ${SBC}
      <span class="homebar"></span>
    </div>
    <div class="notch"></div>
  </div>

  <div class="say">${clip.say}</div>

  <div class="end">
    <div class="logo"><img src="logo.svg" alt=""></div>
    <div class="word">Finjaro</div>
    <div class="cta">finjaro.net</div>
    <div class="sub">Gratuit · Cameroun &amp; diaspora</div>
  </div>

  <div class="progress"><div></div></div>
</body>
</html>
`;
}

const only = process.argv[2];
const todo = only ? CLIPS.filter((c) => c.id.includes(only)) : CLIPS;
if (!todo.length) {
  console.error('Aucun clip ne correspond à:', only);
  process.exit(1);
}
for (const clip of todo) {
  const path = `${DIR}/clip-${clip.id}.html`;
  writeFileSync(path, html(clip));
  console.log('écrit', path);
}
console.log(`\n${todo.length} clip(s). Rendu:`);
for (const clip of todo) {
  console.log(`  node render.mjs ${DIR}/clip-${clip.id}.html 15 ${DIR}/clip-${clip.id}.mp4`);
}
