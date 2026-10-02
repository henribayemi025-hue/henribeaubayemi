# La Lettre de l'IA — format de publication

Un numéro = un fichier Markdown `AAAA-MM-JJ.md` dans ce dossier, plus une ligne en TÊTE de `index.json` :

```json
{ "date": "AAAA-MM-JJ", "numero": 2, "titre": "Numéro 2 · samedi 3 octobre 2026", "fichier": "AAAA-MM-JJ.md" }
```

- `titre` : recopié du fichier (aucun texte ajouté).
- Rien à compiler pour le contenu : l'appli lit `index.json` et le fichier à l'ouverture. Il suffit que les deux fichiers soient servis dans `/learn/lettre/` (un nouveau déploiement de ce dossier).
- Markdown accepté : titres `##` / `###`, gras, italique, listes, liens, tableaux (le tableau défile dans son cadre sur téléphone), lignes `---`.
- Adresse directe : `/learn/#lettre` (dernier numéro) et `/learn/#lettre/AAAA-MM-JJ` (un numéro précis).

## Rubriques reconnues (mise en forme spéciale)
- `## 📰 … nouveautés du jour` : chaque `### Titre` devient une carte ; un paragraphe qui commence par `**À retenir` va dans l'encadré ; une ligne `Source(s) :` va en pied de carte.
- `## ⭐ … dépôts …` : le tableau devient un carrousel. 1re colonne = lien `[proprio/nom](https://github.com/proprio/nom)`, 2e = description, colonnes suivantes affichées avec leur en-tête (ex. « Étoiles du jour »). Le bouton copie `git clone https://github.com/proprio/nom.git`.
- `## ✍️ Le prompt du jour` (ou tout titre contenant « prompt ») : le PREMIER bloc de code ``` est le prompt (affiché façon éditeur, bouton Copier) ; le reste du texte (cas d'usage, pourquoi ça marche) s'affiche au-dessus.
- Toute autre rubrique `##` (🆕, 💡, 📖…) s'affiche telle quelle dans une carte.
