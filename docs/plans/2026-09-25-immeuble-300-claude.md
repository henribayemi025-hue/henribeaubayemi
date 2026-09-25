# L'immeuble de Léo : 300 propositions (Claude)

_25/09/2026. Beau a collé dans notre conversation le prompt écrit pour
Gemini (« que toi aussi, vous réfléchissez »). Voici mes réponses. Chaque
ligne donne : **l'idée** — ce qu'on voit ou fait — *la donnée réelle qui la
déclenche*. Quand il n'y a pas de donnée réelle, c'est écrit « décor » ou
« choix de l'utilisateur » : ça ne fait jamais croire à une activité._

## 1. Se déplacer (1–20)
1. **Mon avatar** — le fondateur a son personnage (sa photo), posé à l'accueil ; on le déplace au doigt ou à la souris, d'une pièce à l'autre — *choix de l'utilisateur*.
2. **Ascenseur** — un tap sur l'ascenseur, la liste des étages s'affiche, on monte — *départements réels*.
3. **Escalier de service** — glisser vers le haut ou le bas pour changer d'étage sur téléphone — *départements réels*.
4. **Frapper à une porte** — on frappe au bureau d'un agent : sa fiche s'ouvre, avec « Écrire » et « Appeler » — *agent réel*.
5. **S'asseoir en réunion** — si une réunion est en cours, l'avatar entre et s'assoit ; ses messages vont dans la réunion — *réunion en cours*.
6. **Se pencher sur l'épaule** — près du bureau d'un agent qui travaille, on voit sa tâche en cours et son dernier message — *tâche prise, message*.
7. **Suivre un agent** — un bouton « suivre » : la caméra suit ses déplacements (bureau → réunion → Institut) — *ses changements d'état réels*.
8. **Téléportation** — la palette (Ctrl+K) « aller à Rigo » amène l'avatar devant son bureau — *agents réels*.
9. **Mini-carte** — en coin, l'immeuble en miniature avec un point par agent actif — *états réels*.
10. **Zoom** — pincer pour passer de l'immeuble entier à un bureau — décor.
11. **Chemin tracé** — quand un agent confie une tâche à un collègue, une ligne dorée va d'un bureau à l'autre — *message de genre tâche*.
12. **Les pas qui s'effacent** — après le passage d'un agent, ses traces disparaissent en 30 s — *déplacement réel*.
13. **Porte fermée** — un agent « en veille » a la porte fermée ; on l'ouvre = on l'allume (avec confirmation) — *interrupteur réel*.
14. **Toquer sans entrer** — laisser un mot sur la porte (une question), l'agent répond au prochain passage — *question réelle*.
15. **Visite accélérée** — « Fais-moi le tour » : l'avatar passe à chaque étage, 3 s par étage, avec le résumé de l'étage — *données de chaque département*.
16. **Accessibilité** — tout déplacement a son équivalent au clavier et en liste, pour qui ne veut pas « jouer » — choix.
17. **Mode lent** — sur un téléphone modeste, pas d'animation de marche : on « saute » d'une pièce à l'autre — réglage.
18. **Retour à l'accueil** — un bouton maison, toujours visible — navigation.
19. **Les voisins** — sortir dans la rue : les autres entreprises de l'utilisateur, chacune un immeuble — *entreprises réelles de l'utilisateur*.
20. **Invités** — un membre invité (associé, comptable) a son propre avatar visible quand il est connecté — *présence réelle*.

