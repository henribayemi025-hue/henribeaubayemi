// Les points de départ d'un nouveau projet (plan, 1.6 étape 2). Petits,
// écrits ici, sous la licence du projet : rien n'est copié d'ailleurs.

const IGNORER = 'node_modules/\n.venv/\n__pycache__/\ndist/\nbuild/\n.env\n';

export const DEPARTS = {
  vide: {
    'README.md': '# Mon projet\n\nDécris ici ce que fait ton projet.\n',
    '.gitignore': IGNORER,
  },
  // 25/09 : la base d'un vrai site, pas un exercice (Beau trouvait
  // « pitoyable » ce qui en sortait). Couleurs en variables, deux polices,
  // une échelle, des cartes cohérentes, du focus visible, 390 px d'abord.
  page_web: {
    'index.html': `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mon projet</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Figtree:wght@400;500;600&display=swap" />
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <header class="entete">
      <a class="marque" href="#">Mon projet</a>
      <nav aria-label="Principal">
        <a href="#offre">L'offre</a>
        <a href="#contact" class="bouton bouton--petit">Nous écrire</a>
      </nav>
    </header>

    <main>
      <section class="accroche">
        <p class="surtitre">Ce que nous faisons</p>
        <h1>Une phrase qui dit, en clair, ce que tu apportes.</h1>
        <p class="chapeau">Deux lignes pour dire à qui c'est destiné et pourquoi c'est mieux ailleurs qu'ici. Remplace ce texte par le tien.</p>
        <div class="actions">
          <a href="#offre" class="bouton">Voir l'offre</a>
          <a href="#contact" class="bouton bouton--clair">Poser une question</a>
        </div>
      </section>

      <section id="offre" class="grille" aria-label="L'offre">
        <article class="carte">
          <div class="carte__visuel" aria-hidden="true"></div>
          <h2>Premier atout</h2>
          <p>Ce que la personne obtient, concrètement, en une ou deux phrases.</p>
        </article>
        <article class="carte">
          <div class="carte__visuel carte__visuel--2" aria-hidden="true"></div>
          <h2>Deuxième atout</h2>
          <p>Un fait vérifiable plutôt qu'une promesse vague.</p>
        </article>
        <article class="carte">
          <div class="carte__visuel carte__visuel--3" aria-hidden="true"></div>
          <h2>Troisième atout</h2>
          <p>Ce qui rassure : délai, garantie, ou la manière de travailler.</p>
        </article>
      </section>

      <section id="contact" class="contact">
        <h2>On en parle ?</h2>
        <p>Laisse ton adresse : on te répond dans la journée.</p>
        <form id="formulaire" class="formulaire">
          <label for="courriel">Ton adresse e-mail</label>
          <div class="formulaire__ligne">
            <input id="courriel" type="email" required placeholder="toi@exemple.com" />
            <button class="bouton" type="submit">Envoyer</button>
          </div>
          <p id="retour" class="retour" role="status"></p>
        </form>
      </section>
    </main>

    <footer class="pied">© <span id="annee"></span> Mon projet</footer>
    <script src="script.js"></script>
  </body>
</html>
`,
    'style.css': `/* Les couleurs et les tailles de tout le site : change-les ici. */
:root {
  --fond: #faf6f0;
  --surface: #ffffff;
  --encre: #171b26;
  --gris: #5d6270;
  --accent: #c25e38;
  --accent-fonce: #a64d2c;
  --laiton: #e09f3e;
  --trait: #e8dfd1;
  --rayon: 14px;
  --titre: 'Fraunces', Georgia, serif;
  --texte: 'Figtree', system-ui, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--texte); font-size: 1rem; line-height: 1.6; color: var(--encre); background: var(--fond); }
h1, h2 { font-family: var(--titre); line-height: 1.1; text-wrap: balance; margin: 0; }
h1 { font-size: clamp(2.2rem, 6vw, 3.6rem); }
h2 { font-size: 1.35rem; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--laiton); outline-offset: 3px; }

.entete, main, .pied { width: min(72rem, 100% - 2rem); margin-inline: auto; }
.entete { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 1.25rem; }
.marque { font-family: var(--titre); font-weight: 700; font-size: 1.25rem; text-decoration: none; }
nav { display: flex; align-items: center; gap: 1.25rem; font-weight: 500; }
nav a:not(.bouton) { text-decoration: none; color: var(--gris); }

.bouton { display: inline-flex; align-items: center; justify-content: center; padding: 0.8rem 1.3rem; border-radius: 999px; border: 0; background: var(--accent); color: #fff; font: 600 1rem var(--texte); text-decoration: none; cursor: pointer; transition: background 0.2s, transform 0.2s; }
.bouton:hover { background: var(--accent-fonce); transform: translateY(-1px); }
.bouton--clair { background: transparent; color: var(--encre); box-shadow: inset 0 0 0 1.5px var(--trait); }
.bouton--clair:hover { background: var(--surface); }
.bouton--petit { padding: 0.5rem 1rem; font-size: 0.9rem; color: #fff; }

.accroche { padding-block: clamp(3rem, 10vw, 6.5rem) 3rem; max-width: 46rem; }
.surtitre { font-size: 0.8rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin: 0 0 1rem; }
.chapeau { font-size: 1.15rem; color: var(--gris); max-width: 38rem; margin: 1.25rem 0 2rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }

.grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1.25rem; padding-block: 2rem 4rem; }
.carte { background: var(--surface); border: 1px solid var(--trait); border-radius: var(--rayon); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
.carte p { margin: 0; color: var(--gris); }
.carte__visuel { aspect-ratio: 16 / 10; border-radius: calc(var(--rayon) - 4px); background: linear-gradient(135deg, #f3d9c9, var(--accent)); margin-bottom: 0.4rem; }
.carte__visuel--2 { background: linear-gradient(135deg, #f7e6c4, var(--laiton)); }
.carte__visuel--3 { background: linear-gradient(135deg, #e3e6ee, #3b4a6b); }

.contact { background: var(--encre); color: #fff; border-radius: calc(var(--rayon) + 6px); padding: clamp(1.5rem, 5vw, 3rem); margin-bottom: 3rem; }
.contact p { color: #c9ccd6; }
.formulaire label { display: block; font-weight: 600; margin: 1.25rem 0 0.5rem; }
.formulaire__ligne { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.formulaire input { flex: 1 1 14rem; min-width: 0; padding: 0.8rem 1rem; border-radius: 999px; border: 0; font: inherit; }
.retour { min-height: 1.5rem; color: var(--laiton); }

.pied { padding-block: 2rem; color: var(--gris); font-size: 0.9rem; border-top: 1px solid var(--trait); }

@media (max-width: 480px) { nav a:not(.bouton) { display: none; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`,
    'script.js': `document.getElementById('annee').textContent = new Date().getFullYear();

// Le formulaire ne part nulle part tant qu'aucun service d'envoi n'est branché :
// on le dit, au lieu de faire croire que c'est envoyé.
document.getElementById('formulaire').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('retour').textContent = "Merci ! (Démo : rien n'est encore envoyé.)";
});
`,
    'README.md': '# Mon projet\n\nUne base de site soignée : couleurs et polices dans `style.css` (en haut), contenu dans `index.html`.\n',
    '.gitignore': IGNORER,
  },
  python: {
    'main.py': `def saluer(nom: str) -> str:
    return f"Bonjour, {nom} !"


if __name__ == "__main__":
    print(saluer("le monde"))
`,
    'test_main.py': `from main import saluer


def test_saluer():
    assert saluer("Léo") == "Bonjour, Léo !"
`,
    'README.md': '# Mon script Python\n\nLancer : `python3 main.py`\n\nTester : `python3 -m pytest` (après `pip install pytest`)\n',
    '.gitignore': IGNORER,
  },
  node: {
    'package.json': `{
  "name": "mon-projet",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "test": "node --test"
  }
}
`,
    'index.js': `export function saluer(nom) {
  return \`Bonjour, \${nom} !\`;
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log(saluer('le monde'));
}
`,
    'index.test.js': `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saluer } from './index.js';

test('saluer', () => {
  assert.equal(saluer('Léo'), 'Bonjour, Léo !');
});
`,
    'README.md': '# Mon projet Node\n\nLancer : `npm start`\n\nTester : `npm test`\n',
    '.gitignore': IGNORER,
  },
};
