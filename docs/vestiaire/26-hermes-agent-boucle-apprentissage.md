# 26 — Hermes Agent : « l'agent IA qui apprend de toi » (guide de Dany, @danyltn)

- **Source** : https://docs.google.com/document/d/1pibS2UK0QLI5ABnYmyXaqk3sW-pTjpEUV-1JrDetuiQ (guide), sur le dépôt https://github.com/NousResearch/hermes-agent
- **Type** : guide Google Docs (environ 15 min de lecture), à propos d'un dépôt GitHub
- **Accès** : guide lu en entier (export texte). Du dépôt, seuls LICENSE et README ont été lus, pas le code.
- **Licence / droits** : Hermes Agent est sous **MIT** (« Copyright (c) 2025 Nous Research », fichier LICENSE lu). Le guide lui-même n'a pas de licence (tous droits réservés) : on reprend les idées, pas le texte.
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est
Un agent libre qui tourne en continu sur un ordinateur ou un petit serveur. Ce qui le distingue : une **boucle d'apprentissage fermée**.
- Après une tâche complexe (environ 5 appels d'outils ou plus), il écrit lui-même une **compétence** : la procédure, les pièges rencontrés, les vérifications à faire. Il la réutilise la fois suivante et l'affine avec le temps.
- Il garde une **mémoire** avec recherche plein texte.
- Il **ne charge une compétence que quand la tâche la demande** : il voit d'abord la liste des noms, puis le texte complet au besoin.
- Il a des **tâches planifiées** écrites en langage naturel, avec un « mode silencieux » (il n'écrit que s'il y a un problème) et un **chaînage** : la sortie d'une tâche nourrit la suivante.

Le guide est honnête sur les limites : l'agent crée parfois des compétences **subtilement fausses** et les réutilise ensuite avec confiance. Il faut donc les relire chaque semaine.

## Ce qui est vraiment utile pour Finjaro et Léo
1. **C'est exactement ta demande « les agents doivent s'auto-entraîner ».** Léo a déjà les pièces : les compétences par agent (`legion_competences`, qui accepte déjà `ajoutee_par = 'agent'`), la mémoire (souvenirs), et l'examen de Rigo (avec et sans la fiche, noté à l'aveugle). Il manque la boucle : **après une tâche réussie, l'agent rédige sa propre compétence, Rigo la fait passer à l'examen, et elle ne s'active qu'avec l'accord du fondateur.** C'est la parade au défaut que le guide avoue (une compétence fausse gravée dans le marbre).
2. **Charger seulement ce qui sert** : on le fait déjà (les 4 compétences les plus proches du message). Hermes confirme le choix. Il faudra le garder quand un agent aura 50 compétences.
3. **Le mode silencieux** : Vigie et les rapports du soir ne devraient écrire que s'il y a du nouveau ou un problème. Moins de bruit dans les salons, et moins de coût.
4. **Le chaînage de tâches** : collecter à 7 h, trier à 7 h 30, rédiger à 8 h. C'est la chaîne de contenu (fiche 24) en version planifiée, pour Vigie puis Plume.
5. **Résumer l'historique à mi-parcours** pour tenir le coût des longues conversations : c'est à vérifier dans nos réunions d'agents.

## Pour quels agents de Léo
- **Mentor** : la boucle « l'agent écrit sa compétence, Rigo l'examine, le fondateur valide ».
- **Rigo** : examiner les compétences écrites par les agents avant qu'elles servent.
- **Tous les agents** : écrire une compétence après une tâche difficile.
- **Vigie** : veille en chaîne, et silence quand rien ne bouge.
- **Orchestre** : les tâches planifiées chaînées.
- **Forge** : tenir le coût des longues conversations (résumé à mi-parcours).