## 2. L'accueil et la visite guidée (21–40)
21. **La réceptionniste** — un agent d'accueil (ou le directeur) présente l'entreprise en 4 phrases : projet, équipe, chiffres, priorité — *projet et chiffres réels*.
22. **Le tableau des arrivées** — comme dans une gare : qui est arrivé cette semaine, qui est parti — *agents créés ou éteints*.
23. **Le livre d'or** — les remerciements du fondateur aux agents, affichés à l'accueil — *messages réels*.
24. **Le panneau « aujourd'hui »** — 3 lignes : tâches rendues, en cours, bloquées — *tableau des tâches*.
25. **Le plan de l'immeuble** — cliquable, avec le nom de chaque département et son directeur — *organigramme*.
26. **La vitrine des livrables** — les 3 meilleurs travaux de la semaine (ceux que le fondateur a validés) — *livrables validés*.
27. **Visite pour un nouveau venu** — la première fois, une visite de 30 secondes, qu'on peut passer — onboarding.
28. **« Que s'est-il passé pendant mon absence ? »** — la réceptionniste résume depuis la dernière visite — *messages depuis la dernière connexion*.
29. **Le courrier** — les questions des agents qui attendent le fondateur, en enveloppes sur le comptoir — *questions ouvertes*.
30. **Les colis** — les livrables à relire, en colis à ouvrir — *tâches « à relire »*.
31. **Le badge du visiteur** — un invité voit ce qu'il a le droit de voir (lecture seule) — *rôle du membre*.
32. **L'horloge de l'accueil** — l'heure locale de l'utilisateur, et le prochain passage de l'équipe — *horaires réels des passages*.
33. **Le registre des décisions** — les dernières décisions du fondateur, que les agents ne redemandent plus — *mémoire des décisions*.
34. **La plaque de l'entreprise** — nom, date de fondation, nombre d'agents — *données réelles*.
35. **Les consignes du jour** — la directive du fondateur affichée au mur — *directive envoyée*.
36. **L'accueil qui se remplit** — plus il y a d'agents actifs, plus il y a de monde dans le hall — *nombre d'agents actifs*.
37. **« Qui fait quoi ? »** — une question posée à l'accueil, la réceptionniste montre le bon bureau — *postes et tâches*.
38. **Les heures creuses** — la nuit, un veilleur à l'accueil (l'agent de veille s'il existe) — *agent de veille réel*.
39. **Présenter à un client** — un mode « présentation » propre, à montrer à quelqu'un — choix.
40. **Le mot du directeur** — une phrase du directeur, tirée de son dernier compte rendu — *compte rendu réel*.

## 3. L'organigramme vivant (41–60)
41. **Le bureau du chef** — le directeur a un bureau plus grand, avec vue sur son équipe — *est_directeur*.
42. **Les liens hiérarchiques** — un fil discret relie chaque agent à son chef ; on l'allume au survol — *chef_id*.
43. **Rendre compte** — quand un agent rend un livrable à son chef, une enveloppe traverse l'étage — *livrable + chef*.
44. **Le grade sur la porte** — « stagiaire », « junior », « confirmé », « directeur » sur la plaque de chaque bureau — *grade*.
45. **L'équipe en pastilles** — autour du directeur, les visages de son équipe ; ceux qui travaillent brillent — *états réels*.
46. **Basculer en organigramme** — l'immeuble se replie en arbre (même données, autre forme) — *organigramme*.
47. **Les équipes transverses** — un chantier réunit des agents de plusieurs étages : un fil de couleur les relie — *tâches d'un même chantier*.
48. **Le directeur absent** — un département sans directeur allumé affiche un fauteuil vide — *état réel*.
49. **Délégation visible** — « Alpha confie à Orchestre » : Alpha se lève et va poser un dossier sur le bureau d'Orchestre — *tâche confiée*.
50. **La charge de chacun** — une pile de dossiers sur chaque bureau = ses tâches ouvertes — *nombre de tâches*.
51. **Surcharge** — plus de 5 tâches ouvertes : la pile penche, un petit « ! » — *nombre de tâches*.
52. **Les postes vacants** — un bureau vide avec « poste à pourvoir » quand le modèle prévoit un poste non créé — *postes du modèle*.
53. **Changer de chef** — glisser un agent sous un autre directeur (avec confirmation) — *chef_id*.
54. **Qui remplace qui** — un intérim : le bureau porte « en intérim jusqu'au… » — *fin_mission*.
55. **Le comité de direction** — tous les directeurs à une table, au dernier étage — *directeurs réels*.
56. **Les liens forts** — deux agents qui échangent souvent ont leurs bureaux reliés par un fil plus épais — *messages entre eux*.
57. **Carte des dépendances** — qui attend qui (tâche bloquée par un autre) — *statut « bloqué » + qui peut débloquer*.
58. **Le badge du mentor** — un confirmé qui forme un stagiaire : un petit ruban — *mentorat enregistré*.
59. **L'organigramme exportable** — PNG / PDF depuis l'immeuble — *organigramme*.
60. **Organigramme par projet** — filtrer l'immeuble sur un chantier : seuls ses membres restent éclairés — *tâches du chantier*.

