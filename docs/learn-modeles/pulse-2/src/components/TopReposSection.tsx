import React, { useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  GitFork, 
  ExternalLink, 
  Copy, 
  Bookmark, 
  Terminal,
  TrendingUp
} from 'lucide-react';
import { GitHubRepo } from '../types';

interface TopReposSectionProps {
  repos: GitHubRepo[];
  onSelectRepo: (repo: GitHubRepo) => void;
  onToggleStar: (repoId: string) => void;
  onToggleBookmark: (repoId: string) => void;
  onCopyClone: (repo: GitHubRepo) => void;
  bookmarkedIds: Set<string>;
  starredIds: Set<string>;
}

export const TopReposSection: React.FC<TopReposSectionProps> = ({
  repos,
  onSelectRepo,
  onToggleStar,
  onToggleBookmark,
  onCopyClone,
  bookmarkedIds,
  starredIds
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 360;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative w-full py-8">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  Top Repos GitHub du Jour
                </h2>
                <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Vélocité 24h
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Projets open-source à plus forte croissance dans la communauté IA.
              </p>
            </div>
          </div>

          {/* Scroll Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
              aria-label="Faire défiler vers la gauche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
              aria-label="Faire défiler vers la droite"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div 
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {repos.map((repo) => {
          const isStarred = starredIds.has(repo.id);
          const isBookmarked = bookmarkedIds.has(repo.id);

          return (
            <div
              key={repo.id}
              className="group relative shrink-0 w-[310px] sm:w-[350px] snap-start bg-[#0D111C]/70 hover:bg-[#111726]/90 backdrop-blur-xl border border-white/[0.07] hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-emerald-500/5 hover:-translate-y-1"
            >
              {/* Top ambient glow accent on hover */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

              <div>
                {/* Header: GitHub logo + Repo name + Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0 text-slate-200 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                      {/* GitHub custom SVG icon */}
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    </div>

                    <div className="truncate">
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {repo.owner}
                      </p>
                      <button
                        onClick={() => onSelectRepo(repo)}
                        className="text-sm font-bold text-white hover:text-emerald-400 transition-colors tracking-tight truncate block text-left"
                      >
                        {repo.name}
                      </button>
                    </div>
                  </div>

                  {/* Bookmark quick button */}
                  <button
                    onClick={() => onToggleBookmark(repo.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.04] transition-colors"
                    title={isBookmarked ? 'Retirer des favoris' : 'Sauvegarder'}
                    aria-label="Sauvegarder le dépôt"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-4 font-normal">
                  {repo.description}
                </p>

                {/* Languages Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-5">
                  {repo.languages.map((lang) => (
                    <span 
                      key={lang.name}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.06]"
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: lang.color }}
                      />
                      <span>{lang.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Card Footer: Stars + Forks + Quick clone */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
                {/* Interactive Star button */}
                <button
                  onClick={() => onToggleStar(repo.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    isStarred 
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 font-semibold' 
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
                  }`}
                  aria-label="Donner une étoile"
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span className="tabular-nums">
                    {(repo.stars + (isStarred ? 1 : 0)).toLocaleString('fr-FR')}
                  </span>
                </button>

                {/* Daily growth delta */}
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span>+{repo.todayStars}</span>
                  <span className="text-slate-500">auj.</span>
                </div>

                {/* Clone action button */}
                <button
                  onClick={() => onCopyClone(repo)}
                  className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-cyan-500/40 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition-all"
                  title="Copier la commande git clone"
                  aria-label="Copier la commande git clone"
                >
                  <Terminal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
