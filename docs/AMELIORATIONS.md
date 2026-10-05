# Améliorations quotidiennes — registre

Ordre de Beau (05/10/2026) : « les agents IA dans Léo doivent continuer avec
les différentes sessions et ton accord à améliorer automatiquement Finjaro,
Accounting, Léo, Learn, Athlo et My Finance — design, fonctionnalités,
technique — et finir leurs tâches. Chaque jour au moins 5 améliorations
réelles. Autonomes, sous ton contrôle : c'est toi qui acceptes ou modifies,
tu as la décision finale. »

## Règles du registre

- Une ligne par amélioration **réellement faite**, avec sa preuve (commit,
  test, capture, mesure avant/après). Une idée ou une tâche ouverte n'est pas
  une amélioration.
- « Réelle » veut dire qu'une personne la voit ou qu'une mesure change : un
  écran plus clair, un bouton qui marche, une page plus rapide, une erreur qui
  disparaît, une faille fermée.
- L'auteur est noté : Claude, un agent de Léo (relu par Claude), ou
  Claudinette (Accounting).
- Où elle en est : staging, en ligne, ou en attente du mot de Beau.

## Les six produits

| Produit | Où est le code | Qui le touche |
| --- | --- | --- |
| Finjaro (place de marché) | ce dépôt, branche staging | Claude, agents de Léo par branches leo/ |
| Finjaro Accounting | dépôt Automatisation-des-candidatures | Claudinette ; propositions par le canal direct |
| Léo | ce dépôt (src/screens/legion, supabase/functions/legion-*) | Claude, agents |
| Learn | dépôt Finjaro-learn, importé ici dans public/learn | Claude (import), session Learn |
| Mon argent (My Finance) | ce dépôt (src/screens/money) | Claude, agents |
| Athlo | dépôt non branché à cette session ; base en pause depuis le 01/10 | à décider avec Beau |

## Registre

| Date | Produit | Amélioration | Auteur | Preuve | État |
| --- | --- | --- | --- | --- | --- |
| 05/10 | Finjaro | Photos : vrai format vérifié avant l'envoi, plus d'AVIF déguisé en PNG de 2,5 Mo | Claude | 877b258, 3 tests | staging |
| 05/10 | Léo | Outils « qui a fait / fiche personne » réservés à Finjaro (fuite vers les autres entreprises fermée) | Claude | 1528e25, code en ligne vérifié (legion-repondre v147) | en ligne |
| 05/10 | Léo | Coût des agents passés par OpenAI enfin compté : le plafond du mois les arrête de nouveau | Claude | 1528e25 | en ligne |
| 05/10 | Finjaro | Pays et ville approximative de chaque visite (Cloudflare /geo) | Claude | 9a71f81, 2 tests, visite d'essai enregistrée | staging |
| 05/10 | Learn | Lettre de l'IA n° 2 publiée et vérifiée à 390 et 1440 px | Claude | bcaf8f1 | staging |
| 05/10 | Accounting | Base de test alignée sur la production (garde « membre retiré ») | Claude | empreinte md5 identique | test |