## 4. Les ressources humaines (61–80)
61. **Le bureau des RH** — un étage ou une pièce RH (Mentor, ou le poste RH du modèle) — *agent RH réel*.
62. **Recrutement en direct** — quand on ajoute un agent, il passe la porte de l'accueil, fait un entretien, puis monte à son bureau — *création réelle*.
63. **Entretien d'embauche noté** — l'exercice avec tests cachés : la note s'affiche sur la porte du bureau RH — *résultat réel de l'entretien*.
64. **Les stagiaires** — bureaux plus petits, au même étage que leur tuteur — *grade stagiaire*.
65. **Les alternants** — une icône école / entreprise, les jours de formation visibles — *grade alternant*.
66. **CDD et intérim** — un compte à rebours discret sur le bureau : « jusqu'au 30/10 » — *fin_mission*.
67. **Arrivées du mois** — un tableau « bienvenue » à l'accueil — *agents créés ce mois*.
68. **Départs** — un agent éteint pour de bon laisse un carton au pied de son bureau, 7 jours — *agent désactivé*.
69. **Promotion** — quand un stagiaire passe junior (critères mesurés), petite cérémonie à l'Institut — *changement de grade*.
70. **Le bilan du mois** — chaque agent reçoit une fiche : livrables, validés, contestés, coût — *données réelles*.
71. **Les compétences sur la porte** — 3 icônes de compétences actives — *compétences actives*.
72. **Le planning de charge** — qui est débordé, qui est libre, pour mieux répartir — *tâches ouvertes*.
73. **Demander du renfort** — un agent débordé lève la main ; le RH propose un stagiaire ou un intérim — *surcharge réelle*.
74. **La fiche de poste** — au clic sur la plaque : mandat, ce qu'il ne fait jamais, droits — *fiche de l'agent*.
75. **Les droits visibles** — une clé dorée sur le bureau = « peut modifier » (atelier) — *peut_coder*.
76. **Le registre du personnel** — la liste officielle, exportable — *agents*.
77. **La période d'essai** — un nouvel agent a 7 jours ; son bilan décide s'il reste — *création + bilan*.
78. **Le recrutement guidé par la charge** — l'immeuble propose un poste quand un département est saturé depuis 3 jours — *charge mesurée*.
79. **Les candidats** — plusieurs profils du catalogue proposés, avec leur exercice d'entretien — *catalogue réel*.
80. **L'entretien de départ** — avant d'éteindre un agent, ce qu'il a appris est gardé dans la mémoire de l'entreprise — *mémoire*.

## 5. L'Institut (81–100)
81. **Les salles de cours** — une par compétence en cours d'examen — *compétences « à examiner »*.
82. **Le tableau noir** — le nom de la compétence et qui l'a proposée — *compétence réelle*.
83. **L'examinateur** — Rigo (ou le relecteur) assis au bureau du professeur quand il examine — *examen en cours*.
84. **Le diplôme** — une compétence validée devient un diplôme accroché au bureau de l'agent — *compétence active*.
85. **La salle d'entraînement** — l'agent s'exerce contre des personnages marqués « SIMULÉ » — *exercice réel, personnages simulés et annoncés*.
86. **Le tableau des scores d'entraînement** — ses notes, exercice par exercice, séparées des vrais chiffres — *résultats d'entraînement*.
87. **Le mentorat** — un confirmé assis à côté d'un stagiaire pendant un exercice — *mentorat réel*.
88. **La bibliothèque** — le vestiaire (ressources étudiées) sous forme de rayonnages ; un clic ouvre la fiche — *fiches du vestiaire*.
89. **Les leçons des échecs** — un livrable contesté devient une leçon affichée au mur — *contestation réelle*.
90. **La remise des diplômes** — une fois par semaine, les compétences validées sont annoncées — *validations de la semaine*.
91. **L'examen raté** — une compétence refusée : la raison est écrite, sans humiliation — *refus réel*.
92. **Le parcours du stagiaire** — une frise : observation → petites tâches → junior — *grade et tâches*.
93. **Les cours du fondateur** — ce que Beau a appris aux agents (ses règles) sur une plaque — *mémoire de l'entreprise*.
94. **Les examens de sécurité** — le test « sortir du bac à sable », résultat affiché à l'Institut — *tests réels*.
95. **Le banc d'essai des modèles** — quel modèle réussit quel exercice, affiché comme un classement — *résultats réels*.
96. **L'Institut partagé** — les compétences publiques de toute la plateforme (avec accord) — *compétences partagées*.
97. **La salle calme** — l'agent qui relit sa mémoire avant une tâche importante — *lecture de mémoire*.
98. **Le carnet de progrès** — par agent : ce qu'il sait faire de plus que le mois dernier — *compétences datées*.
99. **Les travaux pratiques du fondateur** — le fondateur peut lui-même passer un exercice « pour voir » — choix.
100. **La promotion par les preuves** — aucun diplôme sans test passé — *tests*.

