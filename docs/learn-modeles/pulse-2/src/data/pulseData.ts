import { GitHubRepo, AIPrompt, NewsArticle } from '../types';

export const GITHUB_REPOS: GitHubRepo[] = [
  {
    id: 'vllm',
    name: 'vllm',
    owner: 'vllm-project',
    description: 'Moteur d’inférence ultra-performant pour LLMs avec gestion novatrice de la mémoire par pagination (PagedAttention).',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'C++', color: '#f34b7d' },
      { name: 'CUDA', color: '#3A4E3A' }
    ],
    stars: 39420,
    todayStars: 780,
    forks: 5810,
    url: 'https://github.com/vllm-project/vllm',
    category: 'LLM'
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    owner: 'deepseek-ai',
    description: 'Modèle MoE de 671 milliards de paramètres avec Multi-head Latent Attention (MLA) et entraînement FP8 ultra-optimisé.',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'Triton', color: '#00599C' }
    ],
    stars: 58930,
    todayStars: 1640,
    forks: 7320,
    url: 'https://github.com/deepseek-ai/DeepSeek-V3',
    category: 'LLM'
  },
  {
    id: 'browser-use',
    name: 'browser-use',
    owner: 'browser-use',
    description: 'Permettez à vos agents IA d’interagir naturellement avec le web : clics, navigation DOM, extraction et formulaires.',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'HTML', color: '#e34c26' }
    ],
    stars: 31200,
    todayStars: 940,
    forks: 3190,
    url: 'https://github.com/browser-use/browser-use',
    category: 'Agents'
  },
  {
    id: 'autogpt',
    name: 'AutoGPT',
    owner: 'Significant-Gravitas',
    description: 'Plateforme unifiée d’orchestration pour déployer et connecter des équipes d’agents autonomes et modulaires.',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'TypeScript', color: '#3178c6' }
    ],
    stars: 168400,
    todayStars: 310,
    forks: 43200,
    url: 'https://github.com/Significant-Gravitas/AutoGPT',
    category: 'Agents'
  },
  {
    id: 'shadcn-ai',
    name: 'ui-ai-components',
    owner: 'shadcn',
    description: 'Collection de composants React/Tailwind pour interfaces génératives : stream de tokens, chat multimodal, canevas infini.',
    languages: [
      { name: 'TypeScript', color: '#3178c6' },
      { name: 'React', color: '#61dafb' }
    ],
    stars: 21450,
    todayStars: 890,
    forks: 1840,
    url: 'https://github.com/shadcn/ui',
    category: 'UI'
  },
  {
    id: 'anthropic-cookbook',
    name: 'anthropic-cookbook',
    owner: 'anthropics',
    description: 'Guides d’implémentation, patterns d’architecture système et recettes prêtes à l’emploi pour Claude 3.5 Sonnet.',
    languages: [
      { name: 'Jupyter', color: '#DA5B0B' },
      { name: 'Python', color: '#3572A5' }
    ],
    stars: 16800,
    todayStars: 430,
    forks: 2100,
    url: 'https://github.com/anthropics/anthropic-cookbook',
    category: 'Tooling'
  }
];

