import React from 'react';
import { FilterCategory } from '../types/pulse';
import { Sparkles, Calendar, Layers, Github, Terminal, Newspaper, Search, X } from 'lucide-react';

interface HeroHeaderProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  repoCount: number;
  articleCount: number;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  repoCount,
  articleCount,
}) => {
  // Format current date nicely in French
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const filters: { id: FilterCategory; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'all', label: 'Tout', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'github', label: 'GitHub', icon: <Github className="h-3.5 w-3.5" />, count: repoCount },
    { id: 'prompts', label: 'Prompts', icon: <Terminal className="h-3.5 w-3.5" />, count: 1 },
    { id: 'news', label: 'News', icon: <Newspaper className="h-3.5 w-3.5" />, count: articleCount },
  ];

  return (
    <div className="relative pt-8 pb-12 overflow-hidden">
      {/* Luminous Halos in background (Orange néon blur-3xl) */}
      <div 
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-orange-500/15 blur-[130px]"
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute top-12 left-1/4 h-72 w-72 rounded-full bg-amber-600/10 blur-[110px]"
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute top-20 right-1/4 h-80 w-80 rounded-full bg-orange-600/10 blur-[140px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Date Tag & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <Calendar className="h-3.5 w-3.5 text-orange-400/80" />
            <span className="font-medium text-zinc-300">{capitalizedDate}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="font-mono text-zinc-400">Édition #342</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Synchronisé
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400">
            <span>Inférence locale</span>
            <span className="text-zinc-700">/</span>
            <span>Architectures LLM</span>
            <span className="text-zinc-700">/</span>
            <span>Ingénierie de Prompts</span>
          </div>
        </div>

        {/* Main Punchy Title */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 border border-orange-500/20">
              <Sparkles className="h-3 w-3" />
              Intelligence Quotidienne
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
                Finjaro <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">Pulse</span>
              </h1>
              <p className="mt-3 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
                Le radar d'ingénierie IA à haute fréquence. Dénichez les meilleurs repos open-source, maîtrisez les prompts de production et anticipez les ruptures algorithmiques.
              </p>
            </div>

            {/* Live Stats Snippet */}
            <div className="flex items-center gap-3 self-start lg:self-auto rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-2 px-3">
              <div className="flex flex-col px-3 py-1">
                <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">Repos Actifs</span>
                <span className="text-lg font-bold text-white tabular-nums">{repoCount}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col px-3 py-1">
                <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">Prompt Expert</span>
                <span className="text-lg font-bold text-orange-400">1</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col px-3 py-1">
                <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">Analyses</span>
                <span className="text-lg font-bold text-white tabular-nums">{articleCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search Row (Glassmorphic) */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-2 shadow-2xl">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-none">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange(filter.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-500 text-zinc-950 shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {filter.icon}
                  <span>{filter.label}</span>
                  {filter.count !== undefined && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                        isActive ? 'bg-zinc-950/20 text-zinc-950' : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      {filter.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filtrer repos, prompts, actus..."
              className="w-full rounded-xl bg-black/40 border border-white/5 py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                title="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
