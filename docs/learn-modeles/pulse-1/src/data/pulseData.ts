import { GitHubRepo, PromptOfTheDay, NewsArticle } from '../types/pulse';

export const REPOS_DATA: GitHubRepo[] = [
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    owner: 'deepseek-ai',
    description: 'Modèle Mixture-of-Experts 671B avec Multi-Head Latent Attention et entraînement FP8 natif ultra-optimisé.',
    stars: 84210,
    starsToday: 2410,
    forks: 9140,
    primaryLanguage: 'Python',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'CUDA', color: '#3B44AC' },
      { name: 'C++', color: '#f34b7d' }
    ],
    url: 'https://github.com/deepseek-ai/DeepSeek-V3',
    rank: 1,
    isStarred: false,
  },
  {
    id: 'vllm',
    name: 'vLLM',
    owner: 'vllm-project',
    description: 'Moteur d\'inférence haute cadence avec PagedAttention, partitionnement dynamique et décodage spéculatif.',
    stars: 38450,
    starsToday: 680,
    forks: 5620,
    primaryLanguage: 'Python',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'C++', color: '#f34b7d' },
      { name: 'Rust', color: '#dea584' }
    ],
    url: 'https://github.com/vllm-project/vllm',
    rank: 2,
    isStarred: false,
  },
  {
    id: 'autogpt',
    name: 'AutoGPT',
    owner: 'Significant-Gravitas',
    description: 'Framework d\'agents IA autonomes avec chaînes de réflexion persistantes et boucle d\'exécution récursive.',
    stars: 169540,
    starsToday: 320,
    forks: 42100,
    primaryLanguage: 'Python',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'TypeScript', color: '#3178c6' },
      { name: 'Docker', color: '#384d54' }
    ],
    url: 'https://github.com/Significant-Gravitas/AutoGPT',
    rank: 3,
    isStarred: false,
  },
  {
    id: 'langgraph',
    name: 'LangGraph',
    owner: 'langchain-ai',
    description: 'Orchestration d\'agents d\'état multi-acteurs sous forme de graphes cycliques avec persistance intégrée.',
    stars: 19820,
    starsToday: 415,
    forks: 2310,
    primaryLanguage: 'Python',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'TypeScript', color: '#3178c6' }
    ],
    url: 'https://github.com/langchain-ai/langgraph',
    rank: 4,
    isStarred: false,
  },
  {
    id: 'comfyui',
    name: 'ComfyUI',
    owner: 'comfyanonymous',
    description: 'Interface graphique nodale modulaire pour modèles de diffusion générative et pipelines d\'images/vidéos.',
    stars: 62300,
    starsToday: 890,
    forks: 6740,
    primaryLanguage: 'Python',
    languages: [
      { name: 'Python', color: '#3572A5' },
      { name: 'JavaScript', color: '#f1e05a' }
    ],
    url: 'https://github.com/comfyanonymous/ComfyUI',
    rank: 5,
    isStarred: false,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    owner: 'ollama',
    description: 'Déploiement et exécution locale en un clic des modèles open-weight (Llama 3, Mistral, Qwen) sur Mac et Linux.',
    stars: 114200,
    starsToday: 1250,
    forks: 9810,
    primaryLanguage: 'Go',
    languages: [
      { name: 'Go', color: '#00ADD8' },
      { name: 'C++', color: '#f34b7d' }
    ],
    url: 'https://github.com/ollama/ollama',
    rank: 6,
    isStarred: false,
  },
];