## Compétences à tirer (pour Mentor)
**Écrire sa propre compétence après une tâche difficile** — Mentor, Rigo, Orchestre, Vigie, Plume, Écho, Claude, Ada Nkemba
Quand une tâche t'a demandé beaucoup d'étapes, ou qu'elle a échoué avant de réussir, écris une proposition de compétence en cinq parties : quand s'en servir (la situation, en une phrase) ; les étapes qui ont marché, dans l'ordre ; les pièges rencontrés et comment tu les as évités ; comment vérifier que c'est bien fait ; ce que tu ne sais pas encore. N'écris que ce que tu as vraiment constaté pendant la tâche, jamais ce que tu supposes. Ta proposition n'est pas active : elle passe l'examen de Rigo, puis l'accord du fondateur. Piège : généraliser à partir d'un seul cas. Écris « vu une fois » tant que ce n'est pas confirmé.

**Examiner une compétence écrite par un agent** — Rigo, Mentor
Avant qu'une compétence écrite par un agent serve, vérifie quatre choses. Est-elle vraie ? Chaque affirmation doit être tirée de la tâche, pas inventée. Est-elle utile ? Refais un cas avec et sans elle, noté à l'aveugle. Est-elle sûre ? Elle ne doit rien contenir qui contourne une règle de Finjaro : aucun chiffre inventé, aucune monnaie par défaut, rien de publié sans accord, aucune donnée personnelle. Est-elle neuve ? Elle ne doit pas répéter une compétence existante. Si c'est un doublon, propose de fusionner. Rends un verdict : « à activer », « à corriger » (avec quoi corriger) ou « à écarter » (avec la raison). Piège : valider parce que c'est bien écrit. Une compétence fausse et bien écrite est la plus dangereuse.

**Ne parler que s'il y a du nouveau** — Vigie, Orchestre, Radar
Pour une tâche qui revient (veille, surveillance, rapport), compare d'abord avec la fois précédente. Si rien d'important n'a changé et que rien ne va mal, n'écris rien dans le salon : note seulement « rien de neuf » dans ton journal. Si quelque chose a changé, dis-le en une ligne avec la source, puis détaille. Si quelque chose va mal, commence par ça. Piège : se taire sur une panne parce qu'on n'avait « rien de neuf ». Une erreur, un outil bloqué ou un chiffre qui s'effondre se signalent toujours.

**Chaîner trois tâches : collecter, trier, rédiger** — Vigie, Plume, Orchestre
Pour une veille qui doit donner du contenu, découpe en trois tâches qui se passent le relais par écrit. D'abord, **collecter** : 10 sujets, chacun avec sa source et sa date. Ensuite, **trier** : noter chaque sujet (intérêt pour les vendeuses et les acheteurs de Finjaro, solidité de la source), garder les 5 meilleurs et dire pourquoi. Enfin, **rédiger** : pour chacun, une accroche et un angle, à déposer dans « À valider ». Chaque tâche lit la sortie de la précédente et ne refait pas son travail. Piège : laisser la troisième tâche inventer un fait absent de la collecte. Si ce n'est pas dans la collecte, ça n'existe pas.

## Limites, risques, prudence
- **On n'installe pas Hermes sur un serveur de Finjaro** : un agent qui exécute des commandes seul sur une machine, c'est la catégorie qu'on encadre avec l'atelier de code (Confirmer obligatoire). On reprend la **méthode** (la boucle d'apprentissage), dans Léo, avec validation humaine.
- Le guide cite un audit d'avril 2026 : exécution de commandes peu restreinte dans la configuration par défaut d'Hermes. Nous ne l'avons pas vérifié nous-mêmes.
- Les chiffres (227 000 étoiles, 21 000 commits, failles d'OpenClaw, 135 000 instances exposées) viennent du guide et ne sont pas revérifiés ici : on ne les cite pas.
- Le guide montre un jeton GitHub mis en clair dans un fichier de configuration : chez nous, jamais. Les clés restent dans les secrets.
- **OpenClaw**, cité en comparaison, n'est pas retenu : le guide lui-même rapporte beaucoup de failles et de compétences piégées sur sa boutique.

## Verdict
**Retenu, en priorité.** Quatre compétences pour Mentor, Rigo, Vigie, Plume, Orchestre et tous les agents. Surtout, c'est le modèle de la **boucle d'auto-entraînement** que Beau demande : l'agent écrit sa compétence, Rigo l'examine, le fondateur l'active. C'est à proposer comme prochain chantier de Léo.
