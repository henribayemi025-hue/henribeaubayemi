// Conditions Générales d'Utilisation et de Vente — Finjaro.
//
// Ce document est un PROJET rédigé pour Beau. Il doit être relu et validé par
// un avocat avant d'être opposé à qui que ce soit : Finjaro opère au Cameroun
// ET dans l'Union européenne, et certaines clauses (limitation de
// responsabilité, données personnelles, droit de rétractation) sont encadrées
// par des règles impératives qui varient selon le pays de l'utilisateur.
//
// Structure : { fr | en } -> { title, updatedAt, preamble, sections[] }
// Chaque section : { id, title, body: string[] } — un élément = un paragraphe.
// Les paragraphes commençant par "• " sont rendus comme des puces.

export const CONTACT_EMAIL = 'fin.finjaro@gmail.com';
export const TERMS_VERSION = '1.0';
export const TERMS_UPDATED_AT = '2026-08-04';

const fr = {
  title: 'Conditions Générales d’Utilisation et de Vente',
  updatedLabel: 'Dernière mise à jour',
  updatedAt: '4 août 2026',
  versionLabel: 'Version',
  draftNotice:
    'Document en cours de finalisation juridique. Il s’applique dès à présent aux utilisateurs de Finjaro et pourra être précisé après relecture par un conseil juridique.',
  preamble: [
    'Les présentes Conditions Générales d’Utilisation et de Vente (ci-après les « Conditions ») régissent l’accès et l’utilisation de la plateforme Finjaro, accessible à l’adresse finjaro.net ainsi que via ses applications mobiles et de bureau (ci-après la « Plateforme »).',
    'En créant un compte, en naviguant sur la Plateforme, en publiant une annonce ou en passant une commande, vous reconnaissez avoir lu, compris et accepté sans réserve l’intégralité des présentes Conditions. Si vous n’acceptez pas ces Conditions, vous devez cesser immédiatement d’utiliser la Plateforme.',
  ],
  sections: [
    {
      id: 'definitions',
      title: '1. Définitions',
      body: [
        'Dans les présentes Conditions, les termes ci-dessous ont la signification suivante :',
        '• « Finjaro », « nous » : l’éditeur et exploitant de la Plateforme.',
        '• « Plateforme » : le site finjaro.net, ses sous-domaines, ses applications et l’ensemble des services associés.',
        '• « Utilisateur » : toute personne accédant à la Plateforme, qu’elle dispose ou non d’un compte.',
        '• « Acheteur » : tout Utilisateur consultant une annonce, contactant un Vendeur ou passant une commande.',
        '• « Vendeur » : tout Utilisateur, professionnel ou particulier, publiant sur la Plateforme des biens ou des services à destination des Acheteurs.',
        '• « Annonce » : toute fiche article, offre de service, vidéo ou contenu publié par un Vendeur.',
        '• « Transaction » : tout accord conclu entre un Acheteur et un Vendeur portant sur un bien ou un service présenté sur la Plateforme.',
        '• « Paiement Plateforme » : un paiement effectué au moyen des seuls modes de paiement officiellement intégrés à la Plateforme et confirmés par Finjaro dans l’interface de commande.',
        '• « Paiement Hors Plateforme » : tout autre paiement, quel qu’en soit le canal, notamment tout transfert d’argent effectué de la main à la main, par transfert mobile, par virement bancaire, par mandat, par carte prépayée, par cryptomonnaie ou par tout intermédiaire, dès lors qu’il n’a pas été initié et enregistré dans le tunnel de commande de la Plateforme.',
      ],
    },
    {
      id: 'objet',
      title: '2. Objet et nature du service',
      body: [
        'Finjaro exploite une place de marché en ligne de mise en relation. La Plateforme fournit aux Vendeurs des outils de publication, de présentation et de gestion de leur catalogue, et permet aux Acheteurs de découvrir ces offres, de contacter les Vendeurs et, le cas échéant, de passer commande.',
        'FINJARO N’EST NI VENDEUR, NI ACHETEUR, NI MANDATAIRE, NI COURTIER, NI ASSUREUR, NI TRANSPORTEUR. Finjaro n’est pas partie aux contrats conclus entre Acheteurs et Vendeurs. Le contrat de vente ou de prestation de services est formé exclusivement entre l’Acheteur et le Vendeur, qui en assument seuls l’exécution, les garanties et les conséquences.',
        'Finjaro n’a ni la propriété, ni la détention, ni le contrôle des biens présentés. Elle ne les inspecte pas, ne les authentifie pas et ne les stocke pas, sauf mention expresse et écrite contraire.',
        'Les Vendeurs publient leurs Annonces sous leur seule responsabilité. Finjaro n’effectue pas de contrôle préalable systématique du contenu des Annonces et agit à cet égard en qualité d’hébergeur.',
      ],
    },
    {
      id: 'compte',
      title: '3. Inscription, compte et sécurité',
      body: [
        'L’accès à certaines fonctionnalités requiert la création d’un compte. L’Utilisateur déclare être âgé d’au moins 18 ans, ou avoir l’âge de la majorité légale dans son pays de résidence, et disposer de la pleine capacité juridique de contracter.',
        'L’Utilisateur s’engage à fournir des informations exactes, complètes et à jour, notamment son nom, son numéro de téléphone et, le cas échéant, son adresse. Toute information volontairement erronée constitue un manquement grave aux présentes Conditions.',
        'L’Utilisateur est seul responsable de la confidentialité de ses identifiants et de toute activité effectuée depuis son compte. Il informe Finjaro sans délai, à l’adresse indiquée à l’article 20, de toute utilisation non autorisée.',
        'Finjaro peut demander à un Vendeur des documents d’identité ou des justificatifs d’activité aux fins de vérification. Le refus de fournir ces éléments peut entraîner le refus ou la suspension du statut de Vendeur.',
        'Un compte est personnel. Il ne peut être cédé, prêté, loué ni partagé sans l’accord écrit et préalable de Finjaro.',
      ],
    },
    {
      id: 'annonces',
      title: '4. Obligations des Vendeurs',
      body: [
        'Le Vendeur garantit qu’il dispose du droit de vendre les biens ou de fournir les services qu’il publie, et que ceux-ci sont conformes à la législation applicable dans son pays et dans le pays de livraison.',
        'Le Vendeur s’engage à :',
        '• décrire chaque article de manière exacte, loyale et non trompeuse, y compris s’agissant de son état, de son origine, de sa marque, de sa taille et de ses éventuels défauts ;',
        '• n’utiliser que des photographies et vidéos dont il détient les droits, ou pour lesquelles il dispose d’une autorisation valable ; l’usage d’images tirées de sites tiers, de catalogues de marques ou de réseaux sociaux sans autorisation est strictement interdit ;',
        '• afficher un prix clair et complet, ou, lorsqu’il utilise l’option « Prix sur demande », communiquer un prix ferme à l’Acheteur avant toute conclusion de la Transaction ;',
        '• honorer les commandes acceptées dans les délais annoncés, et informer l’Acheteur sans délai en cas d’indisponibilité ;',
        '• respecter ses obligations légales, fiscales, sociales et déclaratives, notamment son immatriculation lorsqu’il agit à titre professionnel ; Finjaro n’est pas responsable de ces obligations et ne procède à aucune retenue à la source ;',
        '• assurer, lorsqu’il agit à titre professionnel envers un consommateur, les garanties légales de conformité et contre les vices cachés prévues par la loi applicable.',
        'Le Vendeur reconnaît que Finjaro peut retirer une Annonce, la dépublier ou suspendre un compte en cas de manquement, sans que cela ne constitue une faute de Finjaro ni n’ouvre droit à indemnité.',
      ],
    },
    {
      id: 'acheteurs',
      title: '5. Obligations des Acheteurs',
      body: [
        'L’Acheteur s’engage à passer commande de bonne foi, à fournir des coordonnées exactes, à être présent ou représenté au moment de la livraison ou du retrait convenu, et à régler le prix convenu selon les modalités acceptées.',
        'L’Acheteur reconnaît qu’il lui appartient de vérifier, avant tout engagement, l’identité du Vendeur, la nature du bien ou du service, le prix, les délais et les conditions de livraison, ainsi que la cohérence de l’offre. Une offre anormalement basse au regard du marché doit être considérée comme un signal d’alerte.',
        'Toute annulation, tout retour et tout remboursement relèvent du contrat conclu avec le Vendeur et de la loi applicable à ce contrat.',
      ],
    },
    {
      id: 'paiements',
      title: '6. Paiements — clause essentielle',
      body: [
        '6.1. Modes de paiement reconnus. Seuls constituent des Paiements Plateforme les paiements initiés depuis le tunnel de commande de la Plateforme, par les moyens de paiement expressément proposés par Finjaro dans l’interface, et confirmés par un récapitulatif de commande enregistré sur la Plateforme. Tout autre paiement est un Paiement Hors Plateforme.',
        '6.2. Paiement à la livraison. Lorsque la Plateforme propose le paiement à la livraison ou au retrait, le règlement s’effectue directement entre l’Acheteur et le Vendeur ou son livreur. Les sommes ne transitent pas par Finjaro. Ce mode de règlement est, au sens des présentes, assimilé à un Paiement Hors Plateforme pour ce qui concerne la conservation des fonds et les recours financiers.',
        '6.3. EXCLUSION DE RESPONSABILITÉ EN CAS DE PAIEMENT HORS PLATEFORME. L’Utilisateur qui choisit de régler une Transaction par un Paiement Hors Plateforme le fait en pleine connaissance de cause, à ses risques et périls exclusifs. FINJARO N’ASSUME AUCUNE RESPONSABILITÉ, DE QUELQUE NATURE QUE CE SOIT, AU TITRE D’UN PAIEMENT HORS PLATEFORME, ET NOTAMMENT EN CAS D’ESCROQUERIE, DE FRAUDE, D’ABUS DE CONFIANCE, D’USURPATION D’IDENTITÉ, DE NON-LIVRAISON, DE LIVRAISON NON CONFORME, DE CONTREFAÇON, DE DÉFAUT DE REMBOURSEMENT, DE DISPARITION DU VENDEUR OU DE DÉTOURNEMENT DES FONDS. Finjaro ne détient pas ces fonds, n’en a aucune traçabilité et ne dispose d’aucun moyen de les bloquer, de les récupérer ou de les restituer. Aucun remboursement, aucune indemnisation, aucune garantie et aucune médiation financière ne pourront être réclamés à Finjaro à ce titre.',
        '6.4. Sollicitations de paiement hors plateforme. Il est formellement interdit à un Vendeur de solliciter un Acheteur pour un règlement en dehors des moyens de paiement officiellement proposés lorsque ceux-ci sont disponibles pour la Transaction concernée. Toute sollicitation de ce type, notamment par message privé, par téléphone ou par un réseau social, doit être signalée à Finjaro et expose son auteur à la suspension immédiate et définitive de son compte.',
        '6.5. Vigilance. Finjaro recommande expressément à ses Utilisateurs de ne jamais envoyer d’argent à l’avance à un interlocuteur non vérifié, de ne jamais communiquer de code de retrait, de code de confirmation ou de mot de passe à un tiers, de se méfier de toute demande d’acompte urgente et de conserver l’ensemble des échanges. Le non-respect de ces recommandations demeure sous la seule responsabilité de l’Utilisateur.',
        '6.6. Paiements Plateforme. Lorsque des moyens de paiement en ligne sont intégrés, ils sont opérés par des prestataires de services de paiement tiers, agréés et soumis à leurs propres conditions. Finjaro n’a pas la qualité d’établissement de paiement. Les litiges relatifs au fonctionnement technique d’un moyen de paiement relèvent du prestataire concerné.',
      ],
    },
    {
      id: 'prix',
      title: '7. Prix, devis et « Prix sur demande »',
      body: [
        'Les prix sont affichés dans la devise indiquée sur l’Annonce et s’entendent, sauf mention contraire, hors frais de livraison, hors droits de douane et hors taxes locales éventuellement dus par l’Acheteur.',
        'Le Vendeur peut activer l’option « Prix sur demande ». L’article est alors publié sans prix et l’Acheteur est invité à contacter le Vendeur. Dans ce cas, le prix ne devient contractuel qu’une fois communiqué par le Vendeur et expressément accepté par l’Acheteur.',
        'Une erreur manifeste de prix affichée sur une Annonce n’engage pas Finjaro. Le Vendeur peut la corriger avant l’exécution de la commande, l’Acheteur restant libre d’annuler sans frais.',
      ],
    },
    {
      id: 'livraison',
      title: '8. Livraison, retrait et transport',
      body: [
        'Les modalités et délais de livraison ou de retrait sont définis par le Vendeur dans l’Annonce ou lors des échanges avec l’Acheteur. Ils n’engagent que le Vendeur.',
        'Finjaro n’assure aucun transport et n’est pas commissionnaire de transport. Lorsque des partenaires logistiques ou des points relais sont mentionnés sur la Plateforme, ils interviennent sous leur propre responsabilité et selon leurs propres conditions.',
        'Les risques de perte ou d’avarie sont transférés selon la loi applicable au contrat conclu entre l’Acheteur et le Vendeur.',
        'Les opérations transfrontalières, notamment entre le Cameroun et l’Europe, peuvent donner lieu à des formalités douanières, droits et taxes à la charge de l’Acheteur, sauf accord contraire avec le Vendeur.',
      ],
    },
    {
      id: 'interdits',
      title: '9. Contenus et biens interdits',
      body: [
        'Il est interdit de publier, de proposer ou de rechercher sur la Plateforme :',
        '• des biens contrefaisants ou portant atteinte à un droit de propriété intellectuelle ;',
        '• des armes, munitions, explosifs, stupéfiants, médicaments soumis à prescription et substances réglementées ;',
        '• des espèces protégées, parties d’animaux protégés ou produits issus du braconnage ;',
        '• des documents administratifs, diplômes, pièces d’identité ou moyens de paiement, authentiques ou falsifiés ;',
        '• des contenus à caractère pornographique, pédopornographique, violent, haineux, discriminatoire, diffamatoire ou incitant à la haine ;',
        '• des services de nature illicite, y compris toute forme d’exploitation humaine ;',
        '• des offres trompeuses, des systèmes pyramidaux, des placements financiers ou toute sollicitation frauduleuse ;',
        '• des données personnelles de tiers publiées sans leur consentement.',
        'Finjaro peut retirer sans préavis tout contenu manifestement illicite ou contraire aux présentes Conditions, et signaler les faits aux autorités compétentes.',
      ],
    },
    {
      id: 'propriete',
      title: '10. Propriété intellectuelle',
      body: [
        'La Plateforme, sa charte graphique, ses textes, ses bases de données, ses développements et sa marque sont la propriété exclusive de Finjaro et sont protégés par le droit de la propriété intellectuelle. Toute reproduction, extraction ou réutilisation non autorisée est interdite.',
        'En publiant un contenu (photographie, vidéo, description, avis), l’Utilisateur garantit en détenir les droits et concède à Finjaro une licence non exclusive, mondiale, gratuite et transférable d’utilisation, de reproduction, d’adaptation technique, d’affichage et de promotion de ce contenu sur la Plateforme et sur les supports de communication de Finjaro, pour la durée de publication du contenu et pour la durée nécessaire à l’archivage légal.',
        'L’Utilisateur garantit Finjaro contre toute réclamation d’un tiers relative à un contenu qu’il a publié.',
      ],
    },
    {
      id: 'ia',
      title: '11. Fonctionnalités d’intelligence artificielle',
      body: [
        'La Plateforme met à disposition des assistants basés sur l’intelligence artificielle, destinés notamment à aider les Acheteurs dans leur recherche et les Vendeurs dans la rédaction de leurs Annonces.',
        'Les contenus produits par ces assistants sont générés automatiquement et fournis à titre indicatif. Ils peuvent comporter des inexactitudes. Il appartient au Vendeur de vérifier et de corriger toute suggestion avant publication ; il demeure seul responsable du contenu final de son Annonce. Aucune suggestion d’un assistant ne constitue un conseil juridique, fiscal, médical ou financier.',
        'Certaines requêtes peuvent être transmises à des prestataires techniques tiers pour traitement. L’Utilisateur s’abstient d’y saisir des données sensibles.',
      ],
    },
    {
      id: 'responsabilite',
      title: '12. Responsabilité de Finjaro',
      body: [
        'Finjaro s’engage à mettre en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité de la Plateforme. Cet engagement est une obligation de moyens, à l’exclusion de toute obligation de résultat.',
        'Finjaro ne garantit pas que la Plateforme sera exempte d’interruption, d’erreur ou de défaut. L’accès peut être suspendu pour maintenance, mise à jour ou raison de sécurité.',
        'Finjaro n’est en aucun cas responsable :',
        '• de la qualité, de la conformité, de la sécurité, de la légalité ou de l’authenticité des biens et services proposés par les Vendeurs ;',
        '• de la véracité des Annonces, des avis, des photographies et des informations publiées par les Utilisateurs ;',
        '• de l’exécution, de l’inexécution ou de la mauvaise exécution d’une Transaction ;',
        '• des Paiements Hors Plateforme, dans les conditions détaillées à l’article 6 ;',
        '• des comportements, agissements frauduleux ou manquements des Utilisateurs entre eux, en ligne comme hors ligne ;',
        '• des dommages indirects, tels que la perte de chiffre d’affaires, de clientèle, de données ou d’image.',
        'Dans l’hypothèse où la responsabilité de Finjaro serait néanmoins retenue au titre d’une Transaction, elle serait limitée, dans toute la mesure permise par la loi applicable, aux sommes effectivement encaissées par Finjaro au titre de cette Transaction.',
        'Les présentes limitations ne s’appliquent pas en cas de faute lourde ou dolosive de Finjaro, ni dans les cas où la loi applicable, notamment le droit de la consommation, interdit de les stipuler.',
      ],
    },
    {
      id: 'signalement',
      title: '13. Signalement et modération',
      body: [
        'Tout Utilisateur peut signaler à Finjaro une Annonce, un message ou un comportement qu’il estime illicite ou contraire aux présentes Conditions, à l’adresse indiquée à l’article 20, en précisant l’URL ou l’identifiant concerné et les motifs du signalement.',
        'Finjaro examine les signalements dans un délai raisonnable et peut, selon le cas, retirer le contenu, avertir l’Utilisateur, restreindre son accès à certaines fonctionnalités ou suspendre son compte.',
        'Tout signalement manifestement abusif ou de mauvaise foi peut lui-même donner lieu à une sanction.',
      ],
    },
    {
      id: 'suspension',
      title: '14. Suspension et résiliation',
      body: [
        'L’Utilisateur peut fermer son compte à tout moment. La fermeture ne le libère pas des engagements pris envers d’autres Utilisateurs avant celle-ci.',
        'Finjaro peut suspendre ou résilier l’accès d’un Utilisateur, sans préavis en cas de manquement grave, notamment en cas de fraude, de contenu illicite, de sollicitation de paiement contraire à l’article 6.4, d’atteinte à la sécurité de la Plateforme ou de plaintes répétées et fondées.',
        'La suspension ou la résiliation n’ouvre droit à aucune indemnité.',
      ],
    },
    {
      id: 'donnees',
      title: '15. Données personnelles',
      body: [
        'Finjaro traite les données personnelles des Utilisateurs aux fins de création et de gestion des comptes, de mise en relation, de traitement des commandes, de sécurité, de lutte contre la fraude, d’amélioration du service et de respect de ses obligations légales.',
        'Les données sont conservées pour la durée nécessaire à ces finalités, puis archivées ou supprimées conformément à la loi applicable.',
        'Conformément à la réglementation applicable, notamment au Règlement général sur la protection des données pour les Utilisateurs résidant dans l’Union européenne et à la loi camerounaise n° 2010/012 relative à la cybersécurité et à la cybercriminalité, l’Utilisateur dispose d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de ses données. Ces droits s’exercent à l’adresse indiquée à l’article 20.',
        'Certaines données peuvent être transférées à des sous-traitants techniques (hébergement, envoi de messages, paiement, intelligence artificielle) situés hors du pays de résidence de l’Utilisateur, sous réserve de garanties appropriées.',
        'Les échanges entre Acheteurs et Vendeurs peuvent être conservés aux fins de preuve, de sécurité et de traitement des litiges.',
        'Le détail des traitements (données collectées, finalités, sous-traitants, durées de conservation, droits) figure dans la Politique de confidentialité, accessible à l’adresse finjaro.net/legal/confidentialite, qui fait partie intégrante des présentes Conditions.',
      ],
    },
    {
      id: 'consommateur',
      title: '16. Droits des consommateurs',
      body: [
        'Lorsque l’Acheteur a la qualité de consommateur et que le Vendeur agit à titre professionnel, l’Acheteur bénéficie des droits impératifs prévus par la loi applicable, notamment, dans l’Union européenne, du droit de rétractation de quatorze jours pour les ventes à distance, sous réserve des exceptions légales, et des garanties légales de conformité.',
        'Ces droits s’exercent auprès du Vendeur, qui en est le débiteur. Aucune stipulation des présentes Conditions ne peut avoir pour effet de priver un consommateur des droits que la loi lui reconnaît de manière impérative.',
      ],
    },
    {
      id: 'gratuite',
      title: '17. Tarification du service Finjaro',
      body: [
        'L’inscription et la publication d’Annonces sont gratuites, sauf indication contraire portée à la connaissance des Vendeurs.',
        'Finjaro se réserve la faculté d’introduire des services payants, des abonnements ou une commission sur les Transactions réglées par Paiement Plateforme. Toute tarification sera communiquée de manière claire et préalable, et ne s’appliquera qu’aux Transactions postérieures à son entrée en vigueur.',
      ],
    },
    {
      id: 'modification',
      title: '18. Modification des Conditions',
      body: [
        'Finjaro peut modifier les présentes Conditions pour tenir compte de l’évolution de ses services, de la législation ou de la jurisprudence.',
        'La version applicable est celle publiée sur la Plateforme au jour de l’utilisation. En cas de modification substantielle, les Utilisateurs disposant d’un compte en sont informés par un moyen approprié. La poursuite de l’utilisation de la Plateforme après cette information vaut acceptation des Conditions modifiées.',
      ],
    },
    {
      id: 'divers',
      title: '19. Dispositions diverses',
      body: [
        'Si l’une des stipulations des présentes Conditions était déclarée nulle ou inapplicable, les autres stipulations demeureraient pleinement en vigueur.',
        'Le fait pour Finjaro de ne pas se prévaloir d’un manquement ne vaut pas renonciation à s’en prévaloir ultérieurement.',
        'Les présentes Conditions expriment l’intégralité de l’accord entre Finjaro et l’Utilisateur relativement à l’usage de la Plateforme.',
        'Les registres informatisés de Finjaro sont admis comme mode de preuve des connexions, des publications et des commandes, sauf preuve contraire.',
        'En cas de divergence entre la version française et la version anglaise des présentes Conditions, la version française prévaut.',
      ],
    },
    {
      id: 'litiges',
      title: '20. Droit applicable, litiges et contact',
      body: [
        'Les présentes Conditions sont régies par le droit camerounais, sans préjudice des dispositions impératives plus favorables dont bénéficierait un Utilisateur consommateur en vertu de la loi de son pays de résidence habituelle.',
        'En cas de différend, les parties s’efforceront de trouver une solution amiable. L’Utilisateur peut adresser sa réclamation à Finjaro, qui s’engage à y répondre dans un délai raisonnable.',
        'À défaut d’accord amiable, le litige sera porté devant les juridictions compétentes de Douala, Cameroun, sous réserve, pour l’Utilisateur consommateur résidant dans l’Union européenne, de la faculté de saisir la juridiction de son lieu de domicile.',
        `Contact : ${CONTACT_EMAIL}`,
      ],
    },
  ],
};

