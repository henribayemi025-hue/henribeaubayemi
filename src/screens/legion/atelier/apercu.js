// L'APERÇU de l'atelier (Beau, 24/09 : « pourquoi il ne peut pas afficher ?
// il doit pouvoir afficher »). Pour une page web, on assemble index.html avec
// ses feuilles de style et ses scripts du projet, et on l'affiche dans un
// cadre isolé (sandbox sans « allow-same-origin » : la page ne voit ni la
// session de Léo, ni ses cookies). Pur, sans réseau, testé.

const normaliser = (chemin) => {
  const out = [];
  for (const part of chemin.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
};

// La page à montrer : index.html à la racine, sinon le premier .html trouvé.
export function pageDeDepart(chemins) {
  const html = (chemins || []).filter((c) => /\.html?$/i.test(c));
  return html.find((c) => /^index\.html?$/i.test(c)) || html.find((c) => /(^|\/)index\.html?$/i.test(c)) || html[0] || null;
}

// Les fichiers .css et .js locaux que la page appelle (pour les charger).
export function dependances(page, html) {
  const dossier = page.includes('/') ? page.replace(/[^/]+$/, '') : '';
  const local = (href) => !/^([a-z]+:)?\/\//i.test(href) && !href.startsWith('data:');
  const res = [];
  for (const m of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) if (/stylesheet/i.test(m[0]) && local(m[1])) res.push(normaliser(dossier + m[1].split(/[?#]/)[0]));
  for (const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi)) if (local(m[1])) res.push(normaliser(dossier + m[1].split(/[?#]/)[0]));
  return [...new Set(res)];
}

// La page assemblée : chaque <link> et <script src> local remplacé par son contenu.
export function assembler(page, html, contenus) {
  const dossier = page.includes('/') ? page.replace(/[^/]+$/, '') : '';
  const cle = (href) => normaliser(dossier + href.split(/[?#]/)[0]);
  let doc = html.replace(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi, (tout, href) => {
    const css = /stylesheet/i.test(tout) ? contenus[cle(href)] : undefined;
    return css === undefined ? tout : `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`;
  });
  doc = doc.replace(/<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tout, avant, src, apres) => {
    const js = contenus[cle(src)];
    return js === undefined ? tout : `<script${avant}${apres}>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  });
  return doc;
}
