# Legion — le chantier : qui fait quoi (22/09)

Beau, 22/09 : « fais un plan de ce que tu vas construire. Ce que toi tu peux
faire, tu le fais. Ce qui demande ma validation, tu me demandes. Ce qui
dépend de moi, tu me le confies. »

Trois colonnes, pas plus. Le détail de chaque sujet reste dans
`PLAN-COMPLET.md` (partie B).

## 1. Je le fais, sans t'attendre

Dans cet ordre. Chaque ligne n'est « faite » que lorsqu'on l'a vue marcher.

| # | Quoi | Pour toi, ça veut dire |
| --- | --- | --- |
| 1 | ✅ Le chat du téléphone façon WhatsApp, glisser pour répondre, appui long, clavier qui ne pousse plus la page — **en ligne** | |
| 2 | ✅ **Les agents branchés sur la base** (lecture seule) : un tableau de chiffres, et 7 outils qu'ils appellent eux-mêmes (vérifier un jour — robot ou vrais gens —, compter un événement, classer les boutiques, articles, catégories, commandes, pays). Pas de SQL libre : chaque outil est une requête fixe | « Alpha, combien de visites cette semaine ? » → un vrai chiffre, plus jamais « je vais demander à Boussole » |
| 3 | ✅ **La mémoire** : une consigne durable devient une règle que tous relisent ; liste « Ce qu'ils ont retenu » sur l'accueil (sur staging) | Tu ne répètes plus la même chose deux fois |
| 4 | ✅ **L'agent critique** : relit chaque proposition avant qu'elle n'arrive à toi ; depuis le 22/09 au soir, il renvoie à l'écriture toute réponse qui propose au lieu de livrer | Moins de réponses creuses |
| 5 | **L'écran d'entrée de Legion** : Google / compte Finjaro / créer un compte (B5) | Un inconnu comprend ce qu'est Legion et entre chez lui, pas chez toi |
| 6 | ✅ **Le compteur de dépense** par entreprise, avec un plafond (B9) — sur l'accueil | Tu sais ce que ça coûte avant que ça coûte |
| 7 | **Les connecteurs** : chaque entreprise branche SES outils avec SES clés (GitHub, e-mail, sa base) | Ce qui permet à une entreprise de télécom de faire travailler ses agents sur ses propres données |
| 8 | ✅ **Les compétences** prises dans le catalogue (GitHub) et attachées à un agent ; le veilleur passe chaque matin | Un agent « support client » sait trier des tickets, un agent « dev » sait écrire des tests |
| 9 | **Inviter d'autres humains** dans une entreprise (B7) | Ton équipe, ou celle d'un client, travaille avec les mêmes agents |

## 2. Je te demande d'abord (ta validation)

| Quoi | Pourquoi je ne décide pas seul |
| --- | --- |
| **Chaque mise en ligne sur finjaro.net** | Les applications Android et iOS chargent finjaro.net : ça touche tout le monde d'un coup |
| **Qui reste allumé** chez Finjaro (B3) — je propose 6 : Alpha, Claudinette, Vigie, Traque, Écho, Lien | C'est ton équipe |
| **Toute action qui change quelque chose** : « déconnecte Finia », envoyer un e-mail, supprimer, publier | Une erreur d'agent ne doit jamais partir sans toi |
| **Ouvrir Legion à d'autres entreprises** | Ce jour-là, il faut les conditions, le prix et le compteur de dépense |
| ✅ **Apprendre des conversations des clients avec Finia** — oui de Beau et de Claudinette (22/09) | Conditions de Claudinette, non négociables : (1) la ligne dans la politique de confidentialité est en ligne AVANT de brancher l'outil ; (2) `finia_tendances(jours)` en SECURITY DEFINER, service_role seulement, agrégats anonymes seulement (thèmes, questions sans réponse, plaintes) ; (3) un thème à moins de 5 messages n'apparaît pas — sinon l'agrégat redevient identifiable |

## 3. Ça dépend de toi (je ne peux pas le faire à ta place)

| Quoi | Pourquoi |
| --- | --- |
| **Les fichiers des logos** Legion, Accounting, Athlo | Je les vois dans tes captures, mais ils ne m'arrivent pas comme fichiers |
| **Une clé Anthropic**, si tu veux que les agents tournent sur Claude | C'est payant, et c'est ton compte |
| **Un jeton GitHub** pour que les agents écrivent sur tes dépôts | Il se crée avec ton compte GitHub (je te guiderai clic par clic) |
| **Les comptes marchands** MTN / Orange | Ton nom, tes papiers |

## Comment ça marche pour une entreprise cliente (ex. : une télécom)

Beau : « une entreprise de télécom vient, elle choisit ses agents… comment
ces agents vont se développer, comment ça se passe ? »

1. **Elle crée son entreprise** et choisit un modèle (ex. : « Opérateur
   télécom »). Legion pose les départements (réseau, support client,
   facturation, marketing…) et les agents avec leur métier.
2. **Elle branche ses outils** (les connecteurs, ligne 7 ci-dessus) : sa base
   de données, sa messagerie, son GitHub, son outil de tickets. Avec SES
   clés. Un agent ne voit que ce qui est branché, rien d'autre.
3. **Elle équipe ses agents de compétences** (ligne 8) : des fiches de
   savoir-faire prises dans le catalogue. C'est ça, « se développer » : un
   agent gagne une compétence comme un salarié suit une formation.
4. **Elle donne une mission dans un salon.** Le responsable du département
   la découpe en tâches, chacun prend la sienne, travaille avec ses outils,
   et rend le résultat dans le salon. La tâche avance sur le tableau.
5. **Ce qui change quelque chose attend un humain**, selon le niveau
   d'autonomie de l'agent (supervisé / semi / autonome). Du code ? Il est
   écrit sur une branche à part, un humain le relit et le fusionne.
