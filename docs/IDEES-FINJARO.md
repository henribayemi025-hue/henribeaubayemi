# Les idées de Beau — ce qui est décidé, ce qui attend, ce qui est écarté

Écrit le 22/09/2026 à sa demande: « note les idées dont on a parlé, sinon je
vais oublier ».

Règle de ce fichier: **rien n'est ajouté ici sans que Beau l'ait dit**, et
tout ce qui est écarté garde la raison de l'avoir été. Une idée écartée sans
raison revient tous les trois mois.

---

## 1. Ce qui est FAIT

| Quoi | Où |
| --- | --- |
| Annulation automatique d'une commande sans réponse (7 j après l'escalade) | production |
| Fermeture de 14 fonctions ouvertes à tout compte connecté | production |
| Finia connaît Finjaro Accounting et l'ouvre par un BOUTON | production |
| Liens cliquables dans les réponses de Finia | production |
| Le bouton de commande ne refuse plus en silence | production |
| Montant en espèces dans la monnaie qu'on va tendre | production |
| La visite guidée ne recouvre plus l'écran de paiement | production |
| Démonstration `/demo` — acheter, vendre, voir la comptabilité | production |
| « Mon argent »: comptes, budget mensuel, épargne, njangi, projets, espaces | préproduction |

---

## 2. Ce qui est POSÉ DE CÔTÉ, sur décision de Beau

### Finjaro Work — l'équipe d'une boutique

Migration `0134` et écran `VendorWork.jsx` écrits, **non branchés**, migration
appliquée au projet de test seulement.

Beau a dit « fais le », puis « ne lance pas encore, réfléchis d'abord ».

Ce qui a été trouvé en cherchant:

- Le marché « ton business dans WhatsApp » est **plein**: 41Plus, Selloops,
  Kipa, Queek, Ortusflore, VONO, Ovira.
- La preuve du travail (photo + GPS + heure) existe aussi: **ShambaBoy**
  (Kenya, ~18 000 FCFA/mois), TraKKiT, Nexura Agent, Tarsil, AgriFriend.
  Tous VERTICAUX — fermes, distribution, livraison. Aucun ne sert une
  boutique de trois personnes.
- Ce que personne d'autre ne peut faire: **la tâche qui naît du commerce
  lui-même** (une commande arrive → une tâche assignée). Eux n'ont pas les
  commandes.
- Le fait qui justifie tout: la commande du 04/09 est restée 17 jours sans
  que personne ne bouge. Ce n'était pas un problème de communication, c'est
  que **personne n'était nommé**.

**Question ouverte, non mesurée:** combien de boutiques ont plus d'une
personne ? Ça décide si Work sert à quelqu'un.

### « Mon argent » — application à part, ou section de Finjaro ?

L'ancien Finjaro est **noir et violet, sept onglets** (Home, Budget, Savings,
Njangi, Projects, Analyst, Settings). La place de marché est crème et
terracotta. Ce sont deux produits.

Mon avis: **application à part**, `money.finjaro.net`, dans le sélecteur
d'applications à côté d'Accounting. Ce n'est pas le même usage.

**Beau n'a pas tranché.**

---

## 3. Les vingt idées du 22/09

★ = seul Finjaro peut le faire, parce qu'il a les commandes, les livres et Finia.

### Vendre
1. ★ Appel vidéo depuis la fiche article — voir l'article en vrai avant de payer.
2. ★ Vente en direct — la vendeuse diffuse, on achète pendant.
3. ★ Commande vocale — la cliente dit ce qu'elle veut, Finia commande.
4. Essayage virtuel — **existe déjà**, en Premium, sous-utilisé.
5. ★ Le prix conseillé — Finjaro voit tous les prix, dit si tu es trop chère.

### L'argent
6. ★ **Le carnet de crédit** — « qui me doit combien ». Le cahier de toute boutique.
7. ★ **Avance sur ventes** — financer sur l'historique Finjaro.
8. Tontine / njangi — **tables déjà en base**, écran refait le 22/09.
9. Mobile Money MTN + Orange — pas commencé.
10. ★ Achat groupé — cinq boutiques commandent ensemble, prix de gros.

### L'équipe
11. Pointage, paie, CNPS.
12. ★ Preuve de livraison — photo + confirmation de la cliente.
13. ★ Écart de caisse — le tiroir contre les ventes, le soir.
14. Réassignation d'une tâche quand quelqu'un est absent.

