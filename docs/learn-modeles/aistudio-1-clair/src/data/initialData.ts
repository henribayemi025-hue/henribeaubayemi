import { Tutor, Achievement, StudyRoom, CommunityQuestion, ModerationItem, AiNewsArticle } from '../types';

export const defaultTutors: Tutor[] = [
  {
    id: 'leo',
    name: 'Léo',
    role: {
      fr: 'Architecte IA Senior & Mentor Finjaro',
      en: 'Senior AI Architect & Finjaro Mentor',
    },
    bio: {
      fr: 'Ingénieur chevronné, calme et méthodique. Il privilégie la rigueur d\'architecture, la clarté du code et vous guide vers la solution avec bienveillance.',
      en: 'Seasoned engineer, calm and structured. Emphasizes clean architecture, code clarity, and benevolent mentorship.',
    },
    avatar: '🦁',
    avatarColor: 'from-orange-500 to-amber-600',
    personality: {
      fr: 'Calme, bienveillant, structuré, esprit Finjaro.',
      en: 'Calm, encouraging, structured, Finjaro spirit.',
    },
    socraticFactor: 80,
    strictness: 3,
  },
  {
    id: 'ada',
    name: 'Ada',
    role: {
      fr: 'Chercheuse en Algorithmes & Mathématiques',
      en: 'Algorithms & Mathematics Researcher',
    },
    bio: {
      fr: 'Inspirée par Ada Lovelace, elle aime la précision mathématique pure, les matrices, les gradients et l\'élégance algorithmique.',
      en: 'Inspired by Ada Lovelace, passionate about pure math precision, matrices, gradients, and algorithmic beauty.',
    },
    avatar: '🦉',
    avatarColor: 'from-purple-500 to-indigo-600',
    personality: {
      fr: 'Rigoureuse, analytique, élégante et passionnée.',
      en: 'Rigorous, analytical, elegant, and passionate.',
    },
    socraticFactor: 90,
    strictness: 4,
  },
  {
    id: 'neo',
    name: 'Néo',
    role: {
      fr: 'Hacker Systèmes & Ingénieur Bas Niveau',
      en: 'Systems Hacker & Low-Level Engineer',
    },
    bio: {
      fr: 'Spécialiste de la mémoire, de l\'ALU, du chiffrement et des performances extrêmes. Zéro fioriture, il va droit au but dans le terminal.',
      en: 'Specialist in memory layout, CPU ALU, cryptography, and raw performance. No fluff, straight to the terminal.',
    },
    avatar: '⚡',
    avatarColor: 'from-cyan-500 to-blue-600',
    personality: {
      fr: 'Direct, pragmatique, orienté optimisation et sécurité.',
      en: 'Direct, pragmatic, obsessed with optimization and security.',
    },
    socraticFactor: 60,
    strictness: 5,
  },
];

