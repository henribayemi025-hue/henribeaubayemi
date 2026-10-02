export type Language = 'fr' | 'en';

export type Theme = 'finjaro' | 'noir';

export interface AccessibilitySettings {
  dyslexicFont: boolean;
  highContrast: boolean;
  textSize: 'normal' | 'large' | 'xlarge';
}

export type TrackId =
  | 'programming'
  | 'datascience'
  | 'deeplearning'
  | 'aiengineering'
  | 'prompteng'
  | 'maths'
  | 'crypto'
  | 'computers';

export interface TestCase {
  description: { fr: string; en: string };
  call: string;
  expected: any;
  hidden?: boolean;
}

export interface LessonExercise {
  instructions: { fr: string[]; en: string[] };
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: { fr: string[]; en: string[] };
}

export interface Lesson {
  id: string;
  trackId: TrackId;
  order: number;
  title: { fr: string; en: string };
  subtitle: { fr: string; en: string };
  language: 'javascript' | 'python';
  durationMinutes: number;
  explanation: { fr: string; en: string };
  keyPoints: { fr: string[]; en: string[] };
  exampleCode: string;
  exampleExplanation: { fr: string; en: string };
  exercise: LessonExercise;
  milestoneProject?: 'neural_net' | 'rag' | 'mini_cpu' | 'crypto_rsa';
}

export interface Track {
  id: TrackId;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  icon: string;
  color: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  totalLessons: number;
  lessons: Lesson[];
}

export type TutorId = 'leo' | 'ada' | 'neo' | string;

export interface Tutor {
  id: TutorId;
  name: string;
  role: { fr: string; en: string };
  bio: { fr: string; en: string };
  avatar: string;
  avatarColor: string;
  personality: { fr: string; en: string };
  isCustom?: boolean;
  socraticFactor: number; // 0 to 100
  strictness: number; // 1 to 5
}

export interface Achievement {
  id: string;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  icon: string;
  category: 'code' | 'ai' | 'social' | 'streak';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  avatar: string;
  xp: number;
  streak: number;
  lastActiveDate: string;
  completedLessons: string[];
  lessonDrafts: Record<string, string>;
  codeRunsCount: number;
  testPassCount: number;
  testFailCount: number;
  studyMinutes: number;
  historyDates: string[];
  customAgents: Tutor[];
}

export interface StudyRoomCollaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  cursorLine: number;
  activeStatus: string;
}

export interface StudyRoomMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  isAi?: boolean;
}

export interface StudyRoom {
  id: string;
  name: string;
  topic: string;
  activeUsersCount: number;
  language: 'javascript' | 'python';
  code: string;
  collaborators: StudyRoomCollaborator[];
  messages: StudyRoomMessage[];
}

export interface CommunityAnswer {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  votes: number;
  isAccepted?: boolean;
  createdAt: string;
}

export interface CommunityQuestion {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  trackId: TrackId;
  content: string;
  codeSnippet?: string;
  tags: string[];
  votes: number;
  answered: boolean;
  createdAt: string;
  answers: CommunityAnswer[];
  flagged?: boolean;
}

export interface ModerationItem {
  id: string;
  type: 'question' | 'answer';
  targetId: string;
  author: string;
  title?: string;
  content: string;
  reportReason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Flashcard {
  front: string;
  back: string;
  codeSnippet?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AiNewsArticle {
  id: string;
  title: { fr: string; en: string };
  category: 'models' | 'research' | 'opensource' | 'tools';
  date: string;
  summary: { fr: string; en: string };
  keyTakeaways: { fr: string[]; en: string[] };
  readTime: string;
  source: string;
}
