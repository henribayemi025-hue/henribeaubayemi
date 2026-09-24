# 36 — « 7 GitHub Repos That Make AI Feel Very Different » (page Notion)

- **Source** : https://app.notion.com/p/7-GitHub-Repos-That-Make-AI-Feel-Very-Different-3e3a0746d2378038bfbfc61381c56ed6 (lien reçu nettoyé de son paramètre de suivi)
- **Type** : page Notion (liste commentée de 7 dépôts GitHub), en anglais ; elle contient aussi une sous-page « 5 GitHub Repos for AI Agents », non lue ici
- **Accès** : lue par l'interface publique de Notion (105 blocs). Les 7 dépôts sont vérifiés à la source (fichier LICENSE lu pour chacun). Les README de MiroFish et d'Atlas sont lus en partie. Rien n'a été installé.
- **Licence / droits** : la page n'a pas de licence : on reprend les idées, pas le texte. Les dépôts : voir le tableau.
- **Reçu de Beau le** : 25/09/2026 (vers 1 h 20)

## Ce que c'est
Sept outils présentés comme « l'IA autrement ». Deux touchent directement ce qu'on construit :
- **MiroFish** : simuler un monde où beaucoup d'agents interagissent ;
- **Atlas** : plusieurs agents qui codent sur le même projet.

| # | Dépôt | Ce que c'est | Licence (lue) | Pour nous |
|---|---|---|---|---|
| 1 | ruvnet/RuView | Détecter une présence ou un mouvement à partir du Wi-Fi (capteurs dédiés) | MIT | Hors sujet (matériel, vie privée) |
| 2 | MG1937/ASC | Décompiler une application Android, pour agents et chercheurs | Apache-2.0 | Seulement pour auditer NOS applications ; jamais celles des autres |
| 3 | debpalash/VoiceStudio | Studio vocal local : clonage de voix, doublage, transcription, livres audio | AGPL-3.0 | Piste pour les voix des agents ; AGPL = pas de reprise de code ; cloner une voix exige l'accord écrit de la personne |
| 4 | 666ghj/MiroFish | Moteur de simulation : des centaines d'agents avec des personnages, à partir d'un document (actualité, rapport, roman), puis un rapport de « prédiction » | AGPL-3.0 | Idée pour l'immeuble vivant et les réunions « et si ? » ; ses « prédictions » ne sont pas des faits |
| 5 | alphaXiv/OpenResearch | Transforme un agent qui code (Claude Code, Codex…) en chercheur : lectures, hypothèses, expériences, résultats | MIT | Méthode pour Vigie, Forge et Alpha (hypothèse → essai → résultat) |
| 6 | pacifio/atlas | « Git pour les agents » : chaque changement relié à la séance qui l'a produit (demande, outils, raisonnement), mémoire partagée entre plusieurs agents sur un même projet | Apache-2.0 | **Très proche de ce que Beau demande pour l'atelier** : plusieurs agents, une mémoire commune, qui a fait quoi et pourquoi |
| 7 | PI (probablement badlogic/pi-mono : le lien n'était pas dans la page) | Boîte à outils d'agents : une seule API pour tous les modèles, un moteur d'agent, un agent de code en ligne de commande | MIT (pi-mono) | À comparer à notre moteur (relais entre modèles) |

## Ce qui est vraiment utile pour Finjaro et Léo
- **Atlas** montre la suite logique de notre atelier :
  - chaque modification est reliée à la séance qui l'a produite. C'est notre « Revoir la séance », qu'on garderait pour toujours ;
  - plusieurs agents partagent une **mémoire commune** : plan, décisions, échecs. Quand Rigo relit Ada, il sait ce qu'elle a essayé ;
  - les notes du projet (comme notre CLAUDE.md) sont données à chaque agent.
- **MiroFish** : des personnages d'agents qui interagissent dans un monde simulé. Ce serait utile pour une réunion « et si ? » (tester une idée de prix auprès de 20 « acheteuses » simulées). À une condition : dire clairement que c'est une **simulation**, jamais une mesure.
- **OpenResearch** : la boucle hypothèse → expérience → résultat, c'est exactement le « carnet des expériences » (point 28 des agents autonomes).

## Pour quels agents de Léo
- **Claude** et **Ada** : Atlas, pour l'équipe dans l'atelier (mémoire commune, séances reliées aux modifications).
- **Orchestre** : la mémoire partagée entre agents.
- **Alpha, Vigie, Forge** : la boucle de recherche d'OpenResearch.
- **Rigo** : se méfier des « prédictions » de simulation.

## Compétences à tirer (pour Mentor)
**Tenir la mémoire commune d'un chantier** — Ada Nkemba, Claude, Rigo, Orchestre
Quand plusieurs agents travaillent sur le même projet, chacun écrit en fin de passage, dans le carnet du chantier : ce qu'il a changé (fichiers), pourquoi, ce qu'il a essayé et abandonné, ce qui reste. Avant de commencer, chacun lit le carnet. On ne refait pas un essai déjà raté sans dire ce qui a changé. Piège : un résumé écrit par l'agent lui-même n'est pas une preuve ; on renvoie au test ou à la séance.
*Source : inspiré d'Atlas (pacifio/atlas, Apache-2.0), réécrit avec nos mots.*

**Simulation n'est pas mesure** — Rigo, Alpha, Forge
Un résultat obtenu en faisant parler des agents simulés (acheteuses imaginaires, public imaginé) est une hypothèse, jamais un chiffre. On l'écrit « simulé », on dit avec quels personnages, et on propose comment le vérifier en vrai. On ne le met jamais dans un rapport à côté des chiffres mesurés sans cette mention.
*Source : inspiré de MiroFish (AGPL-3.0, idée seulement).*

## Limites, risques, prudence
- VoiceStudio et MiroFish sont en **AGPL** : on s'en inspire, on ne copie pas leur code.
- ASC (décompiler une application) ne sert qu'à auditer nos propres applications.
- RuView (détection de présence par le Wi-Fi) touche à la vie privée : hors sujet.
- Les « prédictions » de MiroFish ne sont pas vérifiées.

## Verdict
**Retenu** : Atlas (pour l'équipe dans l'atelier) et la boucle d'OpenResearch. **En réserve** : MiroFish (réunions « et si ? », avec la mention « simulation »), VoiceStudio (voix, si Beau le veut, avec accord). **Mis de côté** : RuView et ASC (hors de notre besoin).
