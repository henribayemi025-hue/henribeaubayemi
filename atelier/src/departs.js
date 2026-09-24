// Les points de départ d'un nouveau projet (plan, 1.6 étape 2). Petits,
// écrits ici, sous la licence du projet : rien n'est copié d'ailleurs.

const IGNORER = 'node_modules/\n.venv/\n__pycache__/\ndist/\nbuild/\n.env\n';

export const DEPARTS = {
  vide: {
    'README.md': '# Mon projet\n\nDécris ici ce que fait ton projet.\n',
    '.gitignore': IGNORER,
  },
  page_web: {
    'index.html': `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ma page</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main>
      <h1>Bonjour</h1>
      <p>Ma première page.</p>
      <button id="bouton">Clique-moi</button>
      <p id="compteur">0 clic</p>
    </main>
    <script src="script.js"></script>
  </body>
</html>
`,
    'style.css': `body { font-family: system-ui, sans-serif; margin: 0; background: #faf6f0; color: #171b26; }
main { max-width: 36rem; margin: 3rem auto; padding: 0 1rem; }
button { padding: 0.6rem 1rem; border-radius: 8px; border: 0; background: #c25e38; color: white; font-size: 1rem; }
`,
    'script.js': `const bouton = document.getElementById('bouton');
const compteur = document.getElementById('compteur');
let clics = 0;
bouton.addEventListener('click', () => {
  clics += 1;
  compteur.textContent = clics === 1 ? '1 clic' : \`\${clics} clics\`;
});
`,
    'README.md': '# Ma page\n\nOuvre `index.html` dans un navigateur.\n',
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
