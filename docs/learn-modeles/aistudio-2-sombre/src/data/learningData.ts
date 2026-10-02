import { Track, Lesson, UserStats } from '../types';

export const INITIAL_USER: UserStats = {
  name: 'Alexandre Roy',
  handle: '@alex.dev',
  avatarUrl: '', // Using high-character styled SVG avatar
  streakDays: 12,
  level: 24,
  title: 'Architecte Deep Learning',
  totalXp: 14850,
  currentLevelXp: 850,
  nextLevelXp: 1200,
  hoursSpent: 48,
  completedCount: 37,
  streakDaysList: [
    { day: 'Lun', date: '23 Sep', active: true },
    { day: 'Mar', date: '24 Sep', active: true },
    { day: 'Mer', date: '25 Sep', active: true },
    { day: 'Jeu', date: '26 Sep', active: true },
    { day: 'Ven', date: '27 Sep', active: true },
    { day: 'Sam', date: '28 Sep', active: true },
    { day: 'Dim', date: '29 Sep', active: true },
    { day: 'Lun', date: '30 Sep', active: true },
    { day: 'Mar', date: '1 Oct', active: true },
    { day: 'Mer', date: '2 Oct', active: true },
    { day: 'Jeu', date: 'Aujourd\'hui', active: true },
    { day: 'Ven', date: 'Demain', active: false },
  ],
};

export const CURRENT_HERO_LESSON: Lesson = {
  id: 'deep-learning-lesson-4',
  trackId: 'ai-deep-learning',
  title: 'Réseau de neurones',
  lessonNumber: 4,
  durationMinutes: 25,
  progress: 68,
  topic: 'IA et Deep Learning',
  conceptSummary: "Maîtrise la rétropropagation du gradient (Backpropagation) et l'activation non-linéaire ReLU pour optimiser les poids synaptiques d'un perceptron multicouche.",
  codeSnippet: `import torch
import torch.nn as nn

class FinjaroNeuralNet(nn.Module):
    def __init__(self, in_features=128, hidden=64, num_classes=10):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden, num_classes)
        
    def forward(self, x):
        # Propagation avant avec activation non-linéaire
        h = self.relu(self.fc1(x))
        return self.fc2(h)

# Initialisation du modèle sur accélérateur GPU
model = FinjaroNeuralNet().to("cuda")`,
  quizQuestion: {
    question: "Quelle fonction d'activation permet d'éviter l'évanouissement du gradient (Vanishing Gradient) sur les couches cachées profondes ?",
    options: [
      "Sigmoïde (1 / (1 + e^-x))",
      "ReLU (Rectified Linear Unit : max(0, x))",
      "Tangente hyperbolique (tanh)",
      "Softmax multi-classes"
    ],
    correctIndex: 1,
    explanation: "ReLU a une dérivée constante égale à 1 pour x > 0, ce qui élimine la saturation exponentielle propre aux fonctions sigmoïdes sur les réseaux profonds."
  }
};

export const TRACKS: Track[] = [
  {
    id: 'programmation',
    title: 'Programmation',
    subtitle: 'Python, Algorithmique & Rust IA',
    description: 'Structure de données vectorielles, calcul parallèle et optimisation mémoire pour architectures ML.',
    iconName: 'code',
    accentColor: '#f97316', // orange-500
    gradient: 'from-orange-500/20 via-orange-950/30 to-zinc-950',
    borderGlow: 'hover:border-orange-500/50 hover:shadow-[0_0_25px_rgba(249,115,22,0.25)]',
    badge: '18 Modules',
    progress: 74,
    totalLessons: 24,
    completedLessons: 18,
    xpReward: 3200,
    level: 'Intermédiaire'
  },
  {
    id: 'data-science',
    title: 'Data Science',
    subtitle: 'PyTorch, Embeddings & Tensors',
    description: 'Manipulation de grands corpus de tokens, vector search avec FAISS et pipelines d\'ingestion GPU.',
    iconName: 'database',
    accentColor: '#fb923c', // orange-400
    gradient: 'from-amber-500/20 via-zinc-900/40 to-zinc-950',
    borderGlow: 'hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    badge: '26 Modules',
    progress: 58,
    totalLessons: 32,
    completedLessons: 19,
    xpReward: 4800,
    level: 'Avancé'
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering',
    subtitle: 'Architectures LLM, Chain-of-Thought & Agents',
    description: 'Ingénierie de contextes massifs, MCP, Function Calling et patterns d\'orchestration multi-agents.',
    iconName: 'terminal',
    accentColor: '#ea580c', // orange-600
    gradient: 'from-orange-600/20 via-zinc-900/40 to-zinc-950',
    borderGlow: 'hover:border-orange-600/50 hover:shadow-[0_0_25px_rgba(234,88,12,0.25)]',
    badge: '14 Modules',
    progress: 92,
    totalLessons: 14,
    completedLessons: 13,
    xpReward: 2600,
    level: 'Expert'
  },
  {
    id: 'computer-vision',
    title: 'Vision & Multimodal',
    subtitle: 'Transformers Visuels, Diffusion & NeRF',
    description: 'Compréhension d\'images, génération par diffusion latente et segmentation sémantique temps réel.',
    iconName: 'eye',
    accentColor: '#f97316',
    gradient: 'from-orange-500/15 via-zinc-900/30 to-zinc-950',
    borderGlow: 'hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]',
    badge: '12 Modules',
    progress: 35,
    totalLessons: 20,
    completedLessons: 7,
    xpReward: 3500,
    level: 'Avancé'
  }
];

export const DAILY_CHALLENGE = {
  id: 'daily-oct-2',
  title: 'Défi Quotidien du Hub',
  description: 'Écris une fonction d\'attention scalaire softmax en Python en moins de 5 lignes.',
  xp: 150,
  streakBonus: '+1 jour garanti',
  solved: false,
};
