# Modèles Google AI Studio pour Finjaro Learn (envoyés par Beau le 02/10)

Beau : « voici un template de Google AI Studio, je le trouve très beau, qu'il
s'inspire de ça, qu'il prenne des choses ; j'aime vraiment ce qu'il a fait, c'est
déjà bien, on va continuer » — puis le second : « l'autre aussi, prends ce qui est
bien ».

Ce sont des **inspirations**, pas des applications à brancher : on reprend des
idées d'écran et de style dans Learn, on garde ce qui marche déjà dans Learn.

| Dossier | Style | À reprendre |
| --- | --- | --- |
| `aistudio-1-clair/` | Clair, orange, Inter | Barre d'onglets complète (Parcours, Tuteurs IA, Grands projets, Compétences, Communauté, Outils IA, Profil) ; cartes « Projet clé » (réseau de neurones, assistant RAG, mini-processeur, RSA) ; recherche + filtre Débutant / Intermédiaire / Avancé ; cartes de parcours avec progression ; fenêtre Accessibilité (police dyslexie, taille du texte, contraste). |
| `aistudio-2-sombre/` | Sombre, lueurs orange, carrousel | Grande carte « Reprendre la leçon » avec petite visualisation (perceptron) ; parcours en carrousel ; barre d'onglets flottante (Hub, Étude, Outils IA) ; titres ronds. |

À ne **pas** reprendre (règles de Finjaro) :
- les chiffres inventés des maquettes (« 7 jours de série », « 450 XP », « 68 % »,
  « Alexandre ») : n'afficher que ce qui est mesuré pour la personne connectée ;
- aucune photo prise sur le web ;
- `server.ts` / clé Gemini côté navigateur : Learn passe par ses fonctions serveur.

Aperçus : `apercu-390.png` et `apercu-1440.png` dans chaque dossier.

## La lettre de l'IA : « Finjaro Pulse » (envoyés par Beau le 02/10, après-midi)

Deux modèles AI Studio pour la **lettre quotidienne de l'IA** (rubrique « La
Lettre de l'IA » de Learn + raccourci dans le menu des 6 points).

| Dossier | Style | À reprendre |
| --- | --- | --- |
| `pulse-1/` | Sombre, orange, « Finjaro Pulse » | En-tête « édition du jour » (date + filtres Tout / GitHub / Prompts / Actus + recherche) ; carrousel **Top dépôts GitHub du jour** (propriétaire/nom, description, langages, étoiles, étoiles du jour, bouton « git clone » à copier) ; **Prompt du jour** dans un cadre façon éditeur, bouton « Copier le prompt », « cas d'usage » ; **L'Actu IA** en cartes avec un **dessin vectoriel** généré (pas de photo), « point clé », temps de lecture ; bloc d'inscription « chaque matin ». |
| `pulse-2/` | Sombre, cyan et violet | Même plan, plus : **favoris** (garder un dépôt ou un article), **recherche** en tête, onglets Claude / GPT / Gemini sur le prompt du jour, « Pourquoi ce prompt marche », fenêtre de détail d'un dépôt, « digest audio » (lecture à voix haute du numéro — plus tard). |

**À ne PAS reprendre** (inventé par la maquette) : les nombres d'étoiles des
exemples, « Édition #342 / #142 », « 99,4 % sans hallucination », « élimine 98 %
des dérives », « 80 % de latence en moins », les noms d'auteurs (« Alexandre
Meyer », « Dr. Marc Chen »…), « Finjaro Labs Inc. », « Mis à jour il y a 12 min »,
« Tous systèmes nominaux », « Données chiffrées & RGPD ». Dans Learn, tout vient
du numéro du jour (`docs/lettre-ia/…`), avec ses sources et ses dates ; un chiffre
non sourcé ne s'affiche pas. Aucune clé d'API dans le navigateur (les modèles
n'en utilisent pas ; le garder ainsi).

Couleur : `pulse-1` est orange comme les deux premiers modèles ; `pulse-2` est
cyan/violet. Choix de couleur de Learn en attente de Beau (orange de ses
modèles ou terracotta de la place de marché).