### Finia
15. ★ **Vocal → décisions → tâches + écritures.** Sikia AI (Dakar, sur Claude)
    s'arrête au résumé: elle n'a ni les commandes ni les livres.
16. Photo → fiche article complète — la vision existe déjà.
17. ★ Finia répond la nuit à la place de la vendeuse — l'autoreply existe, il dort.
18. Traduction automatique des fiches.

### Les autres métiers
19. ★ Rendez-vous pour les prestataires — la page Services existe déjà.
20. Hors ligne complet — le marché, le vendeur ambulant.

**Les trois que je garderais:** le 6 (douleur quotidienne), le 1 (la vidéo qui
est la tienne), le 7 (ce qui rend Finjaro irremplaçable).

---

## 4. Les idées à reprendre plus tard

### Finjaro covoiturage
Un vrai métier, pas une fonctionnalité: chauffeurs, trajets, sièges, sécurité,
litiges. À discuter à part. Ce qui est déjà en place et servirait: les
comptes, le paiement à la livraison, la géolocalisation.

### Un dépôt où les gens déposent les applications qu'ils ont créées
L'idée tient debout, mais elle n'a de valeur que le jour où des gens
construisent des choses SUR Finjaro. À reprendre après.

### Vendre l'API de Finjaro
Pas maintenant: il n'y a encore rien qu'on veuille acheter. À reprendre quand
il y aura du trafic.

### La microfinance
**Pas cherché**, et je ne répondrai pas au feeling. Métier régulé, très
différent d'une boutique. Ça vaut une vraie recherche si Beau le demande.

---

## 5. Ce qui est ÉCARTÉ, avec la raison

### L'IA qui construit le logiciel du client
Espace le plus saturé du marché, et déjà africain: **Gebeya Dala** (paie en
M-Pesa, langues locales), **RationalGo** (Nigeria, pidgin, Paystack),
**KasiCode** (Afrique du Sud, R49 les 15 applications), **Creator by Wisely**
(₦10 000/mois), **Lahar AI** (183 métiers, 106 modules).

Et derrière eux: Lovable, Replit, Claude lui-même. On construirait un moins
bon Claude avec nos moyens.

### Génération d'images
Aucun avantage, concurrence infinie.

### Un « Teams » de Finjaro
Teams coûte 6 000 à 10 000 FCFA par personne et par mois, demande un
ordinateur et une formation — personne ne le prend, c'est vrai. Mais les
notes de réunion par IA existent déjà en Afrique: **Sikia AI** (PANEOTECH,
Dakar, construit sur Claude, déployable chez le client), **NoteWave**
(Afrique du Sud). Et la vidéo coûte cher en data: Google Meet 270 Mo/heure,
Zoom 540 Mo/heure.

**Réserve de Beau, retenue:** « les gigas, ils ne sont pas fous, s'ils
décident de le faire c'est qu'ils le veulent et peuvent payer. » Il a raison —
mon erreur était de traiter la vidéo comme une réunion. **En commerce, la
vidéo sert à VENDRE** (idées 1 et 2), pas à se réunir.

---

## 6. Chiffres mesurés qui pèsent sur ces choix

Tout est mesuré en production, rien n'est estimé.

| Fait | Chiffre |
| --- | --- |
| Boutiques | 67 |
| Boutiques vides | 19 |
| Boutiques reliées à un espace comptable | **4 sur 67** |
| Ventes remontées en comptabilité depuis le 17/09 | **0** |
| Espaces Accounting avec au moins un membre | 0 sur 8 |
| Clics pour joindre une vendeuse (total) | 2 |
| Boutique ivoirienne | 1, **vide** |
| Stockage Supabase | 550 Mo, 54 % du gratuit |

**Ce que ces chiffres disent:** le problème n'est pas le nombre de
fonctionnalités, c'est que personne n'achète encore.

**La position de Beau, 22/09, et elle prime:** « on n'a pas encore les
clients, donc en attendant construisons les choses, améliorons. »

C'est une décision, pas une hésitation: tant qu'il n'y a pas d'acheteurs, le
temps se met dans le produit plutôt que dans l'attente. Ma réserve ci-dessus
reste écrite pour le jour où les premiers clients arriveront — à ce
moment-là, c'est eux qui décideront de l'ordre, pas cette liste.

---

## 7. « On peut aussi faire comme ça » — la grille d'un ERP (Dolibarr)

Beau, 22/09, captures de Dolibarr à l'appui: « c'est ça je demande de faire,
même RH, etc. », « genre open source ».

