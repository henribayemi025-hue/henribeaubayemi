import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Search, 
  Mail, 
  Flame, 
  Radio, 
  X,
  SlidersHorizontal,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { FilterType } from '../types';

interface HeaderProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSubscribe: () => void;
  savedCount: number;
  showSavedOnly: boolean;
  onToggleSavedOnly: () => void;
  itemCounts: {
    github: number;
    prompts: number;
    news: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onOpenSubscribe,
  savedCount,
  showSavedOnly,
  onToggleSavedOnly,
  itemCounts
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(34); // in %

  // Simulated audio progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 350);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'Tout le flux', count: itemCounts.github + itemCounts.prompts + itemCounts.news },
    { id: 'github', label: 'GitHub Trending', count: itemCounts.github },
    { id: 'prompts', label: 'Prompts IA', count: itemCounts.prompts },
    { id: 'news', label: 'Actualités', count: itemCounts.news }
  ];

  return (
    <header className="relative w-full border-b border-white/[0.06] bg-[#07090E]/80 backdrop-blur-2xl sticky top-0 z-40">
      {/* Subtle top rainbow edge */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/60 to-violet-500/60" />

      {/* Top 3-Zone Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Zone 1: Single text element Brand */}
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="group flex items-center gap-2.5 text-slate-100 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 p-[1px] shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#0B0F19] rounded-[7px] flex items-center justify-center">
                  <span className="font-mono text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                    FP
                  </span>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                Finjaro<span className="text-cyan-400 font-light">Pulse</span>
              </span>
            </a>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-xs text-slate-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Édition #142 · En direct</span>
            </div>
          </div>

          {/* Zone 2: Navigation & Quick search on desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher un repo, prompt, mot-clé (#Agents, vLLM)..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-500 outline-none transition-all duration-200 focus:bg-white/[0.06]"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Zone 3: Actions (Bookmarks toggle + Subscribe) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleSavedOnly}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-200 ${
                showSavedOnly 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Afficher mes éléments sauvegardés"
            >
              <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Favoris</span>
              {savedCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-200">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenSubscribe}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-300 hover:opacity-95 transition-all duration-200 rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Recevoir le brief</span>
            </button>
          </div>

        </div>

        {/* Mobile Search input */}
        <div className="mt-3 lg:hidden">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher dans le flux..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Header Editorial Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tracking-wide uppercase mb-1">
            <span>Vendredi 2 Octobre 2026</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400/90 font-medium">Veille Stratégique IA & Engineering</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-display">
            Le radar quotidien de l&apos;écosystème IA
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl text-balance">
            Sélection ultra-rigoureuse des nouveaux repos majeurs, du prompt engineering prêt à l&apos;emploi et des décryptages architecturaux.
          </p>
        </div>

        {/* Mini Audio Digest Bar (Glassmorphic interactive player) */}
        <div className="shrink-0 flex items-center gap-3 p-2.5 px-3.5 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl max-w-md w-full md:w-auto">
          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
            aria-label={isPlayingAudio ? 'Mettre en pause le résumé audio' : 'Écouter le résumé audio'}
          >
            {isPlayingAudio ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <div className="flex-1 min-w-[150px]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-medium text-slate-200 flex items-center gap-1.5">
                <Radio className={`w-3 h-3 ${isPlayingAudio ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                Digest Audio IA
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                {isPlayingAudio ? '01:14 / 02:40' : '2 min 40s'}
              </span>
            </div>

            {/* Simulated audio waveform progress */}
            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar (Glassmorphism segmented controls) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pt-1">
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl backdrop-blur-xl">
            {filters.map((tab) => {
              const isActive = currentFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onFilterChange(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/15 shadow-sm shadow-black/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  {tab.id === 'github' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  {tab.id === 'prompts' && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                  {tab.id === 'news' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Mis à jour il y a 12 min</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
