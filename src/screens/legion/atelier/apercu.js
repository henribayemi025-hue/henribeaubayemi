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

// Le cadre isolé n'a pas le droit au stockage du navigateur : une page qui
// enregistre sa progression (localStorage) plantait et l'aperçu restait vide
// (Finjaro Learn d'Ada, 25/09). On lui prête un stockage en mémoire, le temps
// de l'aperçu.
const STOCKAGE_PRETE = `<script>(function(){function faux(){var m={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}}}['localStorage','sessionStorage'].forEach(function(n){try{window[n].getItem('x')}catch(e){try{Object.defineProperty(window,n,{value:faux(),configurable:true})}catch(e2){}}})})();</script>`;

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
  // Le stockage prêté, avant tout script de la page.
  doc = /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (h) => `${h}${STOCKAGE_PRETE}`) : `${STOCKAGE_PRETE}${doc}`;
  return doc;
}
