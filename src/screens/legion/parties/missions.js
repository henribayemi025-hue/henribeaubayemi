// LEGION — la bibliothèque de missions (idées 38, 43, 77, 80, 81, 82, 84,
// 85, 89, 91, 92, 96, 97, 99, 174 et 185 des 200, 24/09).
//
// Chaque mission est une tâche prête : ce qu'elle produit, qui la fait (les
// mots cherchés dans le poste, le mandat, le département), à quel rythme.
// Le texte devient celui de la tâche : c'est lui que l'agent lit le matin.
// Les règles de la maison y sont rappelées quand elles comptent : aucun
// chiffre inventé, aucune image prise sur le web, un juriste humain relit
// ce qui engage, rien n'est envoyé sans le fondateur.

export const MISSIONS = [
  {
    cle: 'dette-technique', emoji: '🧹', rythme: 'semaine', source: 'github',
    roles: ['technique', 'developp', 'cto', 'ingenieur', 'engineer', 'code'],
    titre: { fr: 'Audit de la dette technique', en: 'Technical debt audit' },
    texte: {
      fr: "Audit de la dette technique de la semaine : à partir des derniers changements et des tickets du dépôt branché, liste les trois dettes qui coûtent le plus (fichier ou module, pourquoi, risque si on ne fait rien) et une proposition de correction chacune, par ordre de priorité. Si le dépôt n'est pas branché, dis-le et arrête-toi là.",
      en: "This week's technical debt audit: from the latest changes and tickets in the connected repository, list the three most costly debts (file or module, why, risk if left alone) with one fix proposal each, in priority order. If no repository is connected, say so and stop there.",
    },
  },
  {
    cle: 'changelog', emoji: '📰', rythme: 'semaine', source: 'github',
    roles: ['produit', 'product', 'contenu', 'communication', 'technique'],
    titre: { fr: 'Nouveautés de la semaine pour les utilisateurs', en: "This week's changes for users" },
    texte: {
      fr: "Écris les nouveautés de la semaine pour les utilisateurs, à partir des changements du dépôt branché : trois à six lignes simples, ce que ça change pour eux (pas le détail technique). Rien d'inventé : si un changement n'est pas clair, laisse-le de côté. Si le dépôt n'est pas branché, dis-le.",
      en: "Write this week's changes for users from the connected repository: three to six plain lines on what it changes for them (no technical detail). Nothing made up: leave out anything unclear. If no repository is connected, say so.",
    },
  },
  {
    cle: 'campagne', emoji: '📣', rythme: null,
    roles: ['marketing', 'publicit', 'acquisition', 'growth', 'communication'],
    titre: { fr: 'Campagne publicitaire complète', en: 'Full ad campaign' },
    texte: {
      fr: "Prépare une campagne publicitaire complète : l'objectif, le public visé (qui, où, pourquoi eux), trois accroches, les textes pour chaque réseau, le budget proposé par poste et comment on saura si ça marche. Pour les visuels : un brief précis pour la personne qui fera les photos ou les images — jamais une image prise sur Internet.",
      en: "Prepare a full ad campaign: goal, audience (who, where, why them), three hooks, copy for each network, proposed budget per line and how we'll know it works. For visuals: a precise brief for whoever makes the photos or images — never an image taken from the internet.",
    },
  },
  {
    cle: 'business-plan', emoji: '📈', rythme: 'mois',
    roles: ['financ', 'strateg', 'direct', 'ceo', 'daf', 'cfo'],
    titre: { fr: 'Business plan mis à jour', en: 'Updated business plan' },
    texte: {
      fr: "Mets à jour le business plan du mois : reprends les chiffres MESURÉS disponibles (mesures, boutique, comptabilité branchées) et ce qui a changé depuis le mois dernier ; revois les hypothèses qui ne tiennent plus. Chaque chiffre dit d'où il vient ; ce qui est une hypothèse est écrit comme une hypothèse.",
      en: "Update this month's business plan: take the MEASURED figures available (connected metrics, shop, accounting) and what changed since last month; revise assumptions that no longer hold. Every figure says where it comes from; assumptions are written as assumptions.",
    },
  },
  {
    cle: 'charte', emoji: '🎨', rythme: null,
    roles: ['marque', 'brand', 'design', 'marketing', 'communication'],
    titre: { fr: 'Charte graphique et kit marketing', en: 'Brand guide and marketing kit' },
    texte: {
      fr: "Écris la charte de la marque et le kit marketing : le ton, les mots à employer et à éviter, les couleurs et typographies proposées (avec leurs codes), la présentation en une phrase, en un paragraphe, et une fiche pour la presse. Pour les images : un brief, pas d'image prise sur Internet.",
      en: "Write the brand guide and marketing kit: tone, words to use and avoid, proposed colours and typefaces (with codes), a one-line and one-paragraph pitch, and a press sheet. For images: a brief, no image taken from the internet.",
    },
  },
  {
    cle: 'retours-utilisateurs', emoji: '💬', rythme: 'semaine',
    roles: ['produit', 'product', 'client', 'support', 'experience'],
    titre: { fr: 'Retours des utilisateurs → propositions', en: 'User feedback → proposals' },
    texte: {
      fr: "Lis les retours des utilisateurs de la semaine (avis de la boutique branchée, messages, documents) et regroupe-les par thème, avec combien de fois chacun revient. Pour les trois thèmes les plus fréquents, une proposition produit concrète. Ne compte que ce que tu as lu ; s'il n'y a pas de retours, dis-le.",
      en: "Read this week's user feedback (connected shop reviews, messages, documents) and group it by theme with how often each comes up. For the three most frequent themes, one concrete product proposal. Count only what you actually read; if there is no feedback, say so.",
    },
  },
  {
    cle: 'contrat', emoji: '⚖️', rythme: null,
    roles: ['jurid', 'legal', 'avocat', 'contrat', 'conformit'],
    titre: { fr: 'Conditions générales / contrat type', en: 'Terms and conditions / standard contract' },
    texte: {
      fr: "Rédige un projet de conditions générales (ou du contrat type demandé) adapté à notre activité et aux pays où nous vendons : les clauses essentielles, en langage clair, et la liste de ce qu'un avocat doit vérifier. C'est un PROJET : il n'est utilisé qu'après relecture par un avocat.",
      en: "Draft terms and conditions (or the requested standard contract) suited to our business and the countries we sell in: key clauses in plain language, and the list of what a lawyer must check. It is a DRAFT: only used after a lawyer reviews it.",
    },
  },
  {
    cle: 'crise', emoji: '🚨', rythme: null,
    roles: ['communication', 'presse', 'relations', 'direct'],
    titre: { fr: 'Plan de communication de crise', en: 'Crisis communication plan' },
    texte: {
      fr: "Prépare le plan de communication de crise : les cinq crises les plus probables pour nous, et pour chacune qui parle, le premier message (prêt à adapter), les canaux, ce qu'on ne dit jamais, et la liste de qui prévenir dans la première heure.",
      en: "Prepare the crisis communication plan: the five most likely crises for us and, for each, who speaks, the first message (ready to adapt), the channels, what we never say, and who to alert in the first hour.",
    },
  },
  {
    cle: 'lettre', emoji: '✉️', rythme: 'semaine',
    roles: ['contenu', 'content', 'redact', 'communication', 'marketing'],
    titre: { fr: "Lettre d'information de la semaine", en: "This week's newsletter" },
    texte: {
      fr: "Rédige la lettre d'information de la semaine : un objet, trois courtes rubriques (ce qui est nouveau, un conseil utile, une invitation à agir), à partir de ce que l'équipe a vraiment fait. C'est un brouillon : rien n'est envoyé sans le fondateur.",
      en: "Write this week's newsletter: a subject line, three short sections (what's new, one useful tip, a call to action), based on what the team actually did. It is a draft: nothing is sent without the founder.",
    },
  },
  {
    cle: 'personas', emoji: '🧑‍🤝‍🧑', rythme: null,
    roles: ['marketing', 'produit', 'etude', 'research', 'client'],
    titre: { fr: 'Personas sur données réelles', en: 'Personas from real data' },
    texte: {
      fr: "Construis trois à cinq personas à partir des données réelles disponibles (boutique, mesures, documents, retours) : qui ils sont, ce qu'ils cherchent, ce qui les freine, où les trouver. Chaque trait dit sur quoi il repose ; ce qui est supposé est écrit comme supposé.",
      en: "Build three to five personas from the real data available (shop, metrics, documents, feedback): who they are, what they want, what holds them back, where to find them. Each trait says what it rests on; assumptions are marked as such.",
    },
  },
  {
    cle: 'seo', emoji: '🔎', rythme: 'mois', source: 'web',
    roles: ['seo', 'marketing', 'contenu', 'acquisition', 'growth'],
    titre: { fr: 'Audit SEO et mots-clés', en: 'SEO and keyword audit' },
    texte: {
      fr: "Fais l'audit SEO du mois : cherche sur Internet comment on apparaît et comment apparaissent deux concurrents, propose dix mots-clés à viser (avec pourquoi), et les trois pages à écrire ou à corriger en premier. Cite tes sources ; pas de volume de recherche inventé.",
      en: "Run this month's SEO audit: search the web for how we and two competitors show up, propose ten keywords to target (with why), and the first three pages to write or fix. Cite sources; no made-up search volumes.",
    },
  },
  {
    cle: 'risques', emoji: '🛡️', rythme: 'mois',
    roles: ['risque', 'risk', 'conformit', 'financ', 'direct', 'operation'],
    titre: { fr: 'Matrice des risques', en: 'Risk matrix' },
    texte: {
      fr: "Mets à jour la matrice des risques : chaque risque avec sa probabilité et son impact (faible, moyen, fort), ce qui a changé depuis le mois dernier, la parade et qui la porte. Les nouveaux risques d'abord.",
      en: "Update the risk matrix: each risk with likelihood and impact (low, medium, high), what changed since last month, the mitigation and its owner. New risks first.",
    },
  },
  {
    cle: 'fidelisation', emoji: '🤝', rythme: null,
    roles: ['marketing', 'client', 'crm', 'fidel', 'growth'],
    titre: { fr: 'Parrainage et fidélisation', en: 'Referral and loyalty' },
    texte: {
      fr: "Conçois un programme de parrainage et de fidélisation : le mécanisme, ce que gagnent le parrain et le filleul, ce qu'il coûte au maximum, comment on évite les abus, et comment on mesurera s'il marche.",
      en: "Design a referral and loyalty programme: the mechanism, what referrer and referee get, its maximum cost, how abuse is prevented, and how we'll measure whether it works.",
    },
  },
  {
    cle: 'gamification', emoji: '🎮', rythme: null,
    roles: ['produit', 'product', 'design', 'ux', 'experience'],
    titre: { fr: 'Gamification du produit', en: 'Product gamification' },
    texte: {
      fr: "Propose une gamification utile du produit : trois mécaniques (défi, progression, récompense) liées à ce que l'utilisateur veut vraiment faire, ce qu'on mesure pour savoir si ça aide, et ce qu'on évite (manipulation, fausses urgences).",
      en: "Propose useful gamification for the product: three mechanics (challenge, progress, reward) tied to what users really want to do, what we measure to know it helps, and what we avoid (manipulation, fake urgency).",
    },
  },
  {
    cle: 'livre-blanc', emoji: '📘', rythme: 'an',
    roles: ['contenu', 'communication', 'direct', 'strateg', 'marketing'],
    titre: { fr: 'Livre blanc annuel', en: 'Annual white paper' },
    texte: {
      fr: "Écris le livre blanc de l'année : ce que nous avons appris sur notre marché, nos chiffres mesurés de l'année (avec leur source), trois convictions pour l'année qui vient. Plan d'abord, puis le texte. Rien d'inventé.",
      en: "Write this year's white paper: what we learned about our market, our measured figures for the year (with sources), three convictions for the year ahead. Outline first, then the text. Nothing made up.",
    },
  },
  {
    cle: 'brevet', emoji: '💡', rythme: null,
    roles: ['jurid', 'propriete', 'brevet', 'technique', 'r&d', 'recherche'],
    titre: { fr: 'Projet de brevet', en: 'Patent draft' },
    texte: {
      fr: "Rédige un projet de dépôt de brevet pour l'invention décrite par le fondateur : le problème, la solution, ce qui est nouveau, les revendications proposées, et ce qu'il faut vérifier dans l'art antérieur. C'est un PROJET : un conseil en propriété industrielle le relit avant tout dépôt.",
      en: "Draft a patent filing for the invention described by the founder: problem, solution, what is new, proposed claims, and what must be checked in prior art. It is a DRAFT: a patent attorney reviews it before any filing.",
    },
  },
];

// Qui fait la mission : l'agent allumé dont le poste, le mandat ou le
// département contient le plus de mots de la mission ; sinon un responsable.
export function agentPour(mission, agents, sansAccent) {
  const libres = agents.filter((a) => !a.user_id && a.moteur !== 'claude-code');
  const score = (a) => {
    const texte = sansAccent(`${a.poste || ''} ${a.mandat || ''} ${a.departement || ''}`);
    return mission.roles.reduce((s, r) => s + (texte.includes(r) ? 1 : 0), 0) + (a.actif ? 0.5 : 0);
  };
  const trie = [...libres].sort((a, b) => score(b) - score(a) || Number(b.est_directeur) - Number(a.est_directeur));
  return trie[0] || null;
}
