# 21 — « Le stack design ultime pour Claude Code » (guide Google Docs de 0xLoucash)

- **Source** : https://docs.google.com/document/d/e/2PACX-1vTvcFm0Oz5R5ZMmo8Bfb2-4Zf7Z_sCzcU98ONugbgPyBhoJIupl2STd5PaWRSRI7B181lqaA96aYUj_/pub
- **Type** : guide (document Google publié sur le web)
- **Accès** : ouvert et **lu en entier** le 24/09/2026 (la version texte `?output=txt` n'est pas proposée pour un document publié ; j'ai lu le HTML de la page, converti en texte). Les images d'illustration (« avant / après ») ne sont pas lisibles en texte et n'ont pas été vues. Pour vérifier les affirmations, j'ai aussi ouvert, sans rien installer ni exécuter : le dépôt `Leonxlnx/taste-skill` (README, LICENSE, liste des compétences, section des « trois réglages »), le dépôt `nextlevelbuilder/ui-ux-pro-max-skill` (README, LICENSE, section installation), les pages officielles `21st.dev/mcp` et `21st.dev/pricing`, et le registre npm pour les noms de paquets cités.
- **Licence / droits** :
  - **le guide** : aucune licence, « © 0xLoucash » (tous droits réservés). On n'en reprend pas le texte.
  - **Taste Skill** : MIT (Leonxlnx, 2026). **UI/UX Pro Max** : MIT (Next Level Builder, 2024). **21st.dev** : service commercial (paquet `@21st-dev/magic` sous licence ISC, `@21st-dev/cli` sous MIT, d'après le registre npm).
- **Reçu de Beau le** : 24/09/2026

## Ce que c'est (3 à 6 lignes, avec tes mots)
Un guide du même auteur que la fiche 05 (0xLoucash). Il part d'un constat juste : laissée à elle-même, une IA qui code produit des pages « moyennes » qui se ressemblent toutes (tout centré, trois cartes identiques, boutons bleus, mêmes espacements). Il propose d'installer trois outils : **Taste Skill** (des consignes de goût, avec trois réglages de 1 à 10), le **serveur MCP de 21st.dev** (une bibliothèque de composants interrogeable par l'agent) et **UI/UX Pro Max** (une méthode de design plus complète). Il se termine par un très long exemple de consigne et par une offre de coaching payant à 99 € l'heure.

## Ce qui est vraiment utile pour Finjaro et Léo
- **Le diagnostic** : le rendu générique vient de ce qu'on ne donne à l'IA ni contraintes ni références. La réponse n'est pas « plus de goût » en général, mais **des contraintes écrites**. Pour Finjaro, la contrainte existe déjà : le style crème, terracotta, laiton et grands titres de Beau.
- **Les trois réglages de Taste Skill** (vérifiés dans le dépôt, MIT) : variation de la mise en page, intensité des animations, densité de contenu, chacun de 1 à 10. C'est un vocabulaire simple pour dire à une IA qui code ce qu'on veut, sans toucher au style. Le dépôt lui-même conseille des valeurs basses (3-4 en variation, 2-3 en animation) pour les pages « où la confiance passe d'abord ». C'est le cas d'un panier, d'un paiement ou d'une fiche vendeur.
- **L'ordre de la consigne** : d'abord quoi et pour qui, ensuite le style, ensuite les réglages, enfin les composants. C'est le bon ordre, et il rejoint la fiche 16 (« les besoins avant de coder »).
- **Ce que l'exemple montre à ne pas faire** : la consigne d'exemple invente une biographie (« sept ans de travail », « salué dans plusieurs grands festivals ») et branche des vidéos et images hébergées ailleurs. C'est un bon contre-exemple pour nos agents : chez Finjaro, aucun contenu inventé, aucun visuel pris sur le web.

## Pour quels agents de Léo
- **Ada Nkemba** et **Claude** : ce sont eux qui donnent des consignes de page à une IA qui code, ou qui codent eux-mêmes. Les trois réglages et l'ordre de la consigne les concernent directement.
- **Forge** (IA) : il choisit et règle les outils IA. Il doit savoir ce que valent ces trois outils et ce qu'ils coûtent.
- **Miroir** : il vérifie le résultat. Les réglages lui donnent des mots précis (« animation trop forte pour une page de paiement ») au lieu d'un avis de goût.
- **Vigie** : suivre ces outils (très populaires, qui changent vite), sans les installer.

## Compétences à tirer (pour Mentor)

**Donner une consigne de page à une IA qui code** — Ada Nkemba, Claude, Forge, Miroir
Quand s'en servir : avant de demander un écran à une IA qui code (ou de le coder soi-même).
Comment faire, dans cet ordre :
1. Dis ce qu'on construit et pour qui, en deux phrases.
2. Donne le style de la maison, qui n'est pas négociable : crème, terracotta, laiton, grands titres, et les composants existants de Finjaro. Ne laisse jamais un « pack de goût » extérieur le remplacer.
3. Fixe trois réglages de 1 à 10 : variation de la mise en page, intensité des animations, densité. Pour un panier, un paiement ou une fiche vendeur, reste bas (confiance d'abord). Une page d'accueil peut monter.
4. Ne fournis que du contenu réel : vrais libellés, vraies photos des vendeuses ou de Beau, aucun chiffre ni témoignage inventé. Pas de vidéo ni d'image hébergée ailleurs.
5. Demande les états (chargement, vide, erreur) et une vérification sur téléphone et sur grand écran.
Piège : une consigne très longue et très précise sur les pixels, mais muette sur l'utilisateur. On obtient une belle page qui ne sert à rien.
*Source : inspiré des trois réglages de Taste Skill (Leonxlnx, MIT) et de l'ordre de consigne proposé par le guide de 0xLoucash (texte non repris).*

## Limites, risques, prudence
- **Conflit de style** : la fiche 10 l'avait déjà noté pour UI/UX Pro Max. Un outil qui « crée un design system complet » ou impose un style (doux, minimaliste, brutaliste) risque de raboter le style vintage de Beau (CLAUDE.md §6). Aucune de ces compétences n'est à installer telle quelle pour Finjaro.
- **Un nom de paquet qui n'existe pas.** Le bloc de configuration du guide lance `npx -y @21st/mcp`. **Ce paquet n'existe pas sur npm** (vérifié le 24/09/2026). Les paquets officiels sont `@21st-dev/magic` et `@21st-dev/cli`. Un nom inexistant recopié dans une commande qui s'exécute automatiquement (`-y`) est une porte ouverte : n'importe qui peut publier un paquet sous ce nom. C'est précisément le piège que décrit la fiche 23.
- **Prix et offres datés** : le guide parle de « Magic Generate (Pro, 20 $/mois) ». La page de prix officielle ne connaît plus d'offre de ce nom. Elle propose une offre gratuite (recherche, deux copies par jour), « Builder » à 6 $/mois et « Builder + AI » de 15 à 60 $/mois selon les crédits (relevé le 24/09/2026, prix en dollars, à revérifier).
- **Étoiles datées** : le guide annonce « 10k+ » pour Taste Skill et « 71k+ » pour UI/UX Pro Max. GitHub affiche 89,8 k et 130,4 k le 24/09/2026. Ce sont des mesures de popularité, pas de qualité.
- **Installation « laisse Claude Code le faire »** : le guide conseille de demander à l'agent de cloner un dépôt et de copier ses compétences sans les lire. Une compétence tourne avec tous les droits de l'agent. Chez nous : lecture d'abord, accord de Beau ensuite (fiches 05 et 11). Le chemin `.claude/skills/` indiqué pour UI/UX Pro Max existe bien, mais le dépôt recommande désormais son propre greffon ou son outil `uipro`.
- **Clé API** : le guide rappelle à juste titre de ne jamais publier la clé 21st.dev. Aucun compte n'a été créé pour cette fiche.
- **Fin commerciale** : coaching à 99 € l'heure et appel à envoyer ses captures sur Instagram. Rien de cela n'engage Finjaro.

## Verdict
**Retenu pour une compétence** : donner une consigne de page à une IA qui code (quoi et pour qui, style de la maison fixe, trois réglages, contenu réel seulement), pour Ada Nkemba, Claude, Forge et Miroir.

Les trois outils sont **gardés en réserve** : Taste Skill et UI/UX Pro Max comme lectures pour Claude (licence MIT), 21st.dev comme service à évaluer par Forge si un jour on cherche des composants, avec les vrais noms de paquets. **Mis de côté** : l'installation en bloc, la consigne d'exemple (contenu inventé, médias hébergés ailleurs) et tout style imposé qui écraserait celui de Beau.
