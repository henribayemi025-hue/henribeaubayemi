// Génère les icônes PNG de l'app à partir du logo vectoriel.
//
// Pourquoi c'est nécessaire: `public/favicon.svg` suffisait à l'onglet du
// navigateur, mais pas au reste. iOS ignore les SVG pour l'écran d'accueil et
// posait donc une capture de la page à la place du logo; et Play Store (via
// une Trusted Web Activity) EXIGE du PNG 192 et 512.
//
// Chromium rend le SVG et on capture — pas de dépendance d'image à installer,
// et le rendu est exactement celui d'un navigateur.
//
//   node scripts/make-icons.mjs
//
// À relancer seulement si le logo change.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(ROOT, 'public/favicon.svg'), 'utf8');

// L'icône « maskable » d'Android est rognée en cercle/carré arrondi selon le
// téléphone: le logo doit tenir dans les 80 % centraux, sinon le « F » se
// fait couper. On dessine donc le fond à bord perdu et le logo réduit.
const MASKABLE_SCALE = 0.72;

const TARGETS = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  // 180 px: la taille qu'iOS attend pour l'écran d'accueil (apple-touch-icon).
  // Fond opaque obligatoire — iOS ne gère pas la transparence et la
  // remplacerait par du noir.
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const { file, size, maskable } of TARGETS) {
  const inner = maskable ? Math.round(size * MASKABLE_SCALE) : size;
  const pad = Math.round((size - inner) / 2);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><html><body style="margin:0">
    <div style="width:${size}px;height:${size}px;background:#C25E38;display:flex;align-items:center;justify-content:center;padding:${pad}px;box-sizing:border-box">
      <div style="width:${inner}px;height:${inner}px">${svg.replace(/width="\d+"/, `width="${inner}"`).replace(/height="\d+"/, `height="${inner}"`)}</div>
    </div>
  </body></html>`);
  const buf = await page.screenshot({ omitBackground: false });
  writeFileSync(resolve(ROOT, 'public', file), buf);
  console.log('écrit  public/' + file, `(${size}×${size})`);
}

await browser.close();
