# Les 4 prototypes Google AI Studio de Beau — ce qu'on reprend (25/09)

Beau : « ils ont vraiment mal fait, je t'envoie juste pour les idées ; en
graphisme je veux du réalisme, au minimum GTA San Andreas / Vice City /
Liberty City, plus si on peut » ; « leur 4D n'est pas vraiment la vraie
4D » ; budget : **20 € par mois au maximum**, outils et dépôts gratuits.

Construits et essayés ici (captures dans le scratchpad) : tous en three.js,
personnages en cubes, décor sombre et vide. **Le graphisme n'est pas repris.
Les idées, si** — voici la liste, prototype par prototype.

## 1. « Léo – monde virtuel des agents IA »
- Déplacement **Z Q S D** (clavier français) ou flèches, **Maj** pour
  courir, **E** pour interagir, **V** pour changer de caméra — repris.
- Onglets d'étages en haut (Hall, Code Lab, Studio, Direction) — repris
  comme raccourcis (Réception, Salle de réunion, Atelier).
- Bandeau « où je suis » (étage + une phrase) — repris.
- Nom de la réceptionniste flottant au-dessus d'elle — repris (nom + poste).
- La ville de nuit derrière les baies vitrées — repris, avec l'heure réelle.
- Poste de travail d'un agent qui s'ouvre en éditeur de code — repris
  (ouvre l'atelier sur SA séance).

## 2. « Léo – simulation d'entreprise 3D / orchestration »
- **Les écrans des bureaux montrent le vrai code** que l'agent écrit
  (texture dessinée en direct sur le moniteur 3D) — repris, c'est fort.
- « Moniteur de Marcus (en direct) » : regarder l'écran d'un agent depuis
  n'importe où — repris.
- « Créer un ticket » depuis le monde — repris (crée une vraie tâche).
- Bouton « Changer d'étage » — repris (ascenseur).
- Salle du conseil — existe déjà (salle de réunion), à mettre en 3D.

## 3. « Léo – 3D corporate AI simulation »
- **Carte de proximité** : en s'approchant d'un agent, sa carte apparaît
  (nom, poste, état, ce qu'il fait) avec « Parler en face-à-face (E) » —
  repris, avec les vraies données.
- **Barre d'ascenseur** en bas de l'écran — reprise.
- **Trois caméras : 3e personne, 1re personne, plan vu de dessus** — reprises.
- Écran défilant dans le hall — repris avec de vrais faits (tâches rendues
  aujourd'hui, réunion en cours), jamais de cours de bourse inventé.
- Assistant « nouveau projet » qui fait pousser une tour — existe (Ville),
  à relier.
- Confettis quand un projet se termine — repris (un vrai projet fini).

## 4. « Léo – simulation d'entreprise 4D »
La « 4D » y est une frise du temps. C'est une vraie bonne idée, sous une
autre forme que ce que Beau imaginait :
- **Remonter le temps** : glisser une barre et voir l'entreprise telle
  qu'elle était hier, la semaine dernière (qui travaillait, les tours plus
  basses) ; accélérer ×10, ×100 — repris, rejoué depuis les VRAIS
  événements (la frise existe déjà en liste).
- **La machine à bugs** : partir d'un problème et remonter à la tâche, au
  livrable ou au commit qui l'a causé — repris (rejoint le carnet des
  décisions et le « pourquoi ? » des IA).
- **L'hélice des commits** autour de la tour — reprise pour l'atelier (les
  vrais commits d'un projet).
- Pluie, vue intérieure / extérieure — déjà là (ciel réel), à garder en 3D.
- Ascenseur en colonne sur le côté, agents présents par étage — repris.
- Projection à 5 ans et « multivers » — **seulement** présentés comme des
  projections et à partir de vrais chiffres ; jamais un chiffre inventé
  affiché comme un fait.
- Écarté : les montants décoratifs (« 38,5 M€ », « $12 450 000 »), les
  pourcentages de « focus » inventés.

## Réalisme visé et outils (tous gratuits)

- Moteur : three.js (MIT), post-traitement (occlusion, bloom, tons ACES).
- Gens : Microsoft Rocketbox (MIT) — 115 personnages, 471 animations
  (marcher, courir, téléphoner, saluer, s'asseoir, taper) ; déjà converti
  et vu en train de marcher. Plus fins que les personnages de San Andreas.
- Décor : Poly Haven (CC0) — fauteuils, canapés, plantes, bureaux, lampes,
  sols en marbre, ciels HDRI.
- Lumière : le ciel réel déjà branché (heure, soleil, météo).
- Voix : la voix du navigateur (gratuite) ; Fish Audio (déjà payé) après
  vérification de la clé.
- Hébergement : Cloudflare (gratuit). **Coût mensuel ajouté : 0 €.**
