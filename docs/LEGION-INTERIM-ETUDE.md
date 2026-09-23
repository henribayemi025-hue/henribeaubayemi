# L'intérim d'agents IA — l'étude, avant de construire (23/09)

Beau, 23/09 : « des agents IA par service : vous avez 20 personnes à tel
service, on vous envoie les agents qui font ceci et ceci », « une boîte
d'intérim de service client, donc il y aura plusieurs entreprises », « un
agent expert en audit : si quelqu'un veut, on le branche au truc de
l'entreprise et il fait — agent intérim ». Puis : « ne te base pas
uniquement sur ce que je dis ; même les trucs comme l'entreprise d'intérim
d'IA, regarde vraiment ça avec attention ».

Cette étude regarde donc **comment ça se fait déjà ailleurs**, ce que ça
coûte, ce qui a mal tourné chez d'autres, ce que la loi demande, et ce que
Legion doit avoir pour que ça marche. Chaque chiffre vient d'une source
citée en bas ; aucun n'est une mesure de Finjaro.

## 1. Ce qui existe déjà dans le monde

- **« Employé IA », « travailleur numérique »** : un agent qui prend en
  charge une tâche **de bout en bout**, pas seulement une réponse. Les offres
  publiées vont d'environ 20 à 500 $ par mois selon la charge, et coûtent
  souvent plus à l'usage qu'au prix affiché (chaque action consomme). [1]
- **Artisan** vend « Ava », une commerciale IA qui prospecte, écrit, relance
  et prend des rendez-vous. Elle a été vendue sur un forfait appelé
  « Employee » ; aujourd'hui au crédit (on paie le travail fait), à partir de
  250 $ par mois selon Artisan. [1][2]
- **Le paiement au résultat** s'impose pour le service client :
  **Intercom Fin** facture 0,99 $ par demande **résolue**, avec un minimum de
  50 par mois [3] ; **Sierra** (fondée par l'ancien co-PDG de Salesforce)
  facture aussi à la résolution, environ 1,50 $ selon des estimations
  extérieures, par contrat négocié, pour de très grandes entreprises. [4]
- **L'« agence d'intérim d'agents IA »** est déjà un modèle décrit : l'agence
  met en place des agents chez des clients, les fait travailler « comme des
  salariés » (une fiche de poste, des objectifs, **un chemin pour passer la
  main à un humain**), les suit et remplace ceux qui ne performent pas ;
  elle facture une mise en place puis un forfait mensuel de gestion par
  agent. Le risque principal qu'elle cite : **oublier la supervision
  humaine**. (Source : un article de praticien, pas une étude de marché.) [5]

## 2. Ce qui a mal tourné chez d'autres — et ce qu'on en retient

- **Klarna** a remplacé une grande partie de son service client par une IA
  en 2024, puis son PDG a reconnu en 2025 : « on est allés trop loin… le
  résultat, c'est une qualité plus faible ». Leur erreur : mesurer la vitesse
  et la satisfaction moyenne, pas la résolution des cas difficiles. Ils sont
  revenus à un modèle mixte : l'IA prend le courant, les humains le
  complexe et l'émotionnel. [6]
  → **Leçon pour Legion** : mesurer la *résolution*, cas par cas, et passer
  la main à un humain dès que c'est complexe ou sensible.
- **Air Canada** a été condamnée parce que son agent en ligne avait donné une
  mauvaise information sur un tarif ; le tribunal a refusé l'argument « c'est
  l'agent, pas nous » : **l'entreprise répond de ce que dit son agent**. [7]
  → **Leçon** : l'agent intérimaire ne répond **qu'à partir des documents de
  l'entreprise**, cite sa source, et dit « je vérifie avec l'équipe » quand
  il ne sait pas. Rien d'inventé.
- **Les passages de relais ratés** sont la première cause de clients
  frustrés : un passage à l'humain doit transmettre tout le contexte (ce que
  le client veut, ce qu'il a déjà essayé, pourquoi on escalade). [8]

## 3. Ce que la loi demande

- **Europe (AI Act, article 50, depuis le 2 août 2026)** : une personne qui
  parle à un agent IA doit **savoir que c'est une IA** (sauf si c'est
  évident). Amendes jusqu'à 15 M€ ou 3 % du chiffre d'affaires mondial. [9]
  → Toute réponse d'un agent intérimaire à un client final le dit.
- **Cameroun (loi n° 2024/017 du 23 décembre 2024)** : mise en conformité
  exigée depuis le 23 juin 2026 ; **autorisation préalable de l'autorité de
  protection des données (APDP)** avant tout traitement de données
  personnelles ; consentement libre, éclairé, exprès ; amendes de 5 à 50
  millions de FCFA pour un traitement sans autorisation. [10]
  → Un service client intérimaire traite les données des clients de nos
  clients : qui est responsable, qui est sous-traitant, quel contrat, quelle
  autorisation — **c'est une question juridique, à trancher avec un juriste
  avant de vendre ce service**. Même règle qu'au point « microfinance » de la
  feuille de route.
- **WhatsApp** (le canal du service client là où Finjaro commence) : Meta
  facture à nouveau, à partir du 1er octobre 2026, les réponses envoyées dans
  la fenêtre de 24 h, au message, avec des prix par pays. [11]
  → Le coût d'un service client sur WhatsApp n'est plus nul : il entre dans
  le prix.

## 4. Ce que Legion doit avoir pour que l'intérim marche