export const PROMPT_OF_THE_DAY: PromptOfTheDay = {
  id: 'prompt-architect-legacy',
  title: 'Architecte Système : Cartographie & Migration de Code Legacy',
  targetModel: 'Claude 3.5 Sonnet / GPT-4o',
  modelBadge: 'Astuce Claude 3.5 & GPT-4o',
  recommendedParams: {
    temperature: 0.15,
    topP: 0.9,
    maxTokens: 4096,
  },
  context: 'Idéal pour auditer un repo complexe sans documentation et concevoir une architecture cible sans introduire de régression fonctionnelle.',
  fullPrompt: `Tu es un Ingénieur Principal d'Architecture Logicielle spécialisé dans la modernisation des systèmes distribués critiques.

[CONTEXTE D'ENTRÉE]
- Langage / Stack Source : {{LANGAGE_SOURCE}}
- Stack Cible Prévue : {{STACK_CIBLE}}
- Contraintes : Zéro downtime, isolation de domaine, couverture de test unitaire >= 85%.

[MÉTHODOLOGIE D'ANALYSE EN 4 ÉTAPES]
1. Cartographie des Dépendances & Découplage :
   - Identifie les 3 goulets d'étranglement majeurs et couplages forts dans le snippet fourni.
   - Trace la frontière transactionnelle selon les principes du Domain-Driven Design (DDD).

2. Stratégie Strangler Fig Pattern :
   - Conçois une passerelle d'interception progressive avec proxy inverse.
   - Définis les interfaces abstraites pour faire cohabiter l'ancien et le nouveau modèle.

3. Spécification des Types & Contrats d'API :
   - Rédige l'interface TypeScript stricte (ou schéma protobuf) garantissant l'idempotence des opérations.
   - Ajoute les assertions d'invariance et gestion d'erreurs granulaires.

4. Plan d'Exécution par Phase (Step-by-Step) :
   - Propose un plan de déploiement en canary testing avec métriques de rollback automatique.

[CODE OU SCHÉMA À AUDITER] :
Insère ton extrait de code ci-dessous :
--------------------------------------------------
{{CODE_SOURCE}}
--------------------------------------------------`,
  variables: [
    { key: 'LANGAGE_SOURCE', label: 'Langage / Stack source', defaultValue: 'Python 3.8 / Django monolithique' },
    { key: 'STACK_CIBLE', label: 'Stack cible', defaultValue: 'Node.js 22 / TypeScript + Fastify + PostgreSQL' },
    { key: 'CODE_SOURCE', label: 'Extrait de code', defaultValue: 'class OrderProcessor:\n    def process(self, payload):\n        # Legacy tight coupling with DB direct query\n        pass' },
  ],
  author: {
    name: 'Finjaro Lab',
    role: 'Staff AI Engineer',
    avatar: 'FL',
  },
  estimatedTokens: 380,
  useCase: 'Modernisation monolithique, refactorisation legacy et audit architectural avec garanties formelles.',
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-reasoning-compute',
    title: 'Raisonnement au Moment du Test : La Nouvelle Frontière de l\'Intelligence Artificielle',
    summary: 'Pourquoi le paradigme du "Test-Time Compute" remplace l\'entraînement brut à grande échelle et comment les chaînes de pensée formelles éliminent les hallucinations.',
    fullBody: `L'augmentation de la taille des modèles et des volumes de tokens d'entraînement (pre-training) commence à rencontrer des rendements décroissants. La nouvelle percée réside dans l'allocation dynamique de calcul lors de l'inférence.

En permettant aux modèles d'explorer plusieurs arbres de recherche, de vérifier rigoureusement leurs étapes intermédiaires et d'exécuter des rétro-contrôles avant de formuler leur réponse finale, les taux d'erreur sur des problèmes mathématiques et de code complexe chutent de plus de 70%.

Cette transition ouvre la voie à des systèmes d'ingénierie autonomes capables d'exécuter des tests unitaires réels en sandbox avant de committer une ligne de code.`,
    tags: ['#DeepLearning', '#Reasoning', '#Inference'],
    readTime: '3 min read',
    publishedAt: 'Il y a 2 heures',
    author: 'Alexandre Meyer · Head of Research',
    source: 'Finjaro Intelligence Briefing',
    visualTheme: 'neural',
    keyPoints: [
      'Passage du pré-entraînement massif au calcul dynamique lors de l\'inférence.',
      'Recherche arborescente (MCTS) couplée à des modèles de vérification de processus (PRM).',
      'Réduction drastique des hallucinations logiques sur le code complexe.'
    ],
  },
  {
    id: 'news-multi-agent-production',
    title: 'Architectures Multi-Agents en Production : Du Concept à la Résilience Industrielle',
    summary: 'Retour d\'expérience sur le déploiement de 120 agents spécialisés coopérants : topologies de graphes d\'état, gestion du consensus et rollback automatique.',
    fullBody: `Faire collaborer plusieurs agents autonomes présente des défis uniques : boucles infinies de dialogue, dérive du contexte et divergences de décision.

Les équipes d'ingénierie adoptent désormais des graphes d'état cycliques stricts (type LangGraph) munis de mécanismes de consensus déterministes. Chaque agent opère avec un périmètre d'action strictement borné par des schémas d'outils typés.

En cas d'anomalie détectée par un agent vérificateur indépendant, l'état global du système peut être restauré instantanément grâce à un journal d'événements immuable (Event Sourcing).`,
    tags: ['#MultiAgent', '#Architecture', '#Production'],
    readTime: '4 min read',
    publishedAt: 'Il y a 4 heures',
    author: 'Éléonore Chen · Lead AI Systems',
    source: 'Finjaro Systems Journal',
    visualTheme: 'agents',
    keyPoints: [
      'Graphes d\'état finis pour éliminer les boucles incontrôlées.',
      'Validation de schémas stricts à chaque échange inter-agents.',
      'Journalisation Event Sourcing pour auditing et rollback chirurgical.'
    ],
  },
  {
    id: 'news-optical-photonic-compute',
    title: 'Photonique & Puces Neuromorphiques : Franchir le Mur de la Mémoire de Von Neumann',
    summary: 'Les processeurs optiques atteignent une vitesse de multiplication matricielle record avec une consommation énergétique divisée par 20 face aux GPU traditionnels.',
    fullBody: `Le goulet d'étranglement majeur de l'IA moderne n'est plus la puissance de calcul brute mais le transfert d'octets entre la mémoire HBM et les cœurs de calcul (Memory Wall).

Les circuits intégrés photoniques utilisent des photons plutôt que des électrons pour propager et combiner des signaux matriciels instantanément à la vitesse de la lumière. Avec une latence quasi-nulle et une dissipation thermique minime, ces accélérateurs redéfinissent les centres de données.

Les premiers bancs d'essai montrent une capacité d'inférence en temps réel pour des modèles de vision et de son haute fidélité avec seulement quelques watts de puissance électrique.`,
    tags: ['#Hardware', '#Silicon', '#Photonics'],
    readTime: '3 min read',
    publishedAt: 'Il y a 6 heures',
    author: 'Dr. Karim Benzekri · Semiconductor Lab',
    source: 'NextGen Silicon Dispatch',
    visualTheme: 'hardware',
    keyPoints: [
      'Calcul analogique optique à la vitesse de la lumière pour l\'inférence.',
      'Division par 20 de l\'empreinte énergétique par rapport aux puces H100/B200.',
      'Latence ultra-faible adaptée au contrôle robotique et audio en direct.'
    ],
  },
];
