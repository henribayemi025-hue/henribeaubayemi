import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Bot,
  Terminal as TerminalIcon,
  ChevronRight,
  Lightbulb,
  ExternalLink,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { executeUserCode, CodeRunResult } from '../../services/codeRunner';
import { askTutorChat } from '../../services/geminiService';

export const LessonPlayer: React.FC = () => {
  const {
    selectedLesson,
    selectedTrack,
    language,
    theme,
    t,
    user,
    completeLesson,
    recordCodeRun,
    saveCodeDraft,
    activeTutor,
    socraticMode,
    toggleSocraticMode,
    aiDisabled,
    setActiveView,
    setActiveProjectTab,
  } = useApp();

  if (!selectedLesson) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Aucune leçon sélectionnée.</p>
        <button
          onClick={() => setActiveView('courses')}
          className="mt-4 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white"
        >
          {t.tracks.allTracks}
        </button>
      </div>
    );
  }

  // Active step in the 3-step journey: 1 = Explication, 2 = Exemple, 3 = Exercice
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // User code in the editor
  const [code, setCode] = useState<string>(() => {
    return user.lessonDrafts[selectedLesson.id] || selectedLesson.exercise.starterCode;
  });

  // Test execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'tests' | 'terminal'>('tests');

  // Consecutive failures tracking for proactive tutor hint
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);
  const [showProactiveHint, setShowProactiveHint] = useState<boolean>(false);
  const [proactiveHintText, setProactiveHintText] = useState<string>('');
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false);

  // In-lesson quick tutor ask drawer
  const [tutorQuestion, setTutorQuestion] = useState<string>('');
  const [tutorReply, setTutorReply] = useState<string>('');
  const [isAskingTutor, setIsAskingTutor] = useState<boolean>(false);
  const [showTutorChat, setShowTutorChat] = useState<boolean>(false);

  // Reset editor code whenever lesson changes
  useEffect(() => {
    const draft = user.lessonDrafts[selectedLesson.id];
    setCode(draft || selectedLesson.exercise.starterCode);
    setRunResult(null);
    setConsecutiveFailures(0);
    setShowProactiveHint(false);
    setProactiveHintText('');
    setTutorReply('');
    setCurrentStep(1);
  }, [selectedLesson.id]);

  // Execute Code and Run Tests
  const handleRunCode = () => {
    setIsRunning(true);
    saveCodeDraft(selectedLesson.id, code);

    setTimeout(() => {
      const result = executeUserCode(code, selectedLesson.exercise.testCases, language);
      setRunResult(result);
      setIsRunning(false);
      recordCodeRun(result.success);

      if (result.success) {
        completeLesson(selectedLesson.id, 60);
        setConsecutiveFailures(0);
        setShowProactiveHint(false);
      } else {
        const nextFailures = consecutiveFailures + 1;
        setConsecutiveFailures(nextFailures);

        // Proactive hint automatically triggers after 2 consecutive failures
        if (nextFailures >= 2 && !aiDisabled) {
          triggerProactiveTutorHint();
        }
      }
    }, 250);
  };

  // Run the Example Code directly into the terminal
  const handleRunExample = () => {
    setCurrentStep(3);
    const result = executeUserCode(selectedLesson.exampleCode, [], language);
    setRunResult(result);
    setActiveConsoleTab('terminal');
  };

  const handleResetCode = () => {
    setCode(selectedLesson.exercise.starterCode);
    saveCodeDraft(selectedLesson.id, selectedLesson.exercise.starterCode);
    setRunResult(null);
    setConsecutiveFailures(0);
    setShowProactiveHint(false);
  };

  // Proactive tutor hint fetch
  const triggerProactiveTutorHint = async () => {
    setShowProactiveHint(true);
    setIsLoadingHint(true);
    try {
      const hint = await askTutorChat({
        message: `L'élève a échoué 2 fois de suite sur l'exercice "${selectedLesson.title[language]}". Voici son code actuel :\n${code}\nDonne un indice ciblé et bienveillant sans donner la solution directement.`,
        tutorName: activeTutor.name,
        personality: activeTutor.personality[language],
        socraticMode: socraticMode,
        context: selectedLesson.title[language],
        language,
      });
      setProactiveHintText(hint);
    } catch (e) {
      setProactiveHintText(selectedLesson.exercise.hints[language][0] || 'Vérifie bien la valeur retournée par la fonction.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleAskTutor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tutorQuestion.trim() || isAskingTutor) return;

    setIsAskingTutor(true);
    try {
      const reply = await askTutorChat({
        message: tutorQuestion,
        tutorName: activeTutor.name,
        personality: activeTutor.personality[language],
        socraticMode: socraticMode,
        context: `Leçon: ${selectedLesson.title[language]}. Code de l'élève:\n${code}`,
        language,
      });
      setTutorReply(reply);
      setTutorQuestion('');
    } catch (err) {
      setTutorReply(language === 'fr' ? 'Désolé, réessaye dans un instant.' : 'Please try again in a moment.');
    } finally {
      setIsAskingTutor(false);
    }
  };

  const insertHelperKey = (char: string) => {
    setCode((prev) => prev + char);
  };

  const isCompleted = user.completedLessons.includes(selectedLesson.id);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('courses')}
            className={`flex items-center gap-1 rounded-xl p-2 text-xs font-semibold transition-colors ${
              theme === 'noir'
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t.lesson.backToCatalog}</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {selectedTrack?.title[language]}
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{t.tracks.completed}</span>
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {selectedLesson.title[language]}
            </h1>
          </div>
        </div>

        {/* Milestone Project Shortcut if available */}
        {selectedLesson.milestoneProject && (
          <button
            onClick={() => {
              setActiveProjectTab(selectedLesson.milestoneProject as any);
              setActiveView('projects');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600/10 px-3 py-1.5 text-xs font-bold text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.lesson.interactiveProject}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* 3-Step Journey Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          {[
            { step: 1, label: t.lesson.stepExplanation, icon: BookOpen },
            { step: 2, label: t.lesson.stepExample, icon: TerminalIcon },
            { step: 3, label: t.lesson.stepExercise, icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentStep === tab.step;
            return (
              <button
                key={tab.step}
                onClick={() => setCurrentStep(tab.step as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Socratic Mode Badge / Switch */}
        {!aiDisabled && (
          <button
            onClick={toggleSocraticMode}
            title={t.tutors.socraticDesc}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              socraticMode
                ? 'bg-amber-500/15 text-amber-700 border border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{socraticMode ? 'Socratique ON' : 'Direct ON'}</span>
          </button>
        )}
      </div>

      {/* STEP 1: EXPLICATION */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className={`rounded-2xl border p-6 ${
                theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              <h2 className="text-base font-bold text-orange-600 dark:text-orange-400 mb-2">
                {t.lesson.objective}
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-4">
                {selectedLesson.subtitle[language]}
              </p>

              <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {selectedLesson.explanation[language]}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {t.lesson.keyConcepts}
                </h3>
                <ul className="space-y-2">
                  {selectedLesson.keyPoints[language].map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-600 font-bold text-[11px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-600/25 hover:bg-orange-500"
              >
                <span>{t.lesson.stepExample}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI Tutor Card & Quick Advice */}
          <div className="space-y-4">
            <div
              className={`rounded-2xl border p-5 ${
                theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-orange-100 bg-orange-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${activeTutor.avatarColor} text-2xl shadow-md`}>
                  {activeTutor.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{activeTutor.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeTutor.role[language]}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-4">
                "{language === 'fr'
                  ? 'La théorie s\'ancre définitivement quand tes doigts tapent le premier test. Regardons l\'exemple puis passons au code.'
                  : 'Theory only clicks when your fingers run the first unit test. Let us inspect the example, then build.'}"
              </p>

              <button
                onClick={() => setShowTutorChat(!showTutorChat)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-white/80 dark:bg-slate-800/80 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{language === 'fr' ? 'Discuter avec ' + activeTutor.name : 'Chat with ' + activeTutor.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: EXEMPLE DE CODE */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.lesson.stepExample}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedLesson.exampleExplanation[language]}
                </p>
              </div>
              <button
                onClick={handleRunExample}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 shadow-md shadow-orange-600/20"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{t.lesson.runExample}</span>
              </button>
            </div>

            {/* Code Block with syntax highlight look */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090D16]">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-mono-code">
                <span>example.{selectedLesson.language === 'python' ? 'py' : 'js'}</span>
                <span className="text-orange-400 font-bold">Lecture seule</span>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono-code text-slate-200 overflow-x-auto leading-relaxed">
                <code>{selectedLesson.exampleCode}</code>
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t.lesson.stepExplanation}</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-600/25 hover:bg-orange-500"
            >
              <span>{t.lesson.stepExercise}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EXERCICE À CODER (THE CODE RUNNER WORKSPACE) */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Proactive Tutor Hint Popup (after 2 consecutive failures) */}
          {showProactiveHint && (
            <div className="rounded-2xl border-2 border-orange-500 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-4 sm:p-5 shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${activeTutor.avatarColor} text-xl shadow-xs`}>
                  {activeTutor.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      {activeTutor.name} • {t.lesson.tutorProactiveHint}
                    </span>
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {isLoadingHint ? (
                      <span className="italic text-slate-400">{language === 'fr' ? 'Analyse de votre code en cours...' : 'Analyzing your code...'}</span>
                    ) : (
                      <p className="whitespace-pre-line leading-relaxed font-medium">
                        {proactiveHintText}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowProactiveHint(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Exercise Instructions Card */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                <span>{t.lesson.instructions}</span>
              </h2>
              <button
                onClick={() => {
                  setProactiveHintText(selectedLesson.exercise.hints[language][0] || 'Vérifie bien les types en entrée.');
                  setShowProactiveHint(true);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>{t.lesson.getHint}</span>
              </button>
            </div>

            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {selectedLesson.exercise.instructions[language].map((inst, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code Editor & Execution Workbench */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-xl ${
              theme === 'noir' ? 'border-slate-800 bg-[#090D16]' : 'border-slate-300 bg-[#090D16]'
            }`}
          >
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono-code">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span>solution.{selectedLesson.language === 'python' ? 'py' : 'js'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCode}
                  title={t.lesson.resetCode}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.lesson.resetCode}</span>
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-1.5 font-bold text-white shadow-md shadow-orange-600/30 hover:bg-orange-500 disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isRunning ? t.lesson.running : t.lesson.runCode}</span>
                </button>
              </div>
            </div>

            {/* Mobile Keyboard Helpers Bar */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
              <span className="text-[10px] text-slate-500 font-semibold mr-1 uppercase">Raccourcis :</span>
              {['(', ')', '{', '}', '[', ']', '=', '>', ';', ':', '"', "'", 'return', 'console.log'].map((k) => (
                <button
                  key={k}
                  onClick={() => insertHelperKey(k === 'console.log' ? 'console.log();' : k)}
                  className="rounded-md bg-slate-800/90 hover:bg-orange-600 hover:text-white px-2 py-0.5 font-mono-code text-[11px] transition-colors"
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Code Textarea with line numbers */}
            <div className="relative flex min-h-[220px] max-h-[400px] overflow-hidden bg-[#090D16]">
              {/* Fake line numbers */}
              <div className="select-none py-3 px-2 text-right font-mono-code text-xs text-slate-600 border-r border-slate-800/60 bg-[#070A11] shrink-0 w-9">
                {Array.from({ length: Math.max(12, code.split('\n').length) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Real editable code area */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full resize-none bg-transparent p-3 font-mono-code text-xs sm:text-sm text-slate-100 focus:outline-hidden leading-relaxed"
                rows={Math.max(10, code.split('\n').length)}
              />
            </div>

            {/* Output & Test Runner Panel */}
            <div className="border-t border-slate-800 bg-[#070A11]">
              <div className="flex items-center border-b border-slate-800 px-3">
                <button
                  onClick={() => setActiveConsoleTab('tests')}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-all ${
                    activeConsoleTab === 'tests'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{t.lesson.testResults}</span>
                  {runResult && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                        runResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {runResult.testResults.filter((t) => t.passed).length}/{runResult.testResults.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveConsoleTab('terminal')}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-all ${
                    activeConsoleTab === 'terminal'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TerminalIcon className="h-3.5 w-3.5" />
                  <span>{t.lesson.terminal}</span>
                  {runResult && runResult.logs.length > 0 && (
                    <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                      {runResult.logs.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Test Results View */}
              {activeConsoleTab === 'tests' && (
                <div className="p-4 space-y-2 max-h-56 overflow-y-auto text-xs font-mono-code">
                  {!runResult ? (
                    <p className="text-slate-500 italic">
                      {language === 'fr'
                        ? 'Cliquez sur "Exécuter & Tester" pour valider votre code automatiquement.'
                        : 'Click "Run & Test" to evaluate your code.'}
                    </p>
                  ) : runResult.syntaxError ? (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 text-rose-400">
                      <p className="font-bold flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        <span>Erreur de syntaxe / exécution :</span>
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap text-[11px]">{runResult.syntaxError}</pre>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                        <span>
                          {runResult.success ? (
                            <span className="text-emerald-400 font-bold">{t.lesson.testsPassed}</span>
                          ) : (
                            <span className="text-rose-400 font-bold">{t.lesson.testsFailed}</span>
                          )}
                        </span>
                        <span>{runResult.executionTimeMs} ms</span>
                      </div>

                      {runResult.testResults.map((tc, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl border p-2.5 transition-all ${
                            tc.passed
                              ? 'border-emerald-500/30 bg-emerald-950/15 text-emerald-300'
                              : 'border-rose-500/30 bg-rose-950/15 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {tc.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                              )}
                              <span className="font-semibold">{tc.description}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{tc.call}</span>
                          </div>

                          {!tc.passed && (
                            <div className="mt-2 text-[11px] grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-lg">
                              <div>
                                <span className="text-slate-400">Attendu : </span>
                                <span className="text-emerald-400">{JSON.stringify(tc.expected)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Reçu : </span>
                                <span className="text-rose-400">{JSON.stringify(tc.actual)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Terminal View */}
              {activeConsoleTab === 'terminal' && (
                <div className="p-4 max-h-56 overflow-y-auto text-xs font-mono-code text-slate-300 space-y-1">
                  {runResult && runResult.logs.length > 0 ? (
                    runResult.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-slate-600">&gt;</span>
                        <pre className="whitespace-pre-wrap">{log}</pre>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">Aucune sortie console (console.log).</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating or Embedded Ask-Tutor Drawer */}
      <div
        className={`rounded-2xl border p-4 transition-all ${
          theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-orange-100 bg-orange-50/50'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{activeTutor.avatar}</span>
            <div>
              <h4 className="text-xs font-bold">{t.tutors.chatHistory} ({activeTutor.name})</h4>
              <p className="text-[10px] text-slate-500">
                {socraticMode ? t.lesson.socraticModeActive : 'Conseils directs'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('tutors')}
            className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            {t.tutors.title} &rarr;
          </button>
        </div>

        {tutorReply && (
          <div className="mb-3 rounded-xl border border-orange-500/30 bg-white/80 dark:bg-slate-900/80 p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
            <p className="whitespace-pre-line leading-relaxed font-medium">{tutorReply}</p>
          </div>
        )}

        <form onSubmit={handleAskTutor} className="flex gap-2">
          <input
            type="text"
            value={tutorQuestion}
            onChange={(e) => setTutorQuestion(e.target.value)}
            placeholder={language === 'fr' ? `Posez votre question à ${activeTutor.name}...` : `Ask ${activeTutor.name} anything...`}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/50 ${
              theme === 'noir' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white'
            }`}
          />
          <button
            type="submit"
            disabled={isAskingTutor || !tutorQuestion.trim()}
            className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 hover:bg-orange-500 transition-colors"
          >
            {isAskingTutor ? '...' : t.tutors.send}
          </button>
        </form>
      </div>
    </div>
  );
};