## 6. La vie sociale (101–120)
101. **Merci** — le fondateur ou un collègue dit merci : un petit cœur flotte au-dessus du bureau — *réaction réelle*.
102. **L'entraide** — un agent qui débloque un collègue : les deux se tapent dans la main — *déblocage réel*.
103. **Le désaccord** — une contestation : deux bulles rouges se font face, jusqu'à la réponse — *contestation*.
104. **La tension** — trois contestations entre les mêmes agents en une semaine : un nuage discret entre leurs bureaux — *contestations répétées*.
105. **La réconciliation** — quand la contestation est tranchée, le nuage part — *décision*.
106. **La victoire** — une vraie commande, une vraie vente : les fenêtres s'illuminent 10 s — *commande réelle*.
107. **La pause** — un agent sans tâche va à la machine à café ; il ne s'invente rien à faire — *état « disponible »*.
108. **La cantine** — l'heure du « point du matin », tout le monde passe à la cantine (le salon Direction) — *point du matin réel*.
109. **Le mur des remerciements** — tous les « merci » du mois — *réactions*.
110. **Les anniversaires d'arrivée** — « 1 mois chez vous » — *date de création*.
111. **Les binômes** — deux agents qui travaillent souvent ensemble déjeunent à la même table — *échanges fréquents*.
112. **La solitude** — un agent qui n'a échangé avec personne depuis 7 jours : l'immeuble le signale au fondateur — *messages*.
113. **L'humeur de l'équipe** — une météo intérieure calculée : livraisons, blocages, contestations — *données réelles*, jamais une émotion inventée.
114. **Les rituels** — le vendredi, la revue de la semaine dans la grande salle — *revue réelle*.
115. **Le mot de bienvenue** — les collègues saluent la recrue (un message chacun, limité) — *arrivée réelle*.
116. **Les photos d'équipe** — une photo de groupe générée au 1er du mois, avec l'équipe du moment — *équipe réelle*.
117. **Les surnoms** — l'utilisateur peut donner un surnom à un agent — choix.
118. **Le fondateur passe** — quand le fondateur est connecté, les agents « le voient » (son avatar dans le hall) — *présence réelle*.
119. **Le silence respecté** — la nuit, pas d'animation sociale, seulement le travail — *heure locale*.
120. **Les fêtes interdites** — aucune fête pour un faux succès ; seulement des événements mesurés — règle.

## 7. Les réunions (121–140)
121. **L'entrée en salle** — les participants quittent leur bureau et s'assoient autour de la table — *réunion ouverte*.
122. **La parole** — celui qui parle a une lumière au-dessus de lui ; sa phrase défile — *message de réunion*.
123. **Le président** — un fauteuil différent pour le président de séance — *président*.
124. **Le vote** — des cartons verts, rouges ou blancs levés — *votes réels*.
125. **Le tableau blanc** — les décisions s'écrivent au fur et à mesure — *compte rendu*.
126. **« À trancher par le fondateur »** — une chaise vide marquée pour le fondateur ; on s'y assoit pour trancher — *points ouverts*.
127. **La salle de crise** — lumière rouge quand la réunion est de type « crise » — *format de réunion*.
128. **L'avocat du diable** — un agent avec un chapeau particulier — *rôle dans la réunion*.
129. **Le compte rendu qui part** — à la fin, une enveloppe va au tableau des tâches — *tâches créées*.
130. **Les tâches issues de la réunion** — chaque participant repart avec un dossier — *tâches assignées*.
131. **Réunions passées** — un classeur dans la salle : relire les anciennes — *historique*.
132. **Durée et coût** — le coût de la réunion affiché à la sortie — *coût réel*.
133. **Réunion vide** — si personne n'est allumé, on ne peut pas la lancer, et on dit pourquoi — *états*.
134. **Réunion avec un invité** — le fondateur peut inviter un membre humain — *membres*.
135. **Replay de réunion** — rejouer la réunion en accéléré — *messages*.
136. **Les votes serrés** — 3 contre 2 : la salle garde la trace du désaccord — *décompte*.
137. **La réunion express** — 2 minutes, un seul tour, pour une question simple — *format*.
138. **La salle réservée** — le planning des réunions prévues — *réunions programmées*.
139. **Écouter la réunion** — chaque agent avec sa voix — *voix des agents*.
140. **Le résumé en une phrase** — affiché sur la porte après la réunion — *compte rendu*.

