# Rapport du lundi 12/10 : définition et requête de chaque chiffre

Écrit par Claude le 12/10 (heure de Paris, soir). Chaque requête a été **exécutée en
lecture seule sur la base de production** ce soir-là ; la colonne « Valeur » est ce
qu'elle a rendu. Aucun nom, aucune adresse : seulement des comptages.

Pourquoi ce fichier : la tâche donnée à Boussole (« la définition de chaque chiffre,
la requête, l'écart ») est revenue deux fois avec des tables et des colonnes qui
n'existent pas (`items`, `sessions`, `boutiques`, `commandes`, `visites`…). Boussole
n'a pas d'outil pour lire la base ; ce tableau est donc la version vérifiée.

## « Réel » veut dire une chose précise

`compte_reel(id)` est vrai quand le profil existe, que `is_test` est faux **et**
que `is_admin` est faux. Une boutique est « réelle » quand sa propriétaire
(`shops.owner_id`) l'est. Une commande n'a pas de définition aussi nette : voir plus bas.

## Les chiffres

| Chiffre du rapport | Définition | Requête (lecture seule) | Valeur | Écart avec le rapport |
| --- | --- | --- | --- | --- |
| Profils réels | profils dont `compte_reel(id)` est vrai | `select count(*) from profiles p where public.compte_reel(p.id)` | 110 | aucun |
| … créés cette semaine | idem, `created_at` depuis le lundi 05/10 | même requête + `and p.created_at >= '2026-10-05'` | 1 | aucun |
| Boutiques réelles | boutiques dont la propriétaire est un compte réel, quel que soit leur `status` | `select count(*) from shops s where public.compte_reel(s.owner_id)` | 70 | aucun |
| … avec au moins un article | idem et au moins une ligne dans `products` | + `and exists (select 1 from products x where x.shop_id = s.id)` | 49 (donc 21 vides) | aucun |
| Articles | **tous** les articles des boutiques réelles, actifs ou non | `select count(*) from products x join shops s on s.id = x.shop_id where public.compte_reel(s.owner_id)` | 460 | aucun, mais voir ci-dessous |
| … dont actifs | idem et `x.is_active` | + `and x.is_active` | 402 | le rapport ne le dit pas |
| Articles sans prix | `price_on_request` vrai (c'est le seul cas : aucun article n'a un prix vide ou à zéro sans être « sur demande ») | + `and x.price_on_request` | 243 (dont 217 actifs), dans 23 boutiques (`count(distinct x.shop_id)`) | aucun |
| Commandes de la semaine | commandes créées depuis le 05/10, toutes confondues | `select count(*) from orders where created_at >= '2026-10-05'` | 0 | aucun |
| Dernière commande | `max(created_at)` de `orders` | `select max(created_at)::date from orders` | 27/09 | aucun |
| Entreprises dans Léo | lignes de `legion_entreprises` | `select count(*) from legion_entreprises` | 9 (0 créée depuis le 05/10) | aucun |

## Deux pièges que le rapport ne dit pas

1. **Articles : 460 ou 402 ?** Le rapport compte tous les articles (460), les
   rapports précédents comptaient les articles actifs (402, dont 217 sans prix).
   Les deux sont exacts, mais ils ne se comparent pas. Le rapport du 12/10 dit
   désormais lequel des deux il donne.
2. **Commandes : « réelles » n'a pas de réponse unique.** Sur 28 commandes au
   total : 2 viennent d'un acheteur au compte réel, **3 n'ont pas de compte**
   (`buyer_id` vide, la plus récente du 27/09 : peut-être de vraies personnes) et
   23 viennent de comptes de test ou d'administration. Le rapport ne donne que la
   semaine (0) et la date de la dernière, ce qui reste juste ; mais un total
   « commandes réelles » serait 2 ou 5 selon qu'on compte les commandes sans
   compte. À trancher par Beau avant d'écrire ce total quelque part.

## Ce qui n'est pas vérifié ici

- « dont 3 de vraies personnes » (entreprises dans Léo) : la définition n'est
  écrite nulle part, et je ne l'ai pas recalculée ce soir.
- Les chiffres de visiteurs et de navigateurs (table `events`) : non repris ici.
