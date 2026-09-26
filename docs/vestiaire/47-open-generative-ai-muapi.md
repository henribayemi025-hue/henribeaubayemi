# 47 — Open Generative AI (studio libre) et MuAPI (modèles payés à l'usage)

- **Source** : message transféré par Beau le 26/09 (texte promotionnel, avec en fin une invitation à la communauté « IA.zip »).
- **Type** : logiciel libre (studio web) + service payant à l'usage (MuAPI).
- **Accès** : README et licence du dépôt lus (https://github.com/Anil-matcha/Open-Generative-AI) ; sites muapi.ai non ouverts.
- **Licence / droits** : MIT pour le code du studio. Les images et vidéos produites dépendent des conditions de MuAPI et de chaque modèle (non lues).
- **Reçu de Beau le** : 26/09/2026

## Ce que c'est
Un studio web gratuit (code MIT) qui envoie les demandes à **MuAPI**, un intermédiaire qui donne accès à beaucoup de modèles d'image, de vidéo, de synchronisation des lèvres (« lip sync ») et d'audio. Pas d'abonnement : on paie chaque génération au prix du modèle (liste sur muapi.ai/playground). Il faut un compte MuAPI et une clé d'accès.
Le README est aussi une vitrine commerciale (offre « marque blanche » à partir de 49 $/mois, liste de prix des concurrents « approximatifs » de leur propre aveu). Les chiffres « 400+ modèles, 14 studios » viennent de leur README, pas vérifiés.

## Ce qui est vraiment utile pour Finjaro et Léo
1. **Une deuxième source d'images quand Google tombe** (le 26/09, les crédits Gemini étaient épuisés) : les portraits des agents et la banque de visages de « Fonder » pourraient passer par MuAPI, payé à l'image. À comparer au prix de Gemini avant de choisir.
2. **Vidéo et lip sync** pour les pubs de Finjaro/Léo, sans abonnement.
3. **Pour Léo, l'idée d'un moteur interchangeable** : c'est ce que fait déjà `_shared/moteur.ts` pour le texte ; on pourrait faire pareil pour les images (Gemini, sinon MuAPI).

## Points d'attention
- La **clé MuAPI** ne s'écrit jamais dans une conversation ni dans le code : elle va dans les secrets Supabase (ou Cloudflare), posée par Beau.
- Le README vante « aucun filtre de contenu » : nos règles restent les nôtres (pas de personne réelle, pas de photo d'article inventée, rien de trompeur).
- « IA.zip » (lien taap.it en fin de message) : une communauté promotionnelle ; les nombres annoncés (600+ skills, 150+ agents…) ne sont pas vérifiés. Pas ouvert, pas recommandé tant qu'on n'en a pas besoin.

## Pour quels agents de Léo
- **Forge** : étudier un « moteur d'images interchangeable » (Gemini → MuAPI en secours), prix par image.
- **Vigie** : relever les prix réels sur muapi.ai/playground (image portrait, vidéo 5 s, lip sync) avec la date.
- **Plume** : pubs vidéo si Beau valide un budget.

## Compétences à tirer (pour Mentor)
**Avoir un plan B pour chaque fournisseur d'IA** — tous les agents
Un service d'IA peut s'arrêter d'un coup (crédit épuisé, panne, limite). Garder une deuxième source prête, comparer les prix par unité (par image, par minute), et savoir en une phrase ce qui s'arrête si le fournisseur principal tombe.
