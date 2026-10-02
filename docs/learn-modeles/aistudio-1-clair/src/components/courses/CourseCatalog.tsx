import React, { useState } from 'react';
import {
  Code2,
  Database,
  Brain,
  Layers,
  Terminal,
  Compass,
  Shield,
  Cpu,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tracksData } from '../../data/coursesData';
import { Track, Lesson } from '../../types';

export const CourseCatalog: React.FC = () => {
  const {
    t,
    language,
    theme,
    user,
    setSelectedTrack,
    setSelectedLesson,
    setActiveView,
    setActiveProjectTab,
  } = useApp();

  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2': return Code2;
      case 'Database': return Database;
      case 'Brain': return Brain;
      case 'Layers': return Layers;
      case 'Terminal': return Terminal;
      case 'Compass': return Compass;
      case 'Shield': return Shield;
      case 'Cpu': return Cpu;
      default: return Code2;
    }
  };

  const filteredTracks = tracksData.filter((track) => {
    if (selectedLevel !== 'all' && track.level !== selectedLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const trackTitle = track.title[language].toLowerCase();
      const trackDesc = track.description[language].toLowerCase();
      const matchesLessons = track.lessons.some(
        (l) =>
          l.title[language].toLowerCase().includes(q) ||
          l.subtitle[language].toLowerCase().includes(q)
      );
      return trackTitle.includes(q) || trackDesc.includes(q) || matchesLessons;
    }
    return true;
  });

  const handleStartLesson = (track: Track, lesson: Lesson) => {
    setSelectedTrack(track);
    setSelectedLesson(lesson);
    setActiveView('lesson');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${
        theme === 'noir'
          ? 'border-slate-800 bg-gradient-to-br from-slate-900 via-[#0E131F] to-[#141C2E]'
          : 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white'
      }`}>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-4 border border-orange-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>122 {t.tracks.lessonsCount} • 8 {t.nav.courses.toLowerCase()}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {t.tracks.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            {t.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleStartLesson(tracksData[0], tracksData[0].lessons[0])}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 transition-all hover:scale-[1.02]"
            >
              <span>{t.tracks.startTrack}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveView('projects')}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                theme === 'noir'
                  ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                  : 'border-orange-200 bg-white/80 text-orange-700 hover:bg-white'
              }`}
            >
              <Brain className="h-4 w-4 text-orange-500" />
              <span>{t.nav.projects}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cornerstone Projects Quick Access Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'neural_net', name: t.projects.neuralNetTitle.split('&')[0], icon: Brain, color: 'text-purple-500 bg-purple-500/10' },
          { id: 'rag', name: t.projects.ragTitle.split('&')[0], icon: Layers, color: 'text-emerald-500 bg-emerald-500/10' },
          { id: 'mini_cpu', name: t.projects.cpuTitle.split('&')[0], icon: Cpu, color: 'text-cyan-500 bg-cyan-500/10' },
          { id: 'crypto_rsa', name: t.projects.cryptoTitle.split(' ')[0] + ' RSA', icon: Shield, color: 'text-rose-500 bg-rose-500/10' },
        ].map((proj) => {
          const Icon = proj.icon;
          return (
            <button
              key={proj.id}
              onClick={() => {
                setActiveProjectTab(proj.id as any);
                setActiveView('projects');
              }}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                theme === 'noir'
                  ? 'border-slate-800 bg-[#0E131F]/90 hover:border-slate-700'
                  : 'border-slate-200/80 bg-white hover:border-orange-300 shadow-xs'
              }`}
            >
              <div className={`p-2 rounded-xl ${proj.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Projet Clé</span>
                <span className="text-xs font-bold truncate block">{proj.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher une notion, un code, un algo...' : 'Search a concept, code, or algo...'}
            className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/50 transition-all ${
              theme === 'noir'
                ? 'border-slate-800 bg-[#0E131F] text-white placeholder:text-slate-500'
                : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Level Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 rounded-xl p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            {[
              { id: 'all', label: language === 'fr' ? 'Tous' : 'All' },
              { id: 'debutant', label: t.tracks.beginner },
              { id: 'intermediaire', label: t.tracks.intermediate },
              { id: 'avance', label: t.tracks.advanced },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedLevel === tab.id
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 8 Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTracks.map((track) => {
          const Icon = getTrackIcon(track.icon);
          const completedInTrack = track.lessons.filter((l) => user.completedLessons.includes(l.id)).length;
          const progressPercent = Math.round((completedInTrack / Math.max(1, track.totalLessons)) * 100);

          return (
            <div
              key={track.id}
              className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:shadow-xl ${
                theme === 'noir'
                  ? 'border-slate-800 bg-[#0E131F] hover:border-slate-700'
                  : 'border-slate-200 bg-white hover:border-orange-300'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: track.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {track.title[language]}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {track.totalLessons} {t.tracks.lessonsCount}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {track.level === 'debutant'
                            ? t.tracks.beginner
                            : track.level === 'intermediaire'
                            ? t.tracks.intermediate
                            : t.tracks.advanced}
                        </span>
                      </div>
                    </div>
                  </div>

                  {completedInTrack > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{completedInTrack}/{track.totalLessons}</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {track.description[language]}
                </p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                    <span>{language === 'fr' ? 'Progression vérifiée' : 'Verified progress'}</span>
                    <span className="font-bold">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Lessons preview list */}
                <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  {track.lessons.map((lesson) => {
                    const isDone = user.completedLessons.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleStartLesson(track, lesson)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isDone
                            ? 'bg-emerald-500/5 text-slate-800 dark:text-slate-200'
                            : 'hover:bg-orange-500/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <div className="h-4 w-4 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" />
                          )}
                          <span className="truncate font-medium">{lesson.title[language]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] shrink-0 ml-2">
                          <Clock className="h-3 w-3" />
                          <span>{lesson.durationMinutes}m</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => handleStartLesson(track, track.lessons[0])}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600/10 py-2.5 text-xs font-bold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 hover:bg-orange-600 hover:text-white transition-all"
                >
                  <span>
                    {completedInTrack === 0 ? t.tracks.startTrack : t.tracks.continueTrack}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