export const defaultAchievements: Achievement[] = [
  {
    id: 'ach-first-code',
    title: { fr: 'Premier Pas', en: 'First Step' },
    description: { fr: 'Exécutez et validez votre tout premier exercice de code.', en: 'Run and pass your very first coding exercise.' },
    icon: 'Terminal',
    category: 'code',
    unlocked: true,
    unlockedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'ach-neuron',
    title: { fr: 'Neurone Activé', en: 'Neuron Fired' },
    description: { fr: 'Entraînez un modèle de neurone artificiel ou validez une leçon IA.', en: 'Train an artificial neuron or pass an AI lesson.' },
    icon: 'Brain',
    category: 'ai',
    unlocked: true,
    unlockedAt: '2026-09-29T14:30:00Z',
  },
  {
    id: 'ach-socratic',
    title: { fr: 'Disciple Socratique', en: 'Socratic Disciple' },
    description: { fr: 'Résolvez un exercice guidé uniquement par les questions du tuteur.', en: 'Solve an exercise guided only by Socratic inquiry.' },
    icon: 'Sparkles',
    category: 'ai',
    unlocked: false,
    progress: 1,
    maxProgress: 3,
  },
  {
    id: 'ach-cpu-architect',
    title: { fr: 'Architecte de Processeur', en: 'CPU Architect' },
    description: { fr: 'Exécutez un cycle complet dans le simulateur de mini-processeur.', en: 'Run a full cycle in the mini-CPU simulator.' },
    icon: 'Cpu',
    category: 'code',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ach-rsa-master',
    title: { fr: 'Maître des Clés RSA', en: 'RSA Keymaster' },
    description: { fr: 'Générez une paire de clés et chiffrez un message en cryptographie.', en: 'Generate a keypair and encrypt a message.' },
    icon: 'Shield',
    category: 'code',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ach-streak-7',
    title: { fr: 'Flamme 7 Jours', en: '7-Day Streak' },
    description: { fr: 'Maintenez une série de 7 jours consécutifs de pratique active.', en: 'Maintain 7 consecutive days of active practice.' },
    icon: 'Flame',
    category: 'streak',
    unlocked: true,
    unlockedAt: '2026-10-01T08:00:00Z',
    progress: 7,
    maxProgress: 7,
  },
  {
    id: 'ach-collaborator',
    title: { fr: 'Esprit d\'Équipe', en: 'Team Spirit' },
    description: { fr: 'Rejoignez un espace d\'étude en direct et échangez du code.', en: 'Join a live study room and share code.' },
    icon: 'Users',
    category: 'social',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
];

export const defaultStudyRooms: StudyRoom[] = [
  {
    id: 'room-ai',
    name: 'Salon IA & Deep Learning',
    topic: 'Implémentation de l\'attention multi-têtes et RAG',
    activeUsersCount: 4,
    language: 'javascript',
    code: `// Salon IA : Exploration du calcul d'attention
function scaledDotProductAttention(Q, K, V, dk) {
  // Q, K, V sont des matrices
  // Formule: softmax(Q * K^T / sqrt(dk)) * V
  console.log("Calcul de l'attention en cours...");
  return "Attention pondérée calculée";
}

scaledDotProductAttention([[1, 0]], [[1, 0]], [[0.5, 0.8]], 64);`,
    collaborators: [
      { id: 'u1', name: 'Sophia L.', avatar: '👩‍💻', color: '#FF6B00', cursorLine: 3, activeStatus: 'Édite la fonction' },
      { id: 'u2', name: 'Karim D.', avatar: '👨‍🔬', color: '#8B5CF6', cursorLine: 7, activeStatus: 'Revoit les tests' },
      { id: 'u3', name: 'Elena V.', avatar: '🚀', color: '#10B981', cursorLine: 1, activeStatus: 'En ligne' },
    ],
    messages: [
      { id: 'm1', user: 'Karim D.', avatar: '👨‍🔬', text: 'Bienvenue dans le salon ! On regarde la normalisation de la racine de dk.', time: '10:42' },
      { id: 'm2', user: 'Sophia L.', avatar: '👩‍💻', text: 'Oui, sans la division par sqrt(dk), le softmax sature et les gradients s\'effondrent.', time: '10:44' },
      { id: 'm3', user: 'Léo (IA Finjaro)', avatar: '🦁', text: 'Exactement Sophia. Vous pouvez tester avec des valeurs dk élevées (ex: 512) pour observer la stabilité numérique.', time: '10:45', isAi: true },
    ],
  },
  {
    id: 'room-python',
    name: 'Atelier JavaScript & Python',
    topic: 'Optimisation d\'algorithmes et structures de données',
    activeUsersCount: 3,
    language: 'javascript',
    code: `// Algorithme de tri rapide (QuickSort)
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
}

console.log(quickSort([9, 2, 7, 1, 8, 3]));`,
    collaborators: [
      { id: 'u4', name: 'Lucas M.', avatar: '🧑‍💻', color: '#06B6D4', cursorLine: 2, activeStatus: 'En train de coder' },
      { id: 'u5', name: 'Amina K.', avatar: '👩‍🎓', color: '#EC4899', cursorLine: 11, activeStatus: 'En train de tester' },
    ],
    messages: [
      { id: 'm4', user: 'Lucas M.', avatar: '🧑‍💻', text: 'Je viens de tester le partitionnement in-place pour économiser la mémoire.', time: '11:15' },
      { id: 'm5', user: 'Amina K.', avatar: '👩‍🎓', text: 'Super ! La complexité spatiale passe de O(N) à O(log N).', time: '11:17' },
    ],
  },
  {
    id: 'room-crypto',
    name: 'Hackathon Cryptographie',
    topic: 'Attaques par canaux auxiliaires et implémentation RSA',
    activeUsersCount: 2,
    language: 'javascript',
    code: `// Test d'inversion modulaire (Algorithme d'Euclide étendu)
function extendedGcd(a, b) {
  if (b === 0) return { gcd: a, x: 1, y: 0 };
  const { gcd, x: x1, y: y1 } = extendedGcd(b, a % b);
  return {
    gcd,
    x: y1,
    y: x1 - Math.floor(a / b) * y1
  };
}

console.log(extendedGcd(17, 3120));`,
    collaborators: [
      { id: 'u6', name: 'Marc B.', avatar: '🕵️‍♂️', color: '#EF4444', cursorLine: 4, activeStatus: 'Vérifie d mod phi' },
    ],
    messages: [
      { id: 'm6', user: 'Marc B.', avatar: '🕵️‍♂️', text: 'L\'inverse modulaire fonctionne parfaitement pour trouver la clé privée d.', time: '09:30' },
    ],
  },
];

export const defaultCommunityQuestions: CommunityQuestion[] = [
  {
    id: 'q-1',
    title: 'Pourquoi la fonction ReLU est-elle préférée à la Sigmoïde dans les couches cachées ?',
    author: 'Julien T.',
    authorAvatar: '👨‍💻',
    trackId: 'deeplearning',
    content: 'Dans la leçon sur le perceptron, j\'ai vu que la sigmoïde sature pour les grandes valeurs. Est-ce que cela signifie que le gradient devient nul et bloque l\'apprentissage ?',
    codeSnippet: `const sigmoid = z => 1 / (1 + Math.exp(-z));
// Pour z = 10, sigmoid'(z) est quasi nul !`,
    tags: ['deeplearning', 'gradient-vanishing', 'relu'],
    votes: 14,
    answered: true,
    createdAt: '2026-10-01T15:20:00Z',
    answers: [
      {
        id: 'a-1',
        author: 'Léo (Tuteur Finjaro)',
        authorAvatar: '🦁',
        content: 'Exactement Julien ! La dérivée de la sigmoïde est au maximum de 0.25 (en z=0). Quand tu chaînes plusieurs couches (règle de dérivation en chaîne), multiplier des nombres < 0.25 fait tendre le gradient vers 0 à une vitesse exponentielle. C\'est le problème de la disparition du gradient (vanishing gradient). ReLU a une dérivée de 1 pour tout z > 0, ce qui permet au gradient de se propager sans atténuation.',
        votes: 19,
        isAccepted: true,
        createdAt: '2026-10-01T15:25:00Z',
      },
      {
        id: 'a-2',
        author: 'Sarah M.',
        authorAvatar: '👩‍🔬',
        content: 'De plus, le calcul de max(0, x) est infiniment plus rapide sur GPU qu\'une exponentielle.',
        votes: 6,
        createdAt: '2026-10-01T16:00:00Z',
      },
    ],
  },
  {
    id: 'q-2',
    title: 'Comment choisir la taille des chunks pour un pipeline RAG documentaire ?',
    author: 'Thomas R.',
    authorAvatar: '🧑‍💼',
    trackId: 'aiengineering',
    content: 'Si mes chunks sont trop petits (ex: 50 mots), le modèle perd le contexte global. Si ils sont trop grands (ex: 2000 mots), l\'embedding devient flou. Y a-t-il une règle empirique ?',
    tags: ['rag', 'embeddings', 'chunking'],
    votes: 8,
    answered: true,
    createdAt: '2026-10-01T18:10:00Z',
    answers: [
      {
        id: 'a-3',
        author: 'Ada (Tuteur Finjaro)',
        authorAvatar: '🦉',
        content: 'La pratique standard en ingénierie de pointe est d\'utiliser des chunks de 300 à 600 tokens avec un chevauchement (overlap) de 10 à 20% (environ 50 tokens). Le chevauchement garantit qu\'une phrase charnière coupée en fin de chunk reste compréhensible dans le chunk suivant.',
        votes: 11,
        isAccepted: true,
        createdAt: '2026-10-01T18:30:00Z',
      },
    ],
  },
];

export const defaultModerationQueue: ModerationItem[] = [
  {
    id: 'mod-1',
    type: 'question',
    targetId: 'q-flagged-1',
    author: 'AnonymousUser99',
    title: 'Gagnez 5000€ rapidement en crypto bots sans coder',
    content: 'Lien externe spam vers service suspect...',
    reportReason: 'Publicité non sollicitée / Spam commercial',
    status: 'pending',
    createdAt: '2026-10-02T02:15:00Z',
  },
  {
    id: 'mod-2',
    type: 'answer',
    targetId: 'a-flagged-2',
    author: 'TrollDev',
    content: 'Ton code est nul, abandonne l\'informatique.',
    reportReason: 'Non-respect de la charte de bienveillance Finjaro',
    status: 'pending',
    createdAt: '2026-10-02T04:20:00Z',
  },
];

export const defaultAiNews: AiNewsArticle[] = [
  {
    id: 'news-1',
    title: {
      fr: 'Gemini 3.8 & Flash : Nouvelles frontières de raisonnement multimodal',
      en: 'Gemini 3.8 & Flash: New frontiers in multimodal reasoning',
    },
    category: 'models',
    date: 'Octobre 2026',
    readTime: '3 min',
    source: 'Google DeepMind Research',
    summary: {
      fr: 'Les modèles de la série Gemini 3 introduisent un raisonnement dynamique intégré et des capacités de streaming audio/visuel temps réel à très faible latence.',
      en: 'Gemini 3 series models introduce native dynamic reasoning and sub-second real-time multimodal audio/visual streaming.',
    },
    keyTakeaways: {
      fr: [
        'Architecture hybride combinant recherche d\'outils et auto-réflexion socratique.',
        'Précision accrue sur les benchmarks de codage et de démonstration formelle.',
        'Optimisation majeure de l\'inférence permettant une exécution ultra-économique.',
      ],
      en: [
        'Hybrid architecture merging automated tool use with internal reflection.',
        'Record scores on complex software engineering benchmarks.',
        'Drastic inference throughput improvements.',
      ],
    },
  },
  {
    id: 'news-2',
    title: {
      fr: 'Architectures RAG Hybrides : Fusion de Recherche Dense et Sparse (BM25 + Vectors)',
      en: 'Hybrid RAG Architectures: Fusing Dense & Sparse Retrieval',
    },
    category: 'research',
    date: 'Septembre 2026',
    readTime: '4 min',
    source: 'Finjaro Engineering Insights',
    summary: {
      fr: 'La recherche purement vectorielle montre des limites sur les acronymes et références exactes. La fusion hybride avec BM25 et un reranker élimine 90% des erreurs de contexte.',
      en: 'Pure vector retrieval struggles with exact codes and serial numbers. Hybrid fusion with BM25 and cross-encoders mitigates 90% of context misses.',
    },
    keyTakeaways: {
      fr: [
        'Score RRF (Reciprocal Rank Fusion) pour combiner les rangs sans normalisation complexe.',
        'Réduction drastique des hallucinations factuelles dans les systèmes d\'entreprise.',
        'Facile à déployer avec PostgreSQL et pgvector.',
      ],
      en: [
        'Reciprocal Rank Fusion smoothly blends semantic and keyword hits.',
        'Major drop in hallucination rates on enterprise documentation.',
        'Production ready with standard relational pgvector setups.',
      ],
    },
  },
  {
    id: 'news-3',
    title: {
      fr: 'WebAssembly et Inférence Locale : Faire tourner des LLM dans le navigateur',
      en: 'WebAssembly & Local In-Browser LLM Inference',
    },
    category: 'opensource',
    date: 'Septembre 2026',
    readTime: '5 min',
    source: 'Open Source WebAI',
    summary: {
      fr: 'Grâce à WebGPU et aux formats de quantification INT4, il est désormais possible d\'exécuter des modèles de 1B à 3B paramètres directement sur la machine de l\'élève avec 0 latence serveur.',
      en: 'WebGPU combined with 4-bit quantization allows running 1B-3B parameter models directly client-side with zero server latency.',
    },
    keyTakeaways: {
      fr: [
        'Confidentialité absolue : les données ne quittent jamais le navigateur.',
        'Exécution hors-ligne complète possible pour les leçons Finjaro.',
        'Support matériel universel sur Mac, Windows et smartphones récents.',
      ],
      en: [
        'Complete user privacy: zero token telemetry.',
        'Full offline capability for interactive learning platforms.',
        'Broad hardware support across desktops and smartphones.',
      ],
    },
  },
];