const en = {
  title: 'Terms of Use and Sale',
  updatedLabel: 'Last updated',
  updatedAt: '4 August 2026',
  versionLabel: 'Version',
  draftNotice:
    'This document is being finalised with legal counsel. It applies to Finjaro users as of today and may be refined after legal review.',
  preamble: [
    'These Terms of Use and Sale (the “Terms”) govern access to and use of the Finjaro platform, available at finjaro.net and through its mobile and desktop applications (the “Platform”).',
    'By creating an account, browsing the Platform, publishing a listing or placing an order, you acknowledge that you have read, understood and unreservedly accepted these Terms in full. If you do not accept them, you must stop using the Platform immediately.',
  ],
  sections: [
    {
      id: 'definitions',
      title: '1. Definitions',
      body: [
        'In these Terms, the following words have the following meaning:',
        '• “Finjaro”, “we”: the publisher and operator of the Platform.',
        '• “Platform”: the finjaro.net website, its subdomains, its applications and all related services.',
        '• “User”: any person accessing the Platform, with or without an account.',
        '• “Buyer”: any User viewing a listing, contacting a Seller or placing an order.',
        '• “Seller”: any User, whether a business or a private individual, publishing goods or services on the Platform.',
        '• “Listing”: any product page, service offer, video or content published by a Seller.',
        '• “Transaction”: any agreement between a Buyer and a Seller regarding a good or service presented on the Platform.',
        '• “Platform Payment”: a payment made using only the payment methods officially integrated into the Platform and confirmed by Finjaro in the checkout interface.',
        '• “Off-Platform Payment”: any other payment, through any channel, including cash handed over in person, mobile money transfer, bank transfer, money order, prepaid card, cryptocurrency or any intermediary, where the payment was not initiated and recorded in the Platform checkout flow.',
      ],
    },
    {
      id: 'objet',
      title: '2. Purpose and nature of the service',
      body: [
        'Finjaro operates an online marketplace that connects people. The Platform gives Sellers tools to publish, present and manage their catalogue, and lets Buyers discover those offers, contact Sellers and, where applicable, place orders.',
        'FINJARO IS NOT A SELLER, A BUYER, AN AGENT, A BROKER, AN INSURER OR A CARRIER. Finjaro is not a party to the contracts entered into between Buyers and Sellers. The contract of sale or of services is formed exclusively between the Buyer and the Seller, who alone bear its performance, its warranties and its consequences.',
        'Finjaro neither owns, holds nor controls the goods presented. It does not inspect, authenticate or store them, unless expressly agreed otherwise in writing.',
        'Sellers publish their Listings under their sole responsibility. Finjaro does not systematically review Listing content in advance and acts in this respect as a hosting provider.',
      ],
    },
    {
      id: 'compte',
      title: '3. Registration, account and security',
      body: [
        'Access to certain features requires an account. The User declares that they are at least 18 years old, or of legal age in their country of residence, and have full legal capacity to contract.',
        'The User undertakes to provide accurate, complete and up-to-date information, in particular their name, phone number and, where applicable, their address. Knowingly false information is a serious breach of these Terms.',
        'The User is solely responsible for keeping their credentials confidential and for all activity carried out from their account. They must inform Finjaro without delay, at the address given in section 20, of any unauthorised use.',
        'Finjaro may ask a Seller for identity documents or proof of business activity for verification purposes. Refusal to provide them may result in the refusal or suspension of Seller status.',
        'An account is personal. It may not be assigned, lent, rented or shared without Finjaro’s prior written consent.',
      ],
    },
    {
      id: 'annonces',
      title: '4. Seller obligations',
      body: [
        'The Seller warrants that they have the right to sell the goods or provide the services they publish, and that these comply with the law applicable in their country and in the country of delivery.',
        'The Seller undertakes to:',
        '• describe each item accurately, fairly and without misleading the Buyer, including as to its condition, origin, brand, size and any defects;',
        '• use only photographs and videos to which they hold the rights, or for which they have valid permission; using images taken from third-party websites, brand catalogues or social media without permission is strictly prohibited;',
        '• display a clear and complete price or, when using the “Price on request” option, communicate a firm price to the Buyer before any Transaction is concluded;',
        '• fulfil accepted orders within the announced timeframe, and inform the Buyer without delay if an item is unavailable;',
        '• comply with their legal, tax, social security and reporting obligations, in particular business registration where they act in a professional capacity; Finjaro is not responsible for these obligations and does not withhold tax at source;',
        '• provide, where acting professionally towards a consumer, the statutory warranties of conformity and against hidden defects under applicable law.',
        'The Seller acknowledges that Finjaro may remove a Listing, unpublish it or suspend an account in the event of a breach, without this constituting fault on Finjaro’s part or giving rise to compensation.',
      ],
    },
    {
      id: 'acheteurs',
      title: '5. Buyer obligations',
      body: [
        'The Buyer undertakes to order in good faith, to provide accurate contact details, to be present or represented at the agreed delivery or collection, and to pay the agreed price under the accepted terms.',
        'The Buyer acknowledges that it is their responsibility to check, before committing, the Seller’s identity, the nature of the good or service, the price, the timeframe and delivery conditions, and the overall consistency of the offer. An abnormally low price compared with the market must be treated as a warning sign.',
        'Cancellations, returns and refunds are governed by the contract with the Seller and by the law applicable to that contract.',
      ],
    },
    {
      id: 'paiements',
      title: '6. Payments — key clause',
      body: [
        '6.1. Recognised payment methods. Only payments initiated from the Platform checkout flow, using payment methods expressly offered by Finjaro in the interface, and confirmed by an order summary recorded on the Platform, are Platform Payments. Any other payment is an Off-Platform Payment.',
        '6.2. Cash on delivery. Where the Platform offers payment on delivery or on collection, payment is made directly between the Buyer and the Seller or their courier. The funds do not pass through Finjaro. For the purposes of these Terms, such payment is treated as an Off-Platform Payment as regards the holding of funds and financial recourse.',
        '6.3. EXCLUSION OF LIABILITY FOR OFF-PLATFORM PAYMENTS. A User who chooses to settle a Transaction by an Off-Platform Payment does so knowingly and at their own exclusive risk. FINJARO ACCEPTS NO LIABILITY WHATSOEVER IN RESPECT OF AN OFF-PLATFORM PAYMENT, INCLUDING IN CASES OF SCAM, FRAUD, BREACH OF TRUST, IDENTITY THEFT, NON-DELIVERY, NON-CONFORMING DELIVERY, COUNTERFEITING, FAILURE TO REFUND, DISAPPEARANCE OF THE SELLER OR MISAPPROPRIATION OF FUNDS. Finjaro does not hold such funds, has no traceability over them and has no means of freezing, recovering or returning them. No refund, compensation, guarantee or financial mediation may be claimed from Finjaro on that basis.',
        '6.4. Requests to pay off-platform. A Seller is strictly prohibited from asking a Buyer to pay outside the officially offered payment methods where those methods are available for the Transaction concerned. Any such request, in particular by private message, by phone or through a social network, must be reported to Finjaro and exposes its author to immediate and permanent account suspension.',
        '6.5. Vigilance. Finjaro expressly recommends that Users never send money in advance to an unverified counterparty, never disclose a withdrawal code, confirmation code or password to a third party, treat urgent deposit requests with suspicion, and keep all correspondence. Failure to follow these recommendations remains the User’s sole responsibility.',
        '6.6. Platform Payments. Where online payment methods are integrated, they are operated by licensed third-party payment service providers subject to their own terms. Finjaro is not a payment institution. Disputes concerning the technical operation of a payment method fall to the provider concerned.',
      ],
    },
    {
      id: 'prix',
      title: '7. Prices, quotes and “Price on request”',
      body: [
        'Prices are displayed in the currency shown on the Listing and are, unless stated otherwise, exclusive of delivery costs, customs duties and any local taxes payable by the Buyer.',
        'A Seller may enable the “Price on request” option. The item is then published without a price and the Buyer is invited to contact the Seller. In that case the price becomes contractual only once communicated by the Seller and expressly accepted by the Buyer.',
        'An obvious pricing error shown on a Listing does not bind Finjaro. The Seller may correct it before the order is fulfilled, and the Buyer remains free to cancel at no cost.',
      ],
    },
    {
      id: 'livraison',
      title: '8. Delivery, collection and transport',
      body: [
        'Delivery or collection terms and timeframes are set by the Seller in the Listing or in discussions with the Buyer. They bind the Seller only.',
        'Finjaro does not carry out transport and is not a freight forwarder. Where logistics partners or pickup points are mentioned on the Platform, they act under their own responsibility and their own terms.',
        'Risk of loss or damage passes in accordance with the law applicable to the contract between Buyer and Seller.',
        'Cross-border transactions, in particular between Cameroon and Europe, may give rise to customs formalities, duties and taxes payable by the Buyer, unless agreed otherwise with the Seller.',
      ],
    },
    {
      id: 'interdits',
      title: '9. Prohibited content and goods',
      body: [
        'It is prohibited to publish, offer or seek on the Platform:',
        '• counterfeit goods or goods infringing an intellectual property right;',
        '• weapons, ammunition, explosives, narcotics, prescription medicines and regulated substances;',
        '• protected species, parts of protected animals or products of poaching;',
        '• administrative documents, diplomas, identity papers or means of payment, whether genuine or falsified;',
        '• pornographic, child-abuse, violent, hateful, discriminatory, defamatory or hate-inciting content;',
        '• unlawful services of any kind, including any form of human exploitation;',
        '• misleading offers, pyramid schemes, financial investments or any fraudulent solicitation;',
        '• third parties’ personal data published without their consent.',
        'Finjaro may remove without notice any content that is manifestly unlawful or contrary to these Terms, and report the facts to the competent authorities.',
      ],
    },
    {
      id: 'propriete',
      title: '10. Intellectual property',
      body: [
        'The Platform, its visual identity, texts, databases, developments and brand are the exclusive property of Finjaro and are protected by intellectual property law. Any unauthorised reproduction, extraction or reuse is prohibited.',
        'By publishing content (photograph, video, description, review), the User warrants that they hold the rights to it and grants Finjaro a non-exclusive, worldwide, royalty-free and transferable licence to use, reproduce, technically adapt, display and promote that content on the Platform and in Finjaro’s communication materials, for as long as the content remains published and for the period required for legal archiving.',
        'The User indemnifies Finjaro against any third-party claim relating to content they have published.',
      ],
    },
    {
      id: 'ia',
      title: '11. Artificial intelligence features',
      body: [
        'The Platform provides AI-based assistants, intended in particular to help Buyers search and Sellers write their Listings.',
        'Content produced by these assistants is generated automatically and provided for guidance only. It may contain inaccuracies. It is the Seller’s responsibility to check and correct any suggestion before publishing; the Seller remains solely responsible for the final content of their Listing. No assistant suggestion constitutes legal, tax, medical or financial advice.',
        'Some queries may be sent to third-party technical providers for processing. Users must not enter sensitive data.',
      ],
    },
    {
      id: 'responsabilite',
      title: '12. Finjaro’s liability',
      body: [
        'Finjaro undertakes to use reasonable efforts to keep the Platform available and secure. This is an obligation of means, not of result.',
        'Finjaro does not warrant that the Platform will be free from interruption, error or defect. Access may be suspended for maintenance, updates or security reasons.',
        'Finjaro is in no case liable for:',
        '• the quality, conformity, safety, legality or authenticity of goods and services offered by Sellers;',
        '• the accuracy of Listings, reviews, photographs and information published by Users;',
        '• the performance, non-performance or defective performance of a Transaction;',
        '• Off-Platform Payments, as detailed in section 6;',
        '• the conduct, fraudulent acts or breaches of Users towards one another, online or offline;',
        '• indirect damage, such as loss of revenue, customers, data or reputation.',
        'Should Finjaro nevertheless be held liable in connection with a Transaction, its liability shall be limited, to the fullest extent permitted by applicable law, to the sums actually collected by Finjaro in respect of that Transaction.',
        'These limitations do not apply in cases of gross negligence or wilful misconduct by Finjaro, nor where applicable law, in particular consumer law, prohibits such stipulations.',
      ],
    },
    {
      id: 'signalement',
      title: '13. Reporting and moderation',
      body: [
        'Any User may report to Finjaro a Listing, message or behaviour they consider unlawful or contrary to these Terms, at the address given in section 20, stating the URL or identifier concerned and the reasons for the report.',
        'Finjaro reviews reports within a reasonable time and may, as appropriate, remove the content, warn the User, restrict access to certain features or suspend the account.',
        'Any manifestly abusive or bad-faith report may itself lead to a sanction.',
      ],
    },
    {
      id: 'suspension',
      title: '14. Suspension and termination',
      body: [
        'A User may close their account at any time. Closure does not release them from commitments made to other Users beforehand.',
        'Finjaro may suspend or terminate a User’s access, without notice in the event of a serious breach, in particular fraud, unlawful content, payment solicitation contrary to section 6.4, attacks on the security of the Platform, or repeated and well-founded complaints.',
        'Suspension or termination does not give rise to any compensation.',
      ],
    },
    {
      id: 'donnees',
      title: '15. Personal data',
      body: [
        'Finjaro processes Users’ personal data in order to create and manage accounts, connect Users, process orders, ensure security, combat fraud, improve the service and comply with its legal obligations.',
        'Data is kept for as long as necessary for those purposes, then archived or deleted in accordance with applicable law.',
        'In accordance with applicable regulations, in particular the General Data Protection Regulation for Users resident in the European Union and Cameroonian law no. 2010/012 on cybersecurity and cybercrime, Users have rights of access, rectification, erasure, restriction, objection and portability. These rights are exercised at the address given in section 20.',
        'Some data may be transferred to technical processors (hosting, messaging, payment, artificial intelligence) located outside the User’s country of residence, subject to appropriate safeguards.',
        'Exchanges between Buyers and Sellers may be retained for evidential, security and dispute-handling purposes.',
        'Full details of the processing (data collected, purposes, processors, retention periods, rights) are set out in the Privacy Policy, available at finjaro.net/legal/confidentialite, which forms an integral part of these Terms.',
      ],
    },
    {
      id: 'consommateur',
      title: '16. Consumer rights',
      body: [
        'Where the Buyer is a consumer and the Seller acts in a professional capacity, the Buyer has the mandatory rights provided by applicable law, including, in the European Union, a fourteen-day right of withdrawal for distance sales, subject to statutory exceptions, and the statutory warranties of conformity.',
        'These rights are exercised against the Seller, who owes them. Nothing in these Terms may deprive a consumer of rights granted to them on a mandatory basis by law.',
      ],
    },
    {
      id: 'gratuite',
      title: '17. Pricing of the Finjaro service',
      body: [
        'Registration and publishing Listings are free, unless Sellers are informed otherwise.',
        'Finjaro reserves the right to introduce paid services, subscriptions or a commission on Transactions settled by Platform Payment. Any pricing will be communicated clearly and in advance, and will apply only to Transactions occurring after it takes effect.',
      ],
    },
    {
      id: 'modification',
      title: '18. Changes to the Terms',
      body: [
        'Finjaro may amend these Terms to reflect changes in its services, in legislation or in case law.',
        'The applicable version is the one published on the Platform on the day of use. In the event of a material change, account holders will be informed by an appropriate means. Continued use of the Platform after such notice constitutes acceptance of the amended Terms.',
      ],
    },
    {
      id: 'divers',
      title: '19. Miscellaneous',
      body: [
        'If any provision of these Terms is held void or unenforceable, the remaining provisions remain in full force.',
        'Finjaro’s failure to invoke a breach does not amount to a waiver of its right to invoke it later.',
        'These Terms constitute the entire agreement between Finjaro and the User regarding use of the Platform.',
        'Finjaro’s computer records are admissible as evidence of connections, publications and orders, absent evidence to the contrary.',
        'In the event of any discrepancy between the French and English versions of these Terms, the French version prevails.',
      ],
    },
    {
      id: 'litiges',
      title: '20. Governing law, disputes and contact',
      body: [
        'These Terms are governed by Cameroonian law, without prejudice to any more favourable mandatory provisions available to a consumer User under the law of their country of habitual residence.',
        'In the event of a dispute, the parties will endeavour to reach an amicable solution. Users may send their complaint to Finjaro, which undertakes to reply within a reasonable time.',
        'Failing an amicable agreement, the dispute will be brought before the competent courts of Douala, Cameroon, subject, for consumer Users resident in the European Union, to their right to bring proceedings in the courts of their domicile.',
        `Contact: ${CONTACT_EMAIL}`,
      ],
    },
  ],
};

export const TERMS = { fr, en };

export function termsFor(language) {
  return String(language || '').startsWith('en') ? en : fr;
}