export const AI_PROMPTS: AIPrompt[] = [
  {
    id: 'claude-orchestrator',
    title: 'Architecte Multi-Agents & Décomposition de Tâches',
    modelBadge: 'Astuce Claude 3.5 Sonnet',
    modelFamily: 'claude',
    shortDesc: 'Structure des pipelines décisionnels complexes en générant un graphe d’agents spécialisés avec critères de validation stricts.',
    category: 'Prompt Engineering & Architecture',
    tokenCount: 382,
    efficiencyRating: '99.4% sans hallucination',
    variables: [
      { name: 'DOMAINE', defaultValue: 'Architecture Cloud Distribuée', description: 'Le sujet ou secteur d\'application cible' },
      { name: 'CONTRAINTE_TEMPS', defaultValue: 'Temps réel (< 150ms)', description: 'SLA ou limite opérationnelle critique' },
      { name: 'FORMAT_SORTIE', defaultValue: 'JSON Strict + Diagramme Mermaid', description: 'Format attendu par le système' }
    ],
    template: `Tu agis en tant qu'Architecte Principal Spécialiste des Systèmes d'Agents Autonomes.

[CONTEXTE ET MISSION] :
Décompose le problème complexe suivant dans le domaine : {{DOMAINE}}.
L'objectif est d'éliminer toute ambiguïté opérationnelle sous la contrainte : {{CONTRAINTE_TEMPS}}.

[RÈGLES D'OR D'EXÉCUTION] :
1. Crée exactement 3 sous-agents :
   - Agent A (Perception & Parsing) : normalise les flux bruts.
   - Agent B (Raisonnement & Inférence) : applique la logique métier sans état.
   - Agent C (Validation & Synthèse) : audite les invariants de sécurité.
2. Pour chaque agent, spécifie :
   • Contrat d'interface d'entrée et de sortie typé.
   • Invariant logique non-négociable (fail-fast condition).
3. Ne tolère aucune extrapolation non vérifiée dans la chaîne de pensée.

[FORMAT DE RESTITUTION] :
Fournis la réponse au format : {{FORMAT_SORTIE}}.
Termine impérativement par une checklist d'audit des risques de latence.`,
    explanation: [
      'Ce prompt utilise le pattern "Contrat d\'Interface + Règle de Fail-Fast" plébiscité pour Claude 3.5 Sonnet.',
      'La séparation stricte entre Perception, Raisonnement et Validation élimine 98% des dérives logiques.',
      'Le formatage forcé assure une compatibilité directe avec vos backends et parseurs JSON.'
    ]
  },
  {
    id: 'gpt4o-clean-refactor',
    title: 'Refactoring Fonctionnel & Audit de Dette Technique',
    modelBadge: 'Astuce GPT-4o Reasoning',
    modelFamily: 'gpt',
    shortDesc: 'Transforme du code spaghetti en architecture modulaire type-safe avec benchmarks de complexité cyclomatique.',
    category: 'Génie Logiciel & Clean Code',
    tokenCount: 425,
    efficiencyRating: 'Idéal pour revues de PR',
    variables: [
      { name: 'LANGAGE', defaultValue: 'TypeScript 5.x', description: 'Langage et version cible' },
      { name: 'PRINCIPE', defaultValue: 'Single Responsibility & Immutabilité', description: 'Règle directrice de refactoring' },
      { name: 'TEST_FRAMEWORK', defaultValue: 'Vitest / Jest', description: 'Framework de test unitaire' }
    ],
    template: `Tu es un Tech Lead & Auditeur de Code Senior réputé pour son intransigeance sur la maintenabilité.

[OBJECTIF] :
Analyse et refactorise le module fourni en appliquant rigoureusement le standard : {{LANGAGE}}.
Principe cardinal à maximiser : {{PRINCIPE}}.

[PROTOCOLE D'INTERVENTION] :
Étape 1 : Diagnostic sans complaisance (Complexité cyclomatique, memory leaks potentiels, couplage fort).
Étape 2 : Nouvelle implémentation épurée :
  - Zéro effet de bord non documenté.
  - Typage exhaustif (aucun type 'any' ou cast forcé 'as unknown').
  - Fonctions pures testables unitairement en isolation.
Étape 3 : Rédige 3 tests critiques avec {{TEST_FRAMEWORK}} couvrant les edge-cases extrêmes (null, timeout, concurrent race condition).

[SORTIE ATTENDUE] :
Code commenté uniquement sur les décisions d'architecture non-triviales.`,
    explanation: [
      'Optimisé pour tirer parti du raisonnement étape par étape de GPT-4o.',
      'Force l’analyse des cas limites (race conditions, memory leaks) avant la génération du code.',
      'Génère directement la suite de tests unitaires prête à l’emploi.'
    ]
  },
  {
    id: 'gemini-synthesis',
    title: 'Synthétiseur de Veille Stratégique & Signaux Faibles',
    modelBadge: 'Astuce Gemini 1.5 Pro',
    modelFamily: 'gemini',
    shortDesc: 'Digère d’immenses corpus documentaires ou flux RSS pour extraire les tournants technologiques majeurs.',
    category: 'Veille & Analyse Stratégique',
    tokenCount: 310,
    efficiencyRating: 'Capacité contexte 2M tokens',
    variables: [
      { name: 'HORIZON', defaultValue: '6 à 18 prochains mois', description: 'Période prédictive de projection' },
      { name: 'AUDIENCE', defaultValue: 'CTO & Directeurs R&D', description: 'Niveau d\'expertise des décideurs' },
      { name: 'CRITICITÉ', defaultValue: 'Haute - Impact concurrentiel direct', description: 'Seuil d\'alerte pour les signaux' }
    ],
    template: `Agis en tant que Directeur de la Veille Technologique pour {{AUDIENCE}}.

[CADRE D'ANALYSE] :
Passe au crible les informations récentes et identifie 3 signaux faibles critiques à horizon : {{HORIZON}}.
Niveau de criticité exigé : {{CRITICITÉ}}.

[GRILLE D'ÉVALUATION PAR SIGNAL] :
Pour chaque tendance identifiée :
1. Fait Factuel Brut : Citation vérifiable et source technique.
2. Angle Mort : Ce que la majorité des observateurs négligent actuellement.
3. Vecteur d'Impact : Conséquence concrète sur les architectures de nos produits.
4. Action Immédiate : Le prototype de 48h à lancer pour tester l'opportunité.

Bannis le jargon creux ("révolutionnaire", "game-changer"). Privilégie des faits chiffrés et des ordres de grandeur.`,
    explanation: [
      'Spécialement calibré pour extraire la substantifique moelle de flux d\'actualités volumineux.',
      'Évite le piège du sensationnalisme IA en imposant une recommandation concrète de prototype sous 48h.',
      'Pensé pour les comités d\'architecture et réunions produit hebdomadaires.'
    ]
  }
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'photonic-ai-chips',
    title: 'Inférence Photonique : La Fin du Goulot d’Étranglement Mémoire pour les LLMs',
    headline: 'Comment les interconnexions optiques silicium suppriment 80% de la latence inter-GPU lors du serving de modèles MoE géants.',
    tags: ['#Hardware', '#DeepLearning', '#Semiconducteurs'],
    readTime: '4 min read',
    publishedAt: 'Aujourd’hui à 08:30',
    author: {
      name: 'Alexandre Renard',
      role: 'Hardware AI Researcher',
      avatarInitials: 'AR'
    },
    accentColor: 'cyan',
    badgeLabel: 'Percée Matérielle',
    keyTakeaways: [
      'Remplacement des bus cuivre traditionnels par des micro-guides d’ondes optiques intégrés sur le die.',
      'Gain de bande passante multiplié par 6.4x pour une consommation énergétique réduite de 45%.',
      'Impact direct : déploiement de modèles 70B+ à 120 tokens/sec sur un seul socket workstation.'
    ],
    fullContent: [
      'Le principal obstacle à l’accélération des modèles de langage n’est plus la puissance brute de calcul des cœurs Tensor, mais le transfert de poids entre la mémoire HBM et les processeurs. Lors de l’inférence séquentielle, les modèles passent la majeure partie de leur cycle d’horloge à attendre le chargement des matrices d’attention.',
      'La nouvelle génération de puces optiques hybrides intègre désormais des micro-lasers à l’échelle nanométrique directement gravés sur le substrat de silicium. Ce packaging novateur permet une communication optique directe avec la mémoire, contournant la dissipation thermique des pistes en cuivre.',
      'Pour les développeurs et ingénieurs en production, cette transition annonce une réduction drastique du coût par million de tokens générés, tout en ouvrant la voie à des temps de réponse quasi-instantanés dans les applications vocales conversationnelles.'
    ]
  },
  {
    id: 'deep-research-agents',
    title: 'La Révolution des Agents Web : Du Simple Chatbot au Navigateur Autonome',
    headline: 'Les protocoles Computer-Use et DOM-Grounding transforment la veille stratégique et l’automatisation des tâches complexes.',
    tags: ['#Agents', '#Automation', '#OpenAI'],
    readTime: '5 min read',
    publishedAt: 'Aujourd’hui à 07:15',
    author: {
      name: 'Claire Vance',
      role: 'Lead Autonomous Systems',
      avatarInitials: 'CV'
    },
    accentColor: 'violet',
    badgeLabel: 'Architecture Logicielle',
    keyTakeaways: [
      'Passage d’une navigation basée sur le parsing d’API à un contrôle visuel direct du navigateur par vision-LLM.',
      'Gestion automatique des états d’authentification, sessions dynamiques et pagination infinie.',
      'Réduction du temps de recherche documentaire multi-sources de 3 heures à 90 secondes avec synthèse sourcée.'
    ],
    fullContent: [
      'Pendant deux ans, l’automatisation web par IA s’est heurtée à la fragilité des sélecteurs CSS et aux protections anti-scraping. L’arrivée conjointe de modèles capables d’analyser des captures d’écran pixel-par-pixel et de générer des coordonnées précises de souris redéfinit complètement le domaine.',
      'Avec des bibliothèques telles que Browser-Use et les agents de recherche itérative, l’IA ne se contente plus de lire un résultat de moteur de recherche : elle clique, remplit des filtres complexes, extrait des tableaux de données et recoupe les incohérences entre plusieurs sources contradictoires.',
      'Les équipes produit intègrent déjà ces architectures pour créer des veilleurs concurrentiels infatigables capables d’alerter les ingénieurs dès qu’une nouvelle documentation d’API ou un commit critique est publié.'
    ]
  },
  {
    id: 'multimodal-native-fusion',
    title: 'Modèles Multimodaux Natifs : Pourquoi l’Inférence Directe Vision-Audio Supprime les Hallucinations',
    headline: 'Pourquoi l’abandon des modules TTS/STT intermédiaires au profit d’un espace latent unifié garantit une fluidité d’apprentissage sans précédent.',
    tags: ['#Multimodal', '#Research', '#Claude'],
    readTime: '3 min read',
    publishedAt: 'Hier à 19:40',
    author: {
      name: 'Dr. Marc Chen',
      role: 'Principal Research Scientist',
      avatarInitials: 'MC'
    },
    accentColor: 'emerald',
    badgeLabel: 'Théorie & Fondations',
    keyTakeaways: [
      'Entraînement end-to-end unifié où spectrogrammes audio et flux vidéo sont projetés dans le même espace vectoriel.',
      'Préservation de la prosodie, du ton, des hésitations et des indices para-linguistiques invisibles dans une transcription texte.',
      'Latence voix-à-voix ramenée sous les 190 millisecondes, seuil physiologique de la conversation naturelle.'
    ],
    fullContent: [
      'Les assistants vocaux classiques reposaient sur une chaîne séquentielle : Speech-To-Text (Whisper), puis LLM textuel, puis Text-To-Speech. Chaque maillon accumulait de la latence et perdait irrémédiablement l’intonation, l’ironie ou le rythme de l’interlocuteur.',
      'L’approche multimodale native tokenize les ondes sonores et les patchs d’images au même niveau que les mots. Le modèle perçoit l’hésitation dans la voix d’un apprenant qui pose une question difficile et ajuste automatiquement sa pédagogie avec bienveillance et clarté.',
      'Pour les plateformes de formation en ligne, cette rupture marque le début du tutorat personnalisé en temps réel, capable d’observer le code de l’élève à l’écran tout en dialoguant de vive voix sans le moindre temps mort.'
    ]
  }
];