### Ce que la grille contient, et où on en est VRAIMENT

Vérifié fichier par fichier dans les deux dépôts, pas de mémoire.

| Module Dolibarr | Chez nous | Où |
| --- | --- | --- |
| Prospects / Clients | ✅ | `Parties` (Accounting) + `prospects`, 60 lignes (place de marché) |
| Devis | ✅ | `Quotes` |
| Commandes | ✅ | `orders` (place de marché) |
| Contrats / Abonnements | ✅ | `Subscriptions` |
| Service d'assistance | ◐ | table `support_tickets` en base, aucun écran |
| Opportunités | ❌ | — |
| Base de connaissance | ❌ | — |
| **Employés** | ✅ | `Staff` |
| **Pointage / présence** | ✅ | `Staff` — présent, demi-journée, absent, congé |
| **Paie** | ✅ | `Staff` |
| Notes de frais | ◐ | `Expenses` existe, mais côté comptable, pas « l'employé demande, on rembourse » |
| Demandes de congé | ❌ | un STATUT « congé » existe; le circuit demande → réponse, non |
| Feuilles de temps | ❌ | — |
| Recrutement | ❌ | — |
| Gestion association | ❌ | — |
| CMS / Site web | ✅ | chaque boutique a sa page |
| **Point de vente** | ✅ | `PointOfSale`, `CashRegister`, `CashBook` |
| Produits, Services | ✅ | `Products` + `products`, 501 lignes |
| Stocks | ✅ | `Stock` |
| Achat, approvisionnement | ✅ | `Purchases` |
| Expéditions | ❌ | la livraison existe sur une commande, pas un bon d'expédition |
| Fabrication | ❌ | — |
| **Facturation & Paiements** | ✅ | `Sales`, `Journal` |
| **Rapprochement bancaire** | ✅ | `Reconcile`, `Statements` |
| **Comptabilité à double entrée** | ✅ | `GeneralLedger`, `ChartOfAccounts`, `TrialBalance`, `Closing` |
| Emailing | ◐ | `relances`, 50 envois — vers des prospects, pas une campagne |
| Enquêtes | ❌ | — |

**Le fait à retenir:** la grille est déjà couverte aux trois quarts, et la
partie la plus dure — la comptabilité en partie double, le PDV, la paie — est
FAITE. Ce n'est pas un projet à commencer, c'est un inventaire à finir.

### Ce qui manque vraiment, par ordre de difficulté

1. **Demandes de congé** — le statut existe, le circuit non. Petit.
2. **Feuilles de temps** — heures par personne et par jour. Petit, et ça
   nourrit la paie qui existe déjà.
3. **Notes de frais de l'employé** — il photographie un reçu, on rembourse.
   `Expenses` sert de sortie comptable, il manque l'entrée.
4. **Expéditions** — bon d'expédition détaché de la commande.
5. **Recrutement, fabrication, enquêtes, association** — gros, et sans
   demande mesurée. À ne pas ouvrir maintenant.

### Sur « open source »

Deux choses différentes, à ne pas confondre:

- **Le dépôt est DÉJÀ public.** N'importe qui peut lire ce code aujourd'hui.
  Vérifié le 22/09: aucune clé secrète n'y est écrite — les fonctions ne
  lisent que des noms de variables d'environnement.
- **Il n'y a AUCUNE licence.** Sans licence, « tous droits réservés »
  s'applique: on peut lire, pas réutiliser. Poser une licence est une
  décision qui ne se reprend pas — ce qui est publié sous licence libre
  l'est pour toujours, même si on change d'avis.

Ce qu'il faut savoir avant de choisir:

- **Le code n'est pas ce qui a de la valeur ici.** Une place de marché vaut
  par ses vendeuses et ses acheteuses. Quelqu'un qui copierait le code
  repartirait de zéro côté monde réel. Le risque est plus petit qu'il n'en
  a l'air.
- **Mais le code public rend la base de données seule gardienne.** C'est
  exactement le travail du 22/09: quatorze fonctions étaient ouvertes à tout
  compte connecté. En logiciel libre, chaque trou de ce genre se lit dans le
  code par n'importe qui. Ça ne condamne pas l'idée — ça dit que la sécurité
  doit passer AVANT la licence, pas après.
- **Dolibarr vit de l'hébergement et du support**, pas du logiciel. Le modèle
  marche quand une communauté contribue, et une contribution demande
  quelqu'un pour la relire. Beau ne code pas.

**Rien n'est décidé.** À trancher quand il le voudra.
