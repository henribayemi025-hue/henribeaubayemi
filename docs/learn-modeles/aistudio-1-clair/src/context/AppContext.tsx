import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Language,
  Theme,
  AccessibilitySettings,
  Lesson,
  Track,
  Tutor,
  UserProfile,
  Achievement,
  StudyRoom,
  CommunityQuestion,
  ModerationItem,
} from '../types';
import { tracksData } from '../data/coursesData';
import {
  defaultTutors,
  defaultAchievements,
  defaultStudyRooms,
  defaultCommunityQuestions,
  defaultModerationQueue,
} from '../data/initialData';
import { translations } from '../data/translations';

export type ActiveView =
  | 'courses'
  | 'lesson'
  | 'tutors'
  | 'projects'
  | 'tree'
  | 'community'
  | 'tools'
  | 'profile';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accessibility: AccessibilitySettings;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedTrack: Track | null;
  setSelectedTrack: (track: Track | null) => void;
  selectedLesson: Lesson | null;
  setSelectedLesson: (lesson: Lesson | null) => void;
  activeProjectTab?: 'neural_net' | 'rag' | 'mini_cpu' | 'crypto_rsa';
  setActiveProjectTab: (tab: 'neural_net' | 'rag' | 'mini_cpu' | 'crypto_rsa') => void;
  t: typeof translations['fr'];
  user: UserProfile;
  loginAsDemoUser: () => void;
  logoutUser: () => void;
  completeLesson: (lessonId: string, xpGained?: number) => void;
  saveCodeDraft: (lessonId: string, code: string) => void;
  recordCodeRun: (passed: boolean) => void;
  tutors: Tutor[];
  activeTutor: Tutor;
  setActiveTutorId: (id: string) => void;
  socraticMode: boolean;
  toggleSocraticMode: () => void;
  aiDisabled: boolean;
  toggleAiDisabled: () => void;
  addCustomTutor: (tutor: Tutor) => void;
  studyRooms: StudyRoom[];
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  sendRoomMessage: (roomId: string, text: string) => void;
  updateRoomCode: (roomId: string, code: string) => void;
  questions: CommunityQuestion[];
  askQuestion: (data: { title: string; trackId: any; content: string; codeSnippet?: string; tags: string[] }) => void;
  addAnswer: (questionId: string, text: string) => void;
  voteQuestion: (questionId: string) => void;
  moderationQueue: ModerationItem[];
  moderateItem: (id: string, action: 'approved' | 'rejected') => void;
  achievements: Achievement[];
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'finjaro_learn_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');
  const [theme, setTheme] = useState<Theme>('finjaro');
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    dyslexicFont: false,
    highContrast: false,
    textSize: 'normal',
  });
  const [activeView, setActiveView] = useState<ActiveView>('courses');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(tracksData[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(tracksData[0].lessons[0]);
  const [activeProjectTab, setActiveProjectTab] = useState<'neural_net' | 'rag' | 'mini_cpu' | 'crypto_rsa'>('neural_net');

  // User state
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user) return parsed.user;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      id: 'usr-finjaro-01',
      name: 'Henri B.',
      email: 'henri@finjaro.com',
      isLoggedIn: true,
      avatar: '👨‍💻',
      xp: 450,
      streak: 7,
      lastActiveDate: new Date().toISOString(),
      completedLessons: ['prog-01'],
      lessonDrafts: {},
      codeRunsCount: 14,
      testPassCount: 11,
      testFailCount: 3,
      studyMinutes: 85,
      historyDates: [
        '2026-09-26',
        '2026-09-27',
        '2026-09-28',
        '2026-09-29',
        '2026-09-30',
        '2026-10-01',
        '2026-10-02',
      ],
      customAgents: [],
    };
  });

  // Tutors
  const [tutors, setTutors] = useState<Tutor[]>(defaultTutors);
  const [activeTutorId, setActiveTutorId] = useState<string>('leo');
  const [socraticMode, setSocraticMode] = useState<boolean>(true);
  const [aiDisabled, setAiDisabled] = useState<boolean>(false);

  // Social & Community
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>(defaultStudyRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CommunityQuestion[]>(defaultCommunityQuestions);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>(defaultModerationQueue);
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);

  // Sync DOM classes for theme and accessibility
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'noir') {
      root.classList.add('dark');
      root.classList.remove('theme-finjaro');
      root.classList.add('theme-noir');
      document.body.style.backgroundColor = '#0B0F17';
      document.body.style.color = '#F3F4F6';
    } else {
      root.classList.remove('dark');
      root.classList.remove('theme-noir');
      root.classList.add('theme-finjaro');
      document.body.style.backgroundColor = '#FFFFFF';
      document.body.style.color = '#0F172A';
    }

    if (accessibility.dyslexicFont) {
      document.body.classList.add('font-dyslexic');
    } else {
      document.body.classList.remove('font-dyslexic');
    }

    if (accessibility.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    document.body.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge');
    if (accessibility.textSize === 'large') {
      document.body.classList.add('text-scale-large');
    } else if (accessibility.textSize === 'xlarge') {
      document.body.classList.add('text-scale-xlarge');
    } else {
      document.body.classList.add('text-scale-normal');
    }
  }, [theme, accessibility]);

  // Persist user state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
  }, [user]);

  const updateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...settings }));
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: theme === 'noir' ? ['#06B6D4', '#8B5CF6', '#FF6B00'] : ['#FF6B00', '#FF8C00', '#F59E0B'],
      });
    } catch (e) {
      console.log('Confetti triggered');
    }
  };

  const completeLesson = (lessonId: string, xpGained = 50) => {
    setUser((prev) => {
      const alreadyCompleted = prev.completedLessons.includes(lessonId);
      const newCompleted = alreadyCompleted ? prev.completedLessons : [...prev.completedLessons, lessonId];
      return {
        ...prev,
        completedLessons: newCompleted,
        xp: prev.xp + (alreadyCompleted ? 10 : xpGained),
      };
    });
    triggerConfetti();
  };

  const saveCodeDraft = (lessonId: string, code: string) => {
    setUser((prev) => ({
      ...prev,
      lessonDrafts: {
        ...prev.lessonDrafts,
        [lessonId]: code,
      },
    }));
  };

  const recordCodeRun = (passed: boolean) => {
    setUser((prev) => ({
      ...prev,
      codeRunsCount: prev.codeRunsCount + 1,
      testPassCount: passed ? prev.testPassCount + 1 : prev.testPassCount,
      testFailCount: !passed ? prev.testFailCount + 1 : prev.testFailCount,
    }));
  };

  const loginAsDemoUser = () => {
    setUser((prev) => ({
      ...prev,
      isLoggedIn: true,
      name: 'Henri B.',
      email: 'henri@finjaro.com',
    }));
  };

  const logoutUser = () => {
    setUser((prev) => ({
      ...prev,
      isLoggedIn: false,
      name: 'Apprenant Invité',
      email: '',
    }));
  };

  const addCustomTutor = (newTutor: Tutor) => {
    setTutors((prev) => [...prev, newTutor]);
    setActiveTutorId(newTutor.id);
  };

  const toggleSocraticMode = () => setSocraticMode((prev) => !prev);
  const toggleAiDisabled = () => setAiDisabled((prev) => !prev);

  const sendRoomMessage = (roomId: string, text: string) => {
    const newMessage = {
      id: 'msg-' + Date.now(),
      user: user.name,
      avatar: user.avatar,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setStudyRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, messages: [...r.messages, newMessage] } : r))
    );

    // Simulated peer or tutor response after 1.5s
    setTimeout(() => {
      const activeTutorObj = tutors.find((t) => t.id === activeTutorId) || defaultTutors[0];
      const botResponse = {
        id: 'msg-bot-' + Date.now(),
        user: `${activeTutorObj.name} (Tuteur Finjaro)`,
        avatar: activeTutorObj.avatar,
        text:
          language === 'en'
            ? `Insightful point! Notice how this scales with data size. Has anyone benchmarked the execution time?`
            : `Remarque pertinente ! Notez comment cela réagit avec de grands volumes de données. Est-ce que quelqu'un a mesuré le temps d'exécution ?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAi: true,
      };
      setStudyRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, messages: [...r.messages, botResponse] } : r))
      );
    }, 1800);
  };

  const updateRoomCode = (roomId: string, code: string) => {
    setStudyRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, code } : r))
    );
  };

  const askQuestion = (data: {
    title: string;
    trackId: any;
    content: string;
    codeSnippet?: string;
    tags: string[];
  }) => {
    const newQuestion: CommunityQuestion = {
      id: 'q-' + Date.now(),
      title: data.title,
      author: user.name,
      authorAvatar: user.avatar,
      trackId: data.trackId,
      content: data.content,
      codeSnippet: data.codeSnippet,
      tags: data.tags,
      votes: 1,
      answered: false,
      createdAt: new Date().toISOString(),
      answers: [],
    };
    setQuestions((prev) => [newQuestion, ...prev]);

    // Simulated AI Tutor response if not disabled
    if (!aiDisabled) {
      setTimeout(() => {
        const tutor = tutors.find((t) => t.id === activeTutorId) || defaultTutors[0];
        const aiAnswer = {
          id: 'a-' + Date.now(),
          author: `${tutor.name} (Tuteur Finjaro)`,
          authorAvatar: tutor.avatar,
          content:
            language === 'en'
              ? `Hi ${user.name}! In this scenario, check if the input array could be empty or contains undefined elements. You can add a defensive guard: if (!data || data.length === 0) return 0;`
              : `Bonjour ${user.name} ! Dans ce cas de figure, vérifie si le tableau d'entrée peut être vide ou contenir des éléments non définis. Ajoute un garde défensif : if (!data || data.length === 0) return 0;`,
          votes: 2,
          isAccepted: true,
          createdAt: new Date().toISOString(),
        };
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === newQuestion.id
              ? { ...q, answered: true, answers: [aiAnswer] }
              : q
          )
        );
      }, 2500);
    }
  };

  const addAnswer = (questionId: string, text: string) => {
    const newAns = {
      id: 'ans-' + Date.now(),
      author: user.name,
      authorAvatar: user.avatar,
      content: text,
      votes: 1,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, answered: true, answers: [...q.answers, newAns] }
          : q
      )
    );
  };

  const voteQuestion = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, votes: q.votes + 1 } : q))
    );
  };

  const moderateItem = (id: string, action: 'approved' | 'rejected') => {
    setModerationQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  const activeTutor = tutors.find((t) => t.id === activeTutorId) || defaultTutors[0];
  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        accessibility,
        updateAccessibility,
        activeView,
        setActiveView,
        selectedTrack,
        setSelectedTrack,
        selectedLesson,
        setSelectedLesson,
        activeProjectTab,
        setActiveProjectTab,
        t,
        user,
        loginAsDemoUser,
        logoutUser,
        completeLesson,
        saveCodeDraft,
        recordCodeRun,
        tutors,
        activeTutor,
        setActiveTutorId,
        socraticMode,
        toggleSocraticMode,
        aiDisabled,
        toggleAiDisabled,
        addCustomTutor,
        studyRooms,
        activeRoomId,
        setActiveRoomId,
        sendRoomMessage,
        updateRoomCode,
        questions,
        askQuestion,
        addAnswer,
        voteQuestion,
        moderationQueue,
        moderateItem,
        achievements,
        triggerConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
