"""Les fonctions edge à redéployer après une poussée.

Lit la liste des fichiers changés (variable CHANGES, un chemin par ligne) et
écrit les fonctions touchées: celles dont un fichier a changé, et celles qui
importent — directement ou par un autre fichier de _shared — un fichier de
_shared qui a changé.
"""
import os
import re
from pathlib import Path

RACINE = Path('supabase/functions')
IMPORT = re.compile(r"""(?:from|import)\s*\(?\s*['"](\.{1,2}/[^'"]+)['"]""")


def imports(fichier: Path) -> set[Path]:
    try:
        texte = fichier.read_text(encoding='utf-8')
    except (OSError, UnicodeDecodeError):
        return set()
    return {(fichier.parent / m).resolve() for m in IMPORT.findall(texte)}


def fermeture(depart: Path) -> set[Path]:
    vus: set[Path] = set()
    a_voir = [depart.resolve()]
    while a_voir:
        f = a_voir.pop()
        if f in vus:
            continue
        vus.add(f)
        if f.suffix in ('.ts', '.js', '.mjs', '.tsx'):
            a_voir.extend(imports(f))
    return vus


changes = [l.strip() for l in os.environ.get('CHANGES', '').splitlines() if l.strip()]
partages = {Path(c).resolve() for c in changes if c.startswith('supabase/functions/_shared/')}
touchees = set()
for dossier in sorted(RACINE.iterdir()):
    index = dossier / 'index.ts'
    if dossier.name == '_shared' or not index.is_file():
        continue
    if any(c.startswith(f'supabase/functions/{dossier.name}/') for c in changes):
        touchees.add(dossier.name)
    elif partages and fermeture(index) & partages:
        touchees.add(dossier.name)
print('\n'.join(sorted(touchees)))
