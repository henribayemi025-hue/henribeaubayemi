import React, { useState } from 'react';
import {
  Flame,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  Clock,
  Code2,
  Calendar,
  Network,
  ChevronRight,
  ShieldCheck,
  Brain,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tracksData } from '../../data/coursesData';

export const ProgressView: React.FC = () => {
  const {
    t,
    theme,
    language,
    user,
    achievements,
    setSelectedTrack,
    setSelectedLesson,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tree' | 'achievements' | 'stats'>('tree');

  // Compute skill nodes
  const skillNodes = [
    { id: 'prog', trackId: 'programming', label: 'Programmation Fondamentale', icon: Code2, dependencies: [], level: 1 },
    { id: 'ds', trackId: 'datascience', label: 'Data Science & Tenseurs', icon: TrendingUp, dependencies: ['prog'], level: 2 },
    { id: 'math', trackId: 'maths', label: 'Mathématiques & Algèbre', icon: Brain, dependencies: ['prog'], level: 2 },
    { id: 'dl', trackId: 'deeplearning', label: 'IA & Deep Learning', icon: Sparkles, dependencies: ['ds', 'math'], level: 3 },
    { id: 'aieng', trackId: 'aiengineering', label: 'AI Engineering & RAG', icon: Network, dependencies: ['dl'], level: 4 },
    { id: 'pe', trackId: 'prompteng', label: 'Prompt Engineering', icon: Code2, dependencies: ['aieng'], level: 4 },
    { id: 'comp', trackId: 'computers', label: 'Architecture Processeur', icon: Award, dependencies: ['prog'], level: 2 },
    { id: 'crypto', trackId: 'crypto', label: 'Cryptographie RSA', icon: ShieldCheck, dependencies: ['comp', 'math'], level: 3 },
  ];

  const totalPossibleLessons = tracksData.reduce((acc, t) => acc + t.totalLessons, 0);
  const masteryPercent = Math.min(100, Math.round((user.completedLessons.length / totalPossibleLessons) * 100));
  const successRate = user.codeRunsCount > 0
    ? Math.round((user.testPassCount / user.codeRunsCount) * 100)
    : 100;

  const handleNodeClick = (trackId: string) => {
    const track = tracksData.find((t) => t.id === trackId);
    if (track) {
      setSelectedTrack(track);
      setSelectedLesson(track.lessons[0]);
      setActiveView('lesson');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.tree.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.tree.subtitle}
        </p>
      </div>

      {/* Verified Real Analytics Banner */}
      <div
        className={`rounded-2xl border p-5 ${
          theme === 'noir'
            ? 'border-slate-800 bg-gradient-to-r from-slate-900 via-[#0E131F] to-slate-900'
            : 'border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50/40 to-white'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3">
          <ShieldCheck className="h-4 w-4" />
          <span>{t.stats.realDataNotice}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 block">{t.stats.lessonsCompleted}</span>
            <strong className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">
              {user.completedLessons.length}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 block">{t.stats.codeRuns}</span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {user.codeRunsCount}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 block">{t.stats.successRate}</span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {successRate}%
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 block">{t.stats.studyTime}</span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {user.studyMinutes}m
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'tree', label: t.nav.tree, icon: Network },
          { id: 'achievements', label: t.tree.achievementsTitle, icon: Award },
          { id: 'stats', label: t.tree.streakTitle, icon: Calendar },
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

      {/* 1. SKILL TREE VIEW */}
      {activeTab === 'tree' && (
        <div
          className={`rounded-2xl border p-6 ${
            theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cartographie des Domaines Maîtrisés
              </h3>
              <p className="text-xs text-slate-500">
                Cliquez sur un nœud pour ouvrir le parcours correspondant.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">{t.tree.statusMastered}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-slate-400">{t.tree.statusInProgress}</span>
              </span>
            </div>
          </div>

          {/* Node Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {skillNodes.map((node) => {
              const Icon = node.icon;
              const relatedTrack = tracksData.find((t) => t.id === node.trackId);
              const completedCount = relatedTrack?.lessons.filter((l) => user.completedLessons.includes(l.id)).length || 0;
              const isMastered = completedCount > 0 && completedCount === (relatedTrack?.lessons.length || 1);
              const isInProgress = completedCount > 0;

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.trackId)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.02] ${
                    isMastered
                      ? 'border-emerald-500/50 bg-emerald-950/10 dark:bg-emerald-950/20'
                      : isInProgress
                      ? 'border-orange-500/60 bg-orange-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    {isMastered ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{t.tree.statusMastered}</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {t.tree.statusInProgress}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Niveau {node.level}</span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {node.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {completedCount}/{relatedTrack?.totalLessons} leçons validées
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-orange-600 dark:text-orange-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span>Accéder &rarr;</span>
                    <span>{relatedTrack?.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ACHIEVEMENTS & BADGES */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-2xl border p-5 transition-all ${
                ach.unlocked
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent'
                  : 'border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-xs ${
                    ach.unlocked
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Award className="h-6 w-6" />
                </div>
                {ach.unlocked ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300">
                    Débloqué
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Lock className="h-3 w-3" />
                    <span>À débloquer</span>
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {ach.title[language]}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {ach.description[language]}
              </p>

              {ach.unlockedAt && (
                <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  Obtenu le {new Date(ach.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. STREAK & CALENDAR HEATMAP */}
      {activeTab === 'stats' && (
        <div
          className={`rounded-2xl border p-6 ${
            theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500">
                <Flame className="h-7 w-7 fill-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {user.streak} {t.topbar.streak} consécutifs
                </h3>
                <p className="text-xs text-slate-500">
                  Chaque jour avec au moins 1 exercice validé alimente votre série active.
                </p>
              </div>
            </div>
          </div>

          {/* 30-Day Activity Heatmap Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Activité des 28 derniers jours
            </span>
            <div className="grid grid-cols-7 gap-2 pt-2">
              {Array.from({ length: 28 }).map((_, i) => {
                const dayNumber = i + 1;
                const isActive = i >= 21; // Last 7 days active
                return (
                  <div
                    key={i}
                    title={`Jour ${dayNumber} - ${isActive ? 'Actif' : 'Inactif'}`}
                    className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    {dayNumber}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