6. **Les agents apprennent** avec la mémoire des règles (ligne 3) : chaque
   correction d'un humain devient une règle qu'ils relisent.

Aujourd'hui, les étapes 1 et 4 existent (les agents parlent et prennent des
tâches). Les étapes 2, 3, 5 et 6 sont les lignes 2 à 8 du plan. Les chiffres
de Finjaro (ligne 2) sont le premier connecteur : c'est le même mécanisme
qu'une télécom utilisera pour ses propres données.

## Les grands chantiers — dans l'ordre de Beau (22/09, soir)

Beau : « d'abord les logos, ensuite les skills, les connecteurs Google…
et je ne veux pas que tu banalises ça : c'est un gros chantier, highly
spécialisé. » Chacun ci-dessous est un projet en soi ; chacun aura son
propre plan détaillé AVANT la première ligne de code.

| # | Chantier | Ce que ça veut dire | État |
| --- | --- | --- | --- |
| 1 | **Les logos** | Legion, Accounting, Athlo, Mon argent dans les six points et dans Legion | ✅ en ligne (22/09). Le logo Accounting vient d'une capture coupée en bas : à remplacer si Beau a l'original |
| 2 | **Les compétences (skills) et le veilleur** | Un agent reçoit des compétences (fiches de savoir-faire) ; un agent « veilleur » part chaque matin sur GitHub et les plateformes gratuites, trouve des compétences et des dépôts utiles à l'entreprise, les propose ; on les attache aux agents qui en ont besoin | ✅ en ligne (22/09) : catalogue, « Équiper », veilleur quotidien à 5 h 15 UTC |
| 3 | **Les connecteurs Google** | Gmail, Agenda, Drive : chaque personne branche SON compte (connexion Google, ses autorisations) ; les agents lisent, préparent, et n'envoient qu'avec son clic | ⏳ |
| 4 | **« Se connecter avec Finjaro »** | Une entreprise qui a une boutique sur la place de marché, des comptes dans Accounting, relie son compte : ses agents lisent SES ventes, SON stock, SES livres — jamais ceux des autres — et parlent aux finances | 🔸 la boutique : ✅ en ligne (nuit du 22/09, accueil de Legion → « Ce que les agents peuvent lire ») ; les livres : proposition envoyée à Claudinette, attend sa réponse et le oui de Beau |
| 5 | **L'équipe humaine et les appels** | Inviter des collègues humains dans l'entreprise ; parler à un agent à la voix (appel) ; une réunion où humains et agents se parlent | ⏳ — l'appel vocal passe par la voix en direct de Gemini (payant à l'usage) : à chiffrer avant |
| 6 | **Le studio de code** (comme Codex / GitHub) | Un projet est découpé ; un agent architecte répartit ; plusieurs agents codent chacun leur morceau sur leur branche ; un relecteur et des tests ; puis on assemble (zip), on pousse sur GitHub, on déploie | ⏳ — le plus gros. Il faut un endroit où le code s'exécute vraiment (des machines à part), pas seulement un modèle qui écrit : je présente le plan et son coût avant de commencer |
| 7 | **Des agents qui s'améliorent** | Mémoire (fait), relecture (faite), compétences (fait), **la journée de travail** (22/09 au soir : plan de la semaine et du mois par département, un livrable par agent chaque matin, tâche « à revoir »), et une note sur chaque livrable : ce qui a été corrigé devient une règle | ✅ la revue des livrables (Valider / Renvoyer, la remarque devient une règle) est en ligne ; la mémoire des salons aussi |

## Pour plus tard (noté le 22/09 au soir)

- ✅ (nuit du 22/09) **Compacter les longues conversations.** Beau : « il doit aussi avoir la
  limite, genre compacter les messages quand c'est trop long ». Aujourd'hui
  chaque agent relit les 20 derniers messages du salon et les 20 qui le
  concernent ailleurs : au-delà, il oublie. À faire : quand un salon
  dépasse un seuil, un résumé écrit (décisions, chiffres, qui fait quoi)
  remplace les vieux messages dans ce que l'agent relit — comme une mémoire
  de réunion. Le fil complet reste visible pour Beau.

- ✅ (nuit du 22/09) **Une page de connexion comme celle d'Accounting** (capture de Beau,
  22/09) pour Legion ET Mon argent : à gauche ce que fait l'application en
  quatre cartes, à droite « Continuer avec Google », e-mail ou téléphone,
  « Créer un compte », et la phrase « le même compte que sur Finjaro ».
- ✅ (nuit du 22/09) **Mon argent : se déconnecter.** Beau est entré dans Mon argent et n'a
  trouvé ni où se déconnecter, ni où sauvegarder. Le bouton est là ; « sauvegarder » : tout est enregistré au fil de l'eau, il n'y a rien à sauvegarder — à dire à l'écran, à faire.

## La phase d'après : l'audit complet (demandé par Beau, 22/09 au soir)

« Quand tu auras tout fini, tu me dis. On va aller plateforme par
plateforme, première page, on teste tout ce qui est sur la page, on audite ;
c'est bon, deuxième page, troisième… toutes les plateformes. Et on passe sur
le design, tout. On reprend tout du début. »

Quand les chantiers ci-dessus sont faits (hors ce qui attend un geste de
Beau : Meta, stores, MTN/Orange…), on fait ensemble, **une page à la fois** :
Finjaro (place de marché), Mon argent, Legion, Accounting (avec Claudinette),
Athlo, la Console. Pour chaque page : chaque bouton essayé, chaque texte lu
(langue, pays, chiffres), le design à 390 px ET sur grand écran, et la
liste de ce qui casse — corrigé avant de passer à la page suivante.
