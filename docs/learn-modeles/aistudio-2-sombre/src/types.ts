export interface Track {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: 'code' | 'database' | 'brain' | 'terminal' | 'sparkles' | 'eye';
  accentColor: string;
  gradient: string;
  borderGlow: string;
  badge: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  xpReward: number;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert';
}

export interface Lesson {
  id: string;
  trackId: string;
  title: string;
  lessonNumber: number;
  durationMinutes: number;
  progress: number;
  topic: string;
  conceptSummary: string;
  codeSnippet: string;
  quizQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface UserStats {
  name: string;
  handle: string;
  avatarUrl: string;
  streakDays: number;
  level: number;
  title: string;
  totalXp: number;
  nextLevelXp: number;
  currentLevelXp: number;
  hoursSpent: number;
  completedCount: number;
  streakDaysList: { day: string; date: string; active: boolean }[];
}