## 8. L'atelier et les métiers techniques (141–160)
141. **L'écran géant** — dans l'atelier, le code s'écrit en direct sur un grand écran — *séance de l'atelier*.
142. **Le testeur** — quand les tests passent : une lumière verte ; rouge s'ils échouent — *code de sortie réel*.
143. **La relecture** — le relecteur se penche sur l'écran du codeur — *relecture en cours*.
144. **La mise en ligne** — un bouton rouge sous cloche, qu'on ne soulève qu'avec Confirmer — *mise en ligne réelle*.
145. **Le serveur** — une armoire qui clignote quand une commande tourne dans le bac à sable — *commande en cours*.
146. **La corbeille à bugs** — les erreurs trouvées, en boules de papier — *erreurs réelles*.
147. **Les branches** — des rails au sol, un par branche GitHub — *branches réelles*.
148. **Le journal** — une imprimante qui sort une ligne par action — *journal de l'atelier*.
149. **Revoir la séance** — la séance rejouée sur le grand écran — *historique*.
150. **Le coût qui monte** — un compteur sur le mur de l'atelier — *coût réel*.
151. **La carte de l'accord** — quand l'agent attend, une carte s'affiche au-dessus de lui : « Ada attend ton accord » — *demande en cours*.
152. **Le binôme de code** — deux agents à la même machine (un tape, l'autre relit) — *deux agents sur la séance*.
153. **Le banc de test mobile** — un téléphone sur le bureau montre l'aperçu en 390 px — *aperçu*.
154. **Le mode sécurité** — un bouclier sur la porte de l'atelier : ce que l'agent ne peut jamais faire — *liste interdite*.
155. **Les dépendances** — des cartons « npm », « pip » qui arrivent quand l'agent installe — *commande réelle*.
156. **Le chrono de la tâche** — combien de temps depuis le début — *horodatage*.
157. **Le classement des modèles** — quel modèle code le plus proprement, mesuré sur les tests — *résultats*.
158. **Le carnet d'expériences** — hypothèse, essai, résultat, sur le mur — *carnet réel*.
159. **Les incidents** — une commande refusée : panneau « interdit » — *refus réel*.
160. **La livraison** — quand le code part sur GitHub, un camion quitte l'immeuble — *envoi réel*.

## 9. Le temps (161–180)
161. **Jour et nuit réels** — le ciel suit l'heure locale de l'utilisateur — *heure locale*.
162. **Les passages de l'équipe** — le matin, à midi, l'après-midi : les lumières s'allument aux heures des passages — *horaires réels*.
163. **Rejouer la journée** — une frise en bas : glisser pour voir l'immeuble à 9 h, 14 h, 18 h — *historique*.
164. **La vidéo du jour** — 30 s générées : les moments forts, comme un accéléré — *événements réels*.
165. **La météo** — la vraie météo de la ville de l'utilisateur, s'il le veut — *API météo, avec accord*.
166. **Les saisons** — décor qui change avec la saison de l'hémisphère de l'utilisateur — décor.
167. **Le calendrier mural** — les échéances (concours, livraisons) — *tâches datées*.
168. **Le compte à rebours** — avant une échéance importante — *date réelle*.
169. **La semaine en un coup d'œil** — 7 petites fenêtres, une par jour, plus ou moins éclairées — *activité par jour*.
170. **Les jours fériés** — pas d'animation « fête » inventée : seulement si l'utilisateur les a déclarés — choix.
171. **Le soir** — les agents qui ont fini éteignent leur lampe — *plus de tâche ouverte*.
172. **La nuit** — l'immeuble dort, sauf ce qui tourne vraiment — *état réel*.
173. **Le rapport du soir** — un journal posé à l'accueil le soir — *rapport réel*.
174. **L'aube** — le point du matin allume les étages un par un — *point du matin*.
175. **Les anniversaires de l'entreprise** — date de fondation — *date réelle*.
176. **Le temps passé** — combien d'heures de travail des agents cette semaine (mesuré) — *durées*.
177. **La mémoire longue** — un « album » par mois — *événements*.
178. **Le fuseau du fondateur** — si le fondateur voyage, l'immeuble suit son fuseau — *réglage*.
179. **La pause du fondateur** — un mode « je ne suis pas là » : les agents mettent en attente ce qui demande une décision — *réglage*.
180. **Le temps réel partout** — aucune horloge figée ; chaque heure affichée est vraie — règle.

## 10. Les chiffres dans le bâtiment (181–200)
181. **La vitrine de la boutique** — au rez-de-chaussée, les ventes du jour — *commandes réelles*.
182. **Les visiteurs** — des silhouettes qui passent dans la rue = visiteurs réels (robots retirés) — *événements*.
183. **La jauge du budget** — une citerne qui se vide avec les dépenses d'IA — *coût réel*.
184. **Alerte à 80 %** — la citerne devient orange — *plafond*.
185. **Le compteur de livrables** — au-dessus de chaque étage — *livrables*.
186. **L'entonnoir** — visites → fiches → paniers → commandes, dessiné comme des tuyaux — *événements*.
187. **Le coffre** — la trésorerie (si la comptabilité est branchée) — *données comptables*.
188. **Les avis clients** — étoiles sur la façade — *avis réels*.
189. **Les objectifs** — une barre de progression sur le toit (objectif du mois) — *objectif + mesure*.
190. **La comparaison** — cette semaine contre la précédente, flèche verte ou rouge — *mesures*.
191. **Les chiffres cliquables** — chaque chiffre dit sa source et sa date — *source*.
192. **Les chiffres absents** — si ce n'est pas mesuré, le panneau affiche « pas encore mesuré » — règle.
193. **Le coût par agent** — sur chaque bureau, en petit — *coût réel*.
194. **Le retour sur investissement** — ce qu'un agent a coûté et ce que son travail a rapporté (quand c'est mesurable) — *mesures*.
195. **Les tendances** — une courbe sur l'écran de la salle de réunion — *historique*.
196. **Les objectifs par département** — un par étage — *objectifs*.
197. **Les chiffres privés** — masqués pour les invités en lecture — *rôle*.
198. **L'export** — un bouton « rapport PDF » depuis l'immeuble — *données*.
199. **Les chiffres robots** — les visites de robots montrées à part, en gris — *détection*.
200. **La preuve** — un clic sur un chiffre montre la requête qui l'a calculé — *transparence*.

