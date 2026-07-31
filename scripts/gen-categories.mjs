// Génère src/lib/categoryTree.js + les libellés i18n À PARTIR DE LA BASE.
// La table `categories` est la source de vérité (migrations 0022→0025):
// maintenir la même arborescence à la main des deux côtés produisait
// forcément une divergence. Relancer après toute migration de catégories:
//   node scripts/gen-categories.mjs categories.json
import fs from 'fs';

const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const byKind = (k) => rows.filter((r) => r.kind === k);
const heads = (k) => byKind(k).filter((r) => !r.parent_id).sort((a, b) => a.o - b.o);
const kidsOf = (id) => rows.filter((r) => r.parent_id === id).sort((a, b) => a.o - b.o).map((r) => r.id);

const childMap = {};
rows.filter((r) => !r.parent_id).forEach((h) => {
  const k = kidsOf(h.id);
  if (k.length) childMap[h.id] = k;
});

const js = `// GÉNÉRÉ AUTOMATIQUEMENT — ne pas éditer à la main.
// Source: table \`categories\` en base (migrations 0022→0025).
// Régénérer: node scripts/gen-categories.mjs categories.json
//
// Ce fichier ne contient QUE la structure (ids + parenté). Les bannières,
// icônes, règles de devis et champs par catégorie vivent dans categories.js,
// qui importe ceci.

export const PRODUCT_HEADS = ${JSON.stringify(heads('PRODUCT').map((r) => r.id), null, 2)};

export const SERVICE_HEADS = ${JSON.stringify(heads('SERVICE').map((r) => r.id), null, 2)};

export const CATEGORY_CHILDREN = ${JSON.stringify(childMap, null, 2)};
`;
fs.writeFileSync('src/lib/categoryTree.js', js);

for (const [file, key] of [['src/locales/fr/translation.json', 'fr'], ['src/locales/en/translation.json', 'en']]) {
  const t = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const r of rows) t.categories[r.id] = r[key];
  fs.writeFileSync(file, JSON.stringify(t, null, 2) + '\n');
}

console.log(`généré: ${heads('PRODUCT').length} rayons, ${heads('SERVICE').length} métiers, ${rows.length} catégories au total`);
