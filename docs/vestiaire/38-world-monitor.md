# 38 — World Monitor : le monde en direct sur une carte, par couches

- **Source** : https://www.worldmonitor.app/
- **Type** : site + dépôt open source
- **Accès** : lu (page d'accueil)
- **Licence / droits** : AGPL-3.0 (site) ; offre Pro payante 39,99 $/mois selon eux
- **Reçu de Beau le** : 25/09/2026

## Ce que c'est
Un tableau de bord gratuit qui pose sur une carte du monde des dizaines de couches de données en direct (navires, avions, marchés, câbles, météo, alertes), avec une recherche Ctrl+K, une API, un serveur MCP et des SDK.

## Ce qui est vraiment utile pour Finjaro et Léo
C'est exactement la suite naturelle de la vue « planète » de Léo : une Terre sur laquelle on allume des couches de VRAIES données (le jour et la nuit sont déjà là ; ensuite la météo des villes, les fuseaux, plus tard là où sont les boutiques Finjaro en nombre par pays). La palette Ctrl+K existe déjà dans l'atelier.

## Pour quels agents de Léo
Alpha (couches de la planète) ; Vigie (sources de données publiques, chacune vérifiée) ; Forge (API et MCP).

## Compétences à tirer (pour Mentor)
**Une couche = une source nommée** — Alpha, Vigie — Sur une carte, chaque couche affichée dit d'où viennent ses données et à quelle heure elles datent. Pas de source lue, pas de couche.

## Limites, risques, prudence
AGPL : on ne recopie pas leur code dans Léo ; on s'en inspire, ou on passe par leur API. Les chiffres qu'ils annoncent sur eux-mêmes (nombre de sources) sont « selon eux ».

## Verdict
Retenu comme inspiration pour les couches de la planète de Léo.