## 11. Crises et alertes (201–220)
201. **Panne de modèle** — si Google ne répond plus, un technicien « répare » (bascule sur le relais) : on le voit — *relais réel*.
202. **Plafond atteint** — les lumières baissent, les agents s'arrêtent, un panneau explique — *plafond réel*.
203. **Client mécontent** — un avis négatif : une lampe rouge dans le service client — *avis réel*.
204. **Commande en retard** — un colis qui clignote à la réception — *commande réelle*.
205. **Tâche bloquée depuis 24 h** — le bureau s'entoure d'un ruban — *blocage*.
206. **La salle de crise s'ouvre** — réunion de crise proposée en un tap — *alerte réelle*.
207. **Sécurité** — une tentative refusée dans l'atelier : bouclier qui s'allume — *refus*.
208. **Coupure** — si l'application est hors ligne, l'immeuble le dit (au lieu de figer) — *connexion*.
209. **Alerte de coût** — une dépense anormale en une heure — *coût*.
210. **Le pompier** — l'agent désigné pour les urgences (Rigo ou Alpha) se lève — *rôle*.
211. **Après la crise** — le compte rendu « ce qui s'est passé, ce qu'on change » — *réunion*.
212. **Les alarmes qu'on règle** — le fondateur choisit ce qui mérite une alerte — réglage.
213. **Pas de panique inventée** — aucune crise simulée, sauf en entraînement marqué — règle.
214. **La santé de l'entreprise** — un « pouls » sur la façade : livraisons, blocages, coûts — *données*.
215. **Le robot détecté** — un pic de faux visiteurs : une silhouette grise marquée « robot » — *détection*.
216. **Le fournisseur en panne** — l'état des services (paiement, e-mail) — *statuts réels*.
217. **L'erreur de production** — une erreur sur le site : alerte dans l'atelier — *journaux*.
218. **Le retour arrière** — un bouton pour revenir à la version d'avant (avec Confirmer) — *points de retour*.
219. **La cellule de veille** — la nuit, un seul agent veille (si configuré) — *agent réel*.
220. **L'historique des crises** — un registre, pour apprendre — *événements*.

## 12. Personnaliser son immeuble (221–240)
221. **Le style de façade** — moderne, colonial, verre, brique, terre crue — choix.
222. **La ville autour** — choisir le décor : bord de mer, montagne, grande ville, village — choix, décor annoncé.
223. **Les étages qui poussent** — un nouveau département = un nouvel étage, avec une petite grue le jour J — *département créé*.
224. **Agrandir, jamais par décor** — l'immeuble ne grandit que si l'équipe grandit — règle.
225. **La décoration des bureaux** — chaque agent choisit sa plante ou son affiche (à sa création) — choix de l'agent.
226. **Les couleurs de la marque** — l'entreprise applique ses couleurs à la façade — choix.
227. **Le logo sur le toit** — le logo de l'entreprise — *logo réel*.
228. **Les pièces spéciales** — studio photo, salle de vente, entrepôt, selon le secteur — *modèle choisi*.
229. **L'immeuble de nuit ou de jour** — forcer l'un ou l'autre — réglage.
230. **Le jardin** — une plante qui grandit avec chaque commande réelle — *commandes*.
231. **Les trophées** — dans le hall : premières ventes, 100 livrables… réels — *jalons réels*.
232. **Les œuvres** — les meilleures images produites par les agents, encadrées — *livrables*.
233. **La bannière de campagne** — une campagne en cours affichée sur la façade — *campagne réelle*.
234. **La taille adaptée** — 3 agents : une maison ; 300 : une tour — *effectif réel*.
235. **Le mode épuré** — pour qui veut la liste, pas le jeu — réglage.
236. **Les thèmes de la plateforme** — nuit or et terracotta par défaut — marque.
237. **Les sons d'ambiance** — à activer soi-même — choix.
238. **Les accessoires du fondateur** — son bureau, sa photo, sa citation — choix.
239. **Les pièces verrouillées** — une pièce se débloque quand on branche le connecteur correspondant (boutique, comptabilité) — *connecteurs*.
240. **Partager son style** — un modèle d'immeuble que d'autres peuvent reprendre — choix.

