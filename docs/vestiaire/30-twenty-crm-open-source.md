# 30 — Twenty : un CRM libre « que tu codes toi-même » (guide Google Docs de danyltn)

- **Source** : guide https://docs.google.com/document/d/1sGC9m_KEe6WsA42bJF9100whNqzLTADHF2OZqSxA-mo — outil https://github.com/twentyhq/twenty
- **Type** : guide Google Docs + dépôt GitHub
- **Accès** : guide lu en entier (version publique). Dépôt : page d'accueil et fichier LICENSE lus, rien installé.
- **Licence / droits** : **AGPLv3** pour l'essentiel, avec des fichiers marqués « Enterprise » sous licence commerciale, et les kits de développement (twenty-sdk, twenty-ui, applications) sous **MIT**. Une exception autorise à bâtir des applications par ses API sans être soumis à l'AGPL.
- **Reçu de Beau le** : 24/09/2026 (22 h 58)

## Ce que c'est
Un carnet de clients et de prospects (CRM) libre, présenté comme l'alternative à Salesforce. On peut l'utiliser en ligne (payant après l'essai) ou l'installer chez soi gratuitement (Docker). Ses points forts : on ajoute ses propres champs et objets, il a des automatisations (déclencheur → action), une API REST et GraphQL, des webhooks, et un fichier `.mcp.json` pour les agents. Le guide montre comment le faire modifier par Claude Code. Il se termine par une invitation à une « communauté VIP » (promotionnel).

## Ce qui est vraiment utile pour Finjaro et Léo
- **Pour les utilisateurs de Léo** : un connecteur « Twenty » (par ses API, avec la clé de la personne) donnerait à leurs agents Traque, Lien ou Semeur un vrai carnet de prospects, au lieu de listes dans les salons.
- **Pour l'atelier** : c'est un bon exemple de gros projet réel qu'un agent pourrait apprendre à modifier (objets, champs, automatisations).
- **À ne pas faire** : copier son code dans Finjaro. L'AGPL obligerait à publier notre code. Passer par ses API est permis par l'exception de la licence.

## Pour quels agents de Léo
- **Alpha** : décider si un connecteur CRM entre dans la liste des connecteurs par utilisateur.
- **Traque, Lien, Semeur** : ce sont eux qui rempliraient et suivraient les prospects.
- **Claudinette** : Finjaro Accounting a peut-être déjà ses propres fiches clients : à lui demander avant de proposer quoi que ce soit.

## Compétences à tirer (pour Mentor)
**Tenir un carnet de prospects propre** — Traque, Lien, Semeur
Chaque prospect a une source (lien, date), une étape (repéré, contacté, a répondu, client), la prochaine action et sa date. On ne crée jamais une fiche sans source, et on n'invente aucune coordonnée. Un prospect qui dit non passe en « non, merci » : on ne le relance plus. Une fois par semaine, on repère les fiches sans prochaine action.
*Source : inspiré du modèle « contacts, étapes, automatisations » de Twenty.*

## Limites, risques, prudence
- AGPL : pas de reprise de code dans nos dépôts.
- Les données de prospects sont des données personnelles : aucune dans le dépôt public.
- Le chiffre « ~50 000 étoiles » du guide est ancien : la page GitHub en montrait 57 500 le 25/09.

## Verdict
**À garder en réserve** pour un connecteur par utilisateur, après GitHub, Supabase et Vercel. Tâche confiée à Alpha le 25/09.
