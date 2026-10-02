import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Sliders,
  Send,
  Plus,
  Check,
  Zap,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  BotOff,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tutor } from '../../types';
import { askTutorChat, generateCustomExercise } from '../../services/geminiService';

export const TutorView: React.FC = () => {
  const {
    t,
    theme,
    language,
    tutors,
    activeTutor,
    setActiveTutorId,
    socraticMode,
    toggleSocraticMode,
    aiDisabled,
    toggleAiDisabled,
    addCustomTutor,
    setSelectedLesson,
    setActiveView,
    triggerConfetti,
  } = useApp();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<{ id: string; sender: 'user' | 'tutor'; text: string; time: string }[]>([
    {
      id: 'init-1',
      sender: 'tutor',
      text:
        language === 'en'
          ? `Hello! I am ${activeTutor.name}, your Finjaro AI mentor. Whether you're debugging backprop or understanding CPU registers, ask me anything. Socratic mode is ${socraticMode ? 'ACTIVE (I will guide you step-by-step)' : 'direct'}.`
          : `Bonjour ! Je suis ${activeTutor.name}, ton mentor IA Finjaro. Que tu débogues un réseau de neurones ou que tu découvres les registres d'un processeur, pose-moi tes questions. Le mode socratique est ${socraticMode ? 'ACTIVÉ (je vais te guider par des questions)' : 'direct'}.`,
      time: 'Maintenant',
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Custom agent creator modal / drawer
  const [showCreator, setShowCreator] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customAvatar, setCustomAvatar] = useState<string>('🤖');
  const [customRole, setCustomRole] = useState<string>('Expert Machine Learning');
  const [customPersonality, setCustomPersonality] = useState<string>('Encourageant, axé sur les mathématiques et la clarté');
  const [customStrictness, setCustomStrictness] = useState<number>(3);
  const [customSocratic, setCustomSocratic] = useState<number>(80);

  // Custom exercise generator state
  const [isGeneratingExercise, setIsGeneratingExercise] = useState<boolean>(false);
  const [generatedExerciseNotice, setGeneratedExerciseNotice] = useState<string>('');

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user' as const,
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await askTutorChat({
        message: currentInput,
        tutorName: activeTutor.name,
        personality: activeTutor.personality[language],
        socraticMode: socraticMode,
        language,
      });

      const tutorMsg = {
        id: 'tut-' + Date.now(),
        sender: 'tutor' as const,
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'tutor',
          text: language === 'fr' ? 'Erreur de connexion. Veuillez réessayer.' : 'Connection error. Please retry.',
          time: 'Erreur',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newAgent: Tutor = {
      id: 'custom-' + Date.now(),
      name: customName,
      role: { fr: customRole, en: customRole },
      bio: { fr: customPersonality, en: customPersonality },
      avatar: customAvatar,
      avatarColor: 'from-amber-500 to-orange-600',
      personality: { fr: customPersonality, en: customPersonality },
      isCustom: true,
      strictness: customStrictness,
      socraticFactor: customSocratic,
    };

    addCustomTutor(newAgent);
    setShowCreator(false);
    triggerConfetti();
  };

  const handleGenerateCustomExercise = async () => {
    setIsGeneratingExercise(true);
    setGeneratedExerciseNotice('');
    try {
      const res = await generateCustomExercise({
        topic: 'Algorithmes et structures de données avancées',
        difficulty: 'Intermédiaire',
        language,
      });

      // Construct a temporary playable lesson
      const customLesson = {
        id: 'custom-ex-' + Date.now(),
        trackId: 'programming' as const,
        order: 99,
        title: { fr: res.title, en: res.title },
        subtitle: { fr: res.description, en: res.description },
        language: 'javascript' as const,
        durationMinutes: 15,
        explanation: { fr: res.description, en: res.description },
        keyPoints: { fr: res.instructions, en: res.instructions },
        exampleCode: res.solution,
        exampleExplanation: { fr: 'Exemple de solution vérifiée.', en: 'Verified solution reference.' },
        exercise: {
          instructions: { fr: res.instructions, en: res.instructions },
          starterCode: res.starterCode,
          solution: res.solution,
          testCases: res.testCases.map((tc: any) => ({
            call: tc.call || 'customSolve([10, 20, 5], 10)',
            expected: tc.expected !== undefined ? tc.expected : 30,
            description: { fr: tc.description?.fr || 'Test généré', en: tc.description?.en || 'Generated test' },
          })),
          hints: { fr: [res.hint || 'Décomposez le problème.'], en: [res.hint || 'Decompose the problem.'] },
        },
      };

      setSelectedLesson(customLesson);
      setGeneratedExerciseNotice(t.tutors.customExerciseGenerated);
      setTimeout(() => {
        setActiveView('lesson');
      }, 1200);
    } catch (e) {
      setGeneratedExerciseNotice('Erreur lors de la génération.');
    } finally {
      setIsGeneratingExercise(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.tutors.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t.tutors.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Toggle */}
          <button
            onClick={toggleAiDisabled}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              aiDisabled
                ? 'bg-slate-200 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                : 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400'
            }`}
          >
            {aiDisabled ? <BotOff className="h-4 w-4" /> : <Bot className="h-4 w-4 text-orange-500" />}
            <span>{aiDisabled ? t.topbar.aiOff : t.topbar.aiOn}</span>
          </button>

          {/* Socratic Mode Toggle */}
          <button
            onClick={toggleSocraticMode}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              socraticMode
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>{socraticMode ? 'Mode Socratique : ON' : 'Mode Socratique : OFF'}</span>
          </button>
        </div>
      </div>

      {/* Tutors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tutors.map((tutor) => {
          const isSelected = activeTutor.id === tutor.id;
          return (
            <div
              key={tutor.id}
              onClick={() => setActiveTutorId(tutor.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all hover:scale-[1.01] ${
                isSelected
                  ? 'border-orange-500 bg-gradient-to-b from-orange-500/10 to-transparent shadow-lg shadow-orange-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E131F]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${tutor.avatarColor} text-2xl shadow-sm`}>
                  {tutor.avatar}
                </div>
                {isSelected && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Check className="h-3 w-3" />
                    <span>Actif</span>
                  </span>
                )}
                {tutor.isCustom && !isSelected && (
                  <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {t.tutors.customAgentBadge}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {tutor.name}
              </h3>
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                {tutor.role[language]}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                {tutor.bio[language]}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rigueur : {tutor.strictness}/5</span>
                <span>Guidage Socratique : {tutor.socraticFactor}%</span>
              </div>
            </div>
          );
        })}

        {/* Create Custom Agent Card */}
        <button
          onClick={() => setShowCreator(true)}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all hover:border-orange-500 hover:bg-orange-500/5 ${
            theme === 'noir' ? 'border-slate-800 bg-[#0E131F]/40' : 'border-slate-300 bg-slate-50/50'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-2">
            <Plus className="h-6 w-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            {t.tutors.customTitle}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
            Définissez son avatar, son exigence et ses consignes de mentorat.
          </p>
        </button>
      </div>

      {/* Socratic Mode Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">{t.tutors.socraticToggle}</strong>
          <p className="text-xs leading-relaxed">{t.tutors.socraticDesc}</p>
        </div>
      </div>

      {/* Interactive Chat with Active Tutor */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-xl ${
          theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white'
        }`}
      >
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeTutor.avatar}</span>
            <div>
              <h3 className="text-sm font-bold">{activeTutor.name}</h3>
              <p className="text-[11px] text-slate-500">{activeTutor.personality[language]}</p>
            </div>
          </div>

          {/* Action: Generate Custom Verified Exercise */}
          <button
            onClick={handleGenerateCustomExercise}
            disabled={isGeneratingExercise}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:from-orange-500 hover:to-amber-500 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isGeneratingExercise ? 'Génération...' : t.tutors.generateCustomExercise}</span>
          </button>
        </div>

        {generatedExerciseNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>{generatedExerciseNotice}</span>
            <span>Chargement...</span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[420px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  msg.sender === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white'
                }`}
              >
                {msg.sender === 'user' ? 'Moi' : activeTutor.avatar}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-orange-600 text-white rounded-tr-xs'
                    : theme === 'noir'
                    ? 'bg-slate-800/80 text-slate-100 rounded-tl-xs border border-slate-700/60'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span className={`block text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-orange-200' : 'text-slate-400'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <span className="text-xl animate-bounce">{activeTutor.avatar}</span>
              <span>{activeTutor.name} réfléchit à une réponse adaptée...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Suggestions :</span>
          {[
            'Pourquoi le mode socratique ?',
            'Explique la descente de gradient',
            'Comment concevoir une ALU ?',
            'Quel est le rôle du module n en RSA ?',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => setInputMessage(promptText)}
              className="rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-orange-500 hover:text-white px-3 py-1 text-[11px] whitespace-nowrap transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="flex gap-2 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t.tutors.askTutor}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/50 ${
              theme === 'noir' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white'
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 disabled:opacity-50 transition-all"
          >
            <span>{t.tutors.send}</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Custom Agent Creation Modal */}
      {showCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F] text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              <span>{t.tutors.customTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Façonnez un agent d'apprentissage avec votre propre style pédagogique.
            </p>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Nom de l'agent :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alan, Euler, CyberTutor..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${
                    theme === 'noir' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Avatar (Emoji) :</label>
                <div className="flex gap-2">
                  {['🤖', '🦊', '🧠', '🧙‍♂️', '⚡', '🦉', '🚀', '💻'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setCustomAvatar(em)}
                      className={`h-9 w-9 rounded-xl border text-lg flex items-center justify-center transition-all ${
                        customAvatar === em ? 'border-orange-500 bg-orange-500/20' : 'border-slate-700'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Rôle & Spécialité :</label>
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${
                    theme === 'noir' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Personnalité & Ton pédagogique :</label>
                <textarea
                  rows={2}
                  value={customPersonality}
                  onChange={(e) => setCustomPersonality(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${
                    theme === 'noir' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Guidage Socratique :</span>
                  <span className="text-orange-500">{customSocratic}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customSocratic}
                  onChange={(e) => setCustomSocratic(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <span className="text-[10px] text-slate-400">
                  (0% = Réponses directes avec code complet, 100% = Pure maïeutique socratique sans code direct)
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreator(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
                >
                  {t.tutors.createAgent}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