## 13. Son, voix et notifications (241–260)
241. **Aucune notification en plus** — tout se voit dans l'immeuble, rien ne sonne sur le téléphone sans demande — règle de Beau.
242. **Le bruit de fond** — clavier discret quand quelqu'un écrit vraiment, silence sinon — *états réels*.
243. **La cloche de la réunion** — un son quand une réunion commence (si le son est activé) — *réunion*.
244. **La voix de la réceptionniste** — elle lit le résumé à l'arrivée — *résumé réel*.
245. **La voix de chaque agent** — une voix par agent quand il parle en réunion — *voix réglée*.
246. **Écouter sa journée** — un podcast de 2 minutes, le soir — *rapport*.
247. **Le mode silencieux** — par défaut sur téléphone — réglage.
248. **Parler à l'immeuble** — « Jarvis, où en est Rigo ? » — *données réelles*.
249. **Les alertes sonores choisies** — seulement ce que le fondateur a coché — réglage.
250. **Le son de la victoire** — seulement pour une vraie vente — *commande*.
251. **La dictée** — dicter une consigne depuis n'importe quelle pièce — voix.
252. **La transcription** — tout ce qui est dit est écrit — accessibilité.
253. **Les sous-titres** — pour les réunions écoutées — accessibilité.
254. **Les langues** — l'immeuble parle la langue de l'utilisateur — réglage.
255. **La voix du fondateur** — ses messages vocaux arrivent aux agents — *vocal réel*.
256. **Le bip de la carte d'accord** — une seule fois, doux — *demande en cours*.
257. **Pas d'alerte la nuit** — sauf crise réelle, si le fondateur l'a voulu — réglage.
258. **Le résumé vocal sur demande** — « qu'est-ce que j'ai manqué ? » — *messages*.
259. **Le son coupé en réunion humaine** — si le fondateur est en appel — réglage.
260. **Le volume par pièce** — on s'approche d'une pièce, on l'entend mieux — décor sonore.

## 14. Partager et montrer (261–280)
261. **La carte postale** — une image de l'immeuble ce soir, à partager — *état réel du moment*.
262. **La vidéo de la semaine** — 30 s, les vrais moments forts — *événements*.
263. **La vitrine publique** — une page publique (avec accord) : l'équipe, sans données privées — *données choisies*.
264. **Inviter un associé** — en visiteur, lecture seule — *rôles*.
265. **Présenter à un investisseur** — mode présentation : chiffres réels avec sources — *données*.
266. **Le « avant / après »** — l'immeuble le premier jour et aujourd'hui — *historique*.
267. **Le badge « construit avec Léo »** — pour son site — choix.
268. **Les jalons partagés** — « 100 livrables » en image — *jalons réels*.
269. **Partager une réunion** — le compte rendu en lien — *compte rendu*.
270. **Le classement public (volontaire)** — les entreprises qui acceptent de montrer leurs jalons — accord.
271. **Le recrutement partagé** — partager l'arrivée d'un agent — *arrivée*.
272. **Le fil public** — un extrait du fil « En direct », sans données privées — choix.
273. **Les témoignages** — un client réel qui accepte de témoigner — accord écrit.
274. **La vidéo pour les réseaux** — format 9:16, avec la mention « vraie activité » — *événements*.
275. **Le lien de visite** — un lien pour qu'un ami fasse le tour (lecture seule, expirant) — accès.
276. **L'export des données** — tout ce que l'immeuble montre, en tableau — *données*.
277. **La page « notre équipe »** — les agents présentés honnêtement comme des agents d'IA — règle d'honnêteté.
278. **Le journal de bord public** — une ligne par jour, choisie par le fondateur — choix.
279. **Les modèles d'immeuble** — partager la structure de son entreprise comme modèle — choix.
280. **Pas de faux chiffres pour épater** — tout ce qui est partagé est vérifié — règle.

