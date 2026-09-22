# Legion — chantier 2 : les compétences et le veilleur

Beau, 22/09 : « des agents qui s'améliorent… un agent qui part chaque jour
sur le net, sur GitHub, il prend des skills, des dépôts, pour s'améliorer
constamment ». Le plan, avant le code.

## Ce qu'est une compétence

Une **fiche de savoir-faire** écrite par des gens du métier : quand s'en
servir, les étapes, les pièges, la liste de contrôle. Le format courant sur
GitHub est un fichier `SKILL.md`. Exemple réel du catalogue :
« postgresql-table-design — concevoir ou relire un schéma PostgreSQL ».

Un agent équipé d'une compétence la **relit avant de répondre**. C'est ça,
« s'améliorer » : il ne devient pas un autre modèle, il travaille avec la
méthode d'un expert sous les yeux.

## Ce qu'on a déjà

Le catalogue : **571 compétences** (et 481 agents) copiées de deux dépôts
GitHub sous licence MIT (`wshobson/agents` 183, `alirezarezvani/claude-skills`
388), avec leur source et leur licence sur chaque ligne. Il manque : leur
texte complet, et le lien avec les agents.

## Les étapes

| # | Étape | Ce que Beau voit |
| --- | --- | --- |
| A | **Équiper un agent** : on attache une compétence à un agent ; son texte est lu à la source (GitHub), gardé, et l'agent le relit avant chaque réponse | Dans la fiche de l'agent : « Ses compétences », ajouter, retirer |
| B | **Qu'ils s'équipent eux-mêmes** : pour chaque agent, on présélectionne dans le catalogue ce qui colle à son poste et à son mandat, et l'agent choisit ses 3 compétences | Un bouton, comme « Qu'ils choisissent leur tête » ; un message dans Direction dit qui a pris quoi |
| C | **Le veilleur**, chaque matin : il cherche sur GitHub les nouveaux dépôts de compétences **sous licence libre** (MIT, Apache, BSD — les autres sont écartés), lit les nouvelles fiches, les ajoute au catalogue avec leur source, et propose à chaque entreprise celles qui lui servent | Un message du veilleur dans Direction : « 3 nouvelles compétences utiles pour vous », avec « équiper » |
| D | **La note sur chaque livrable** : ce que la relecture corrige souvent devient une compétence maison | Plus tard |

## Les garde-fous

- **Licence** : seulement des sources sous licence libre, et la licence
  reste attachée à chaque compétence. Rien n'est « pris » sans droit.
- **Une compétence est du savoir, pas un ordre.** Le texte vient d'inconnus
  sur Internet : il est présenté à l'agent comme une méthode à suivre dans
  son métier, jamais comme une instruction qui passerait avant ses règles,
  la mémoire de la maison ou le fondateur. Et les agents n'ont que des outils
  de lecture : une fiche piégée ne peut rien casser.
- **Taille** : le texte est tronqué (quelques milliers de caractères par
  fiche, 4 fiches au plus par réponse) pour que le coût reste petit.
- **Coût** : le choix par l'agent (B) coûte un appel au modèle par agent,
  une fois ; le veilleur (C), quelques appels par jour.
