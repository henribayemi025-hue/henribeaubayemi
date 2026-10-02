import React, { useState } from 'react';
import {
  Wrench,
  BookOpen,
  Briefcase,
  Radio,
  Sparkles,
  RotateCw,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Brain,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { defaultAiNews } from '../../data/initialData';
import { generateFlashcardsAndQuiz, generateCareerDoc } from '../../services/geminiService';
import { Flashcard, QuizQuestion } from '../../types';

export const ToolsView: React.FC = () => {
  const { t, theme, language, user, triggerConfetti } = useApp();

  const [activeTab, setActiveTab] = useState<'flashcards' | 'career' | 'radar'>('flashcards');

  // FLASHCARDS & QUIZ STATE
  const [selectedTopic, setSelectedTopic] = useState<string>('Réseaux de neurones et rétropropagation');
  const [isGeneratingCards, setIsGeneratingCards] = useState<boolean>(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      front: language === 'en' ? 'Why is ReLU preferred over Sigmoid in deep networks?' : 'Pourquoi ReLU est-elle préférée à la Sigmoïde dans les couches profondes ?',
      back: language === 'en' ? 'ReLU has a constant derivative of 1 for positive inputs, avoiding vanishing gradients during backpropagation.' : 'ReLU a une dérivée constante égale à 1 pour z > 0, évitant l\'atténuation exponentielle du gradient lors de la rétropropagation.',
      codeSnippet: 'const relu = z => Math.max(0, z);',
    },
    {
      front: language === 'en' ? 'What does Cosine Similarity compute in RAG?' : 'Que mesure la similarité cosinus dans un système RAG ?',
      back: language === 'en' ? 'The cosine of the angle between query and document vectors, invariant to text length.' : 'Le cosinus de l\'angle entre le vecteur requête et le vecteur document, indépendant de la longueur absolue.',
      codeSnippet: 'cosSim = dot(A, B) / (norm(A) * norm(B));',
    },
  ]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      question: language === 'en' ? 'Which component stores the instruction address in a CPU?' : 'Quel registre contient l\'adresse mémoire de la prochaine instruction dans un CPU ?',
      options: ['Accumulateur', 'Program Counter (PC)', 'ALU', 'RAM'],
      correctIndex: 1,
      explanation: language === 'en' ? 'The Program Counter (PC) points to the next instruction in memory.' : 'Le Program Counter (PC) pointe vers l\'adresse mémoire de la prochaine instruction à exécuter.',
    },
  ]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // CAREER STUDIO STATE
  const [careerType, setCareerType] = useState<'cv' | 'coverLetter'>('cv');
  const [targetRole, setTargetRole] = useState<string>('Ingénieur IA & Développeur Full-Stack');
  const [targetCompany, setTargetCompany] = useState<string>('Finjaro');
  const [careerOutput, setCareerOutput] = useState<string>('');
  const [isGeneratingCareer, setIsGeneratingCareer] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateCards = async () => {
    setIsGeneratingCards(true);
    try {
      const res = await generateFlashcardsAndQuiz({
        topic: selectedTopic,
        language,
      });
      if (res.flashcards && res.flashcards.length > 0) {
        setFlashcards(res.flashcards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
      if (res.quiz && res.quiz.length > 0) {
        setQuizQuestions(res.quiz);
        setSelectedOption(null);
        setQuizSubmitted(false);
      }
      triggerConfetti();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const handleGenerateCareerDoc = async () => {
    setIsGeneratingCareer(true);
    try {
      const text = await generateCareerDoc({
        type: careerType,
        role: targetRole,
        targetCompany,
        userProfile: {
          name: user.name,
          projects: ['Neural Network from scratch', 'RAG Semantic Engine', 'Mini-CPU 8-bit ALU', 'RSA Cryptography'],
        },
        language,
      });
      setCareerOutput(text);
      triggerConfetti();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCareer(false);
    }
  };

  const handleCopyCareer = () => {
    navigator.clipboard.writeText(careerOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCard = flashcards[currentCardIndex] || flashcards[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.tools.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.tools.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'flashcards', label: t.tools.tabFlashcards, icon: BookOpen },
          { id: 'career', label: t.tools.tabCareer, icon: Briefcase },
          { id: 'radar', label: t.tools.tabRadar, icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
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

      {/* 1. FLASHCARDS & QUIZ TAB */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          {/* Generation bar */}
          <div
            className={`rounded-2xl border p-5 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {t.tools.flashcardsTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{t.tools.flashcardsDesc}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="Ex: Rétropropagation, RSA, ALU..."
                className={`flex-1 rounded-xl border px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/50 ${
                  theme === 'noir' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                }`}
              />
              <button
                onClick={handleGenerateCards}
                disabled={isGeneratingCards || !selectedTopic.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGeneratingCards ? 'Génération...' : t.tools.generateCards}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interactive Flashcard */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">
                  Fiche {currentCardIndex + 1} / {flashcards.length}
                </span>
                <span>{t.tools.flipCard}</span>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`cursor-pointer min-h-[260px] rounded-3xl border-2 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl select-none ${
                  isFlipped
                    ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 to-slate-900 text-white'
                    : theme === 'noir'
                    ? 'border-orange-500/40 bg-gradient-to-br from-orange-950/20 to-slate-900 text-white'
                    : 'border-orange-200 bg-gradient-to-br from-orange-50/50 to-white text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    isFlipped ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                  }`}>
                    {isFlipped ? 'Verso (Réponse & Code)' : 'Recto (Question)'}
                  </span>
                  <RotateCw className="h-4 w-4 text-slate-400" />
                </div>

                <div className="py-4 my-auto">
                  {!isFlipped ? (
                    <p className="text-base sm:text-lg font-bold leading-relaxed">
                      {currentCard?.front}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                        {currentCard?.back}
                      </p>
                      {currentCard?.codeSnippet && (
                        <pre className="p-3 rounded-xl bg-[#090D16] text-[11px] font-mono-code text-emerald-300 overflow-x-auto">
                          <code>{currentCard.codeSnippet}</code>
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-center text-slate-400">
                  {t.tools.flipCard}
                </p>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold"
                >
                  &larr; Précédente
                </button>
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
                  }}
                  className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500"
                >
                  Suivante &rarr;
                </button>
              </div>
            </div>

            {/* Timed Knowledge Quiz */}
            <div
              className={`rounded-3xl border p-6 flex flex-col justify-between ${
                theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                  {t.tools.quizTitle}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {quizQuestions[0]?.question}
                </h4>

                <div className="mt-4 space-y-2">
                  {quizQuestions[0]?.options.map((opt, idx) => {
                    const isCorrect = idx === quizQuestions[0].correctIndex;
                    const isSelected = selectedOption === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!quizSubmitted) setSelectedOption(idx);
                        }}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                          quizSubmitted && isCorrect
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold'
                            : quizSubmitted && isSelected && !isCorrect
                            ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                            : isSelected
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt}</span>
                          {quizSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold block mb-1">Explication :</span>
                    <p>{quizQuestions[0]?.explanation}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {!quizSubmitted ? (
                  <button
                    disabled={selectedOption === null}
                    onClick={() => {
                      setQuizSubmitted(true);
                      if (selectedOption === quizQuestions[0].correctIndex) {
                        triggerConfetti();
                      }
                    }}
                    className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-50"
                  >
                    Valider la réponse
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedOption(null);
                      setQuizSubmitted(false);
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 py-2.5 text-xs font-bold"
                  >
                    Recommencer le quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CAREER STUDIO TAB */}
      {activeTab === 'career' && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.tools.careerTitle}
              </h3>
              <p className="text-xs text-slate-500">{t.tools.careerDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1">Type de document :</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCareerType('cv')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      careerType === 'cv'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t.tools.cvSection}
                  </button>
                  <button
                    onClick={() => setCareerType('coverLetter')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      careerType === 'coverLetter'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t.tools.coverLetterSection}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{t.tools.targetRole}</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${
                    theme === 'noir' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{t.tools.targetCompany}</label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${
                    theme === 'noir' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateCareerDoc}
                disabled={isGeneratingCareer}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGeneratingCareer ? 'Génération...' : t.tools.generateDoc}</span>
              </button>
            </div>

            {/* Generated Document Output */}
            {careerOutput && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Aperçu du document généré
                  </span>
                  <button
                    onClick={handleCopyCareer}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold hover:border-orange-500"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? t.tools.copied : t.tools.copyResult}</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-[#090D16] p-5 text-xs sm:text-sm font-mono-code text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {careerOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AI RADAR / NEWS TAB */}
      {activeTab === 'radar' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {defaultAiNews.map((article) => (
              <div
                key={article.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:scale-[1.01] ${
                  theme === 'noir'
                    ? 'border-slate-800 bg-[#0E131F]'
                    : 'border-slate-200 bg-white shadow-xs hover:border-orange-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="rounded-md bg-orange-500/10 px-2 py-0.5 font-bold uppercase text-orange-600 dark:text-orange-400">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {article.title[language]}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {article.summary[language]}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t.tools.keyTakeaways} :
                    </span>
                    {article.keyTakeaways[language].map((k, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-orange-500 font-bold">•</span>
                        <span>{k}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Source : {article.source}</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{article.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