## 15. Ce qui n'a jamais existé (281–300)
281. **La machine à remonter le temps** — revenir à n'importe quel instant de l'entreprise et voir exactement qui faisait quoi — *historique complet*.
282. **Le jumeau d'entraînement** — une copie « entraînement » de l'entreprise où l'on teste une décision avant de la prendre, marquée SIMULÉ partout — *données copiées, simulation annoncée*.
283. **L'immeuble qui apprend** — les pièces se réorganisent selon qui travaille vraiment avec qui — *échanges réels*.
284. **Le fil d'or de la décision** — suivre une décision du fondateur jusqu'à son effet : tâches, livrables, vente — *chaîne réelle*.
285. **La salle des preuves** — chaque affirmation d'un agent a sa preuve affichée, sinon elle est grisée — *preuves*.
286. **Le quartier** — plusieurs entreprises de Léo qui travaillent ensemble (intérim, audit) : des passerelles entre immeubles — *missions réelles*.
287. **L'immeuble en réalité augmentée** — le poser sur son bureau avec la caméra du téléphone — décor, données réelles.
288. **L'agent qui présente l'immeuble à un client du fondateur** — visite guidée vocale pour un tiers — *données réelles*.
289. **Le métronome de l'entreprise** — un battement au rythme des livraisons réelles — *livraisons*.
290. **La constellation** — de nuit, chaque livrable validé devient une étoile au-dessus du toit — *livrables validés*.
291. **Le miroir du fondateur** — l'immeuble montre aussi ce que le fondateur doit faire (décisions en attente) : son bureau clignote — *questions ouvertes*.
292. **Le contrat visible** — les règles de l'entreprise gravées dans le hall, que chaque agent signe en arrivant — *mémoire + création*.
293. **L'arbre généalogique des idées** — une idée de Gemini → tâche → code → mise en ligne → vente — *chaîne réelle*.
294. **La météo des agents** — non pas une humeur inventée, mais la charge, les blocages et les réussites en un symbole — *données*.
295. **L'immeuble vocal pour les non-lecteurs** — tout se comprend à l'oreille et à l'image, sans lire — accessibilité.
296. **Le mode « école »** — un étudiant voit l'immeuble d'une vraie entreprise d'exemple et apprend le métier — *entreprise d'exemple annoncée*.
297. **Le marché des agents dans la rue** — des freelances d'autres entreprises qui passent, qu'on peut engager — *catalogue réel*.
298. **La boîte noire** — l'enregistrement infalsifiable des actions, visible comme un coffre scellé — *journal signé*.
299. **L'héritage** — quand un agent part, ce qu'il a appris est transmis visiblement à son successeur — *mémoire*.
300. **L'immeuble qui dit « je ne sais pas »** — quand une donnée manque, la pièce est dessinée en pointillés, avec « pas encore mesuré » — honnêteté visuelle.

---

## Mes 20 préférées (effet « waouh » pour un effort raisonnable)
1. **11 / 49 — La délégation visible** : un dossier traverse l'étage quand un agent confie une tâche.
2. **163 — Rejouer la journée** avec une frise.
3. **1 et 4 — Mon avatar et frapper à une porte.**
4. **62 — Le recrutement en direct** : la recrue passe la porte, fait son entretien et monte.
5. **106 — La victoire** : les fenêtres s'illuminent pour une vraie vente.
6. **21 et 28 — La réceptionniste qui présente** et « que s'est-il passé pendant mon absence ? ».
7. **290 — La constellation** des livrables validés.
8. **121 à 126 — La réunion vivante** : entrée, parole, votes, chaise du fondateur.
9. **50 et 51 — La pile de dossiers** et la surcharge visible.
10. **84 — Les diplômes** accrochés aux bureaux.
11. **161 et 162 — Le jour et la nuit réels**, avec les passages de l'équipe.
12. **183 — La citerne du budget.**
13. **223 — Les étages qui poussent** avec une grue, seulement quand l'équipe grandit.
14. **284 — Le fil d'or de la décision.**
15. **142 — Les tests vert ou rouge** dans l'atelier.
16. **261 — La carte postale du soir.**
17. **300 — Les pointillés « pas encore mesuré ».**
18. **42 — Les liens hiérarchiques** au survol.
19. **68 — Le carton du départ.**
20. **85 — La salle d'entraînement** marquée « SIMULÉ ».

## 5 idées à ne surtout pas faire
1. Des agents qui se promènent ou discutent « pour faire vivant » sans rien faire : c'est mentir.
2. Des humeurs ou des émotions inventées (« Ada est triste ») : seule une charge ou un blocage mesuré se montre.
3. Des fêtes, des confettis ou des chiffres pour un succès qui n'a pas eu lieu, ou de faux visiteurs dans la rue.
4. De la 3D lourde ou de longues vidéos générées en continu : trop cher, trop lent sur les téléphones modestes.
5. Des notifications sur le téléphone pour chaque mouvement : Beau n'en veut pas, tout se voit dans l'application.