| Besoin | Pourquoi (sections 1 à 3) | Dans Legion |
| --- | --- | --- |
| Une **fiche de mission** : objectif, périmètre, durée, ce qu'il ne fait jamais, à qui passer la main | l'agence « onboarde les agents comme des salariés » [5] | 🔧 à construire (mission + date de fin, extinction automatique) |
| Les **documents de l'entreprise**, à jour | l'agent doit répondre depuis les sources [7] | 🔧 « Documents de l'entreprise » (point J2) |
| **Citer la source**, dire « je ne sais pas » | Air Canada [7] | 🔧 dans la consigne de chaque agent qui lit les documents |
| **Passer la main** à un humain avec tout le contexte | Klarna [6], relais ratés [8] | ✅ questions et tâches vers l'humain ; 🔧 un bouton « à un humain » qui résume le cas |
| **Dire que c'est une IA** au client final | AI Act [9] | 🔧 mention automatique dans toute réponse destinée à un client |
| **Mesurer la résolution**, pas la vitesse | Klarna [6] | 🔧 journal de mission : demandes, résolues, passées à l'humain, corrigées |
| Commencer **en brouillon** (l'humain valide), puis donner l'autonomie par type de demande | risque de qualité [6] | ✅ le niveau d'autonomie par agent existe ; 🔧 par type de demande |
| **Isolation** entre clients | « plusieurs entreprises » (Beau) | ✅ un agent n'existe que dans une entreprise, les données ne se croisent pas |
| Le **prix** | au mois, à la mission, au résultat [1][3][4][5] | ⏸ Beau |
| Le **contrat** et les **données personnelles** des clients finaux | Cameroun [10], AI Act [9] | ⏸ un juriste, avant de vendre le service client intérim |

## 5. Trois offres possibles (à trancher par Beau)

1. **Renfort d'un service** : l'entreprise décrit son service (« 20
   personnes au service client, voilà ce qu'elles font ») ; Legion propose
   les agents qui prennent les tâches répétitives ; ils rejoignent son
   Legion dans ce service. Abonnement par agent.
2. **Intérim à la mission** : un expert (audit, clôture, paie, conformité,
   étude de marché…) pour une mission datée, branché sur les données de
   l'entreprise, qui rend un rapport et s'éteint à la fin. Forfait par
   mission.
3. **Service client au résultat** : les demandes des clients finaux, triées,
   répondues depuis les documents, passées à l'humain quand il faut. Payé à
   la demande résolue, comme Fin ou Sierra. **Seulement après l'avis
   juridique** (section 3).

Ce qui distingue Legion des offres citées : elles vendent **un** agent
(commercial, service client) ; Legion donne **une équipe entière**, par
métier, qui se parle, se contredit en réunion, et garde la mémoire de
l'entreprise — et l'environnement Finjaro (boutique, comptabilité) déjà
branché.

## 6. L'ordre

- **Maintenant** (sans geste de Beau) : fiche de mission et agents
  intérimaires (1 et 2), « renforcer un service », documents de
  l'entreprise, tri des demandes, réponses préparées **en brouillon** avec
  mention IA et source.
- **⏸ Beau** : les prix des trois offres ; l'avis juridique avant l'offre 3 ;
  les canaux réels (boîte mail : projet Google ; WhatsApp Business : compte
  Meta de la société).

## Sources

1. [AI Employees and Digital Workers: The 2026 Cost Truth — DEV Community](https://dev.to/lusivision/ai-employees-and-digital-workers-the-2026-cost-truth-48j9)
2. [Artisan — Ava 2.0, now self-serve](https://www.artisan.co/blog/artisan-launches-ava-2-0-the-first-autonomous-ai-bdr-now-self-serve)
3. [Fin AI Agent Pricing](https://fin.ai/pricing) ; [Fin pricing: Outcomes](https://fin.ai/help/en/articles/13975800-fin-pricing-outcomes)
4. [Outcome-based pricing for AI Agents — Sierra](https://sierra.ai/blog/outcome-based-pricing-for-ai-agents) ; [Sierra AI Pricing 2026 — Fin](https://fin.ai/learn/sierra-ai-pricing)
5. [Step-by-Step: Building Your First AI Agent Staffing Agency in 2026](https://www.michaelrcronin.com/post/step-by-step-building-your-first-ai-agent-staffing-agency-in-2026)
6. [Klarna changes its AI tune and again recruits humans — CX Dive](https://www.customerexperiencedive.com/news/klarna-reinvests-human-talent-customer-service-AI-chatbot/747586/) ; [Forbes, mai 2025](https://www.forbes.com/sites/quickerbettertech/2025/05/18/business-tech-news-klarna-reverses-on-ai-says-customers-like-talking-to-people/)
7. [BC Tribunal Confirms Companies Remain Liable for Information Provided by AI Chatbot — ABA](https://www.americanbar.org/groups/business_law/resources/business-law-today/2024-february/bc-tribunal-confirms-companies-remain-liable-information-provided-ai-chatbot/)
8. [AI-to-Human Handoff: Best Practices — Bluetweak](https://www.bluetweak.com/blog/ai-to-human-handoff)
9. [Transparency obligations under Article 50 of the AI Act — Commission européenne](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act) ; [Article 50](https://artificialintelligenceact.eu/article/50/)
10. [Protection des données au Cameroun : la course contre la montre avant juin 2026 — CIO Mag](https://cio-mag.com/protection-des-donnees-au-cameroun-la-course-contre-la-montre-avant-juin-2026/) ; [DGB — la loi entre en vigueur](https://www.dgb.cm/la-loi-sur-la-protection-des-donnees-personnelles-entre-officiellement-en-vigueur/)
11. [Pricing on the WhatsApp Business Platform — Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) ; [WhatsApp Pricing 2026 — EngageLab](https://www.engagelab.com/blog/whatsapp-pricing-2026-service-message-cost)
