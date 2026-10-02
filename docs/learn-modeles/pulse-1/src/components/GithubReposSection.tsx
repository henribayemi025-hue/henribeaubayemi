import React, { useRef, useState } from 'react';
import { GitHubRepo } from '../types/pulse';
import { Github, Star, ChevronLeft, ChevronRight, GitFork, ArrowUpRight, Copy, Check, ExternalLink } from 'lucide-react';

interface GithubReposSectionProps {
  repos: GitHubRepo[];
  onSelectRepo: (repo: GitHubRepo) => void;
  onToggleStar: (repoId: string) => void;
}

export const GithubReposSection: React.FC<GithubReposSectionProps> = ({
  repos,
  onSelectRepo,
  onToggleStar,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCopyClone = (e: React.MouseEvent, repo: GitHubRepo) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`git clone ${repo.url}.git`);
    setCopiedId(repo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format star counts nicely, e.g. 84210 -> 84.2k
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <section className="relative my-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <Github className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Top Repos GitHub du Jour
                </h2>
                <span className="hidden sm:inline-flex rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-[11px] font-mono text-orange-400">
                  TRENDING 24H
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Projets open-source à plus forte vélocité dans l'écosystème IA
              </p>
            </div>
          </div>

          {/* Scroll Nav Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white hover:border-orange-500/30 hover:bg-zinc-800 transition-all active:scale-95"
              aria-label="Défiler vers la gauche"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white hover:border-orange-500/30 hover:bg-zinc-800 transition-all active:scale-95"
              aria-label="Défiler vers la droite"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Feed */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {repos.map((repo) => {
            const isCopied = copiedId === repo.id;
            return (
              <div
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                className="group relative flex-none w-[320px] sm:w-[350px] cursor-pointer rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:bg-zinc-900/70 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.2)]"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Ranking Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className="font-mono text-xs text-zinc-400 group-hover:text-orange-400 transition-colors">
                    #{repo.rank}
                  </span>
                </div>

                {/* Top: Icon + Name */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white group-hover:border-orange-500/40 group-hover:text-orange-400 transition-colors">
                    <Github className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 pr-8">
                    <span className="text-[11px] font-mono text-zinc-400 truncate block">
                      {repo.owner}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:text-orange-300 transition-colors flex items-center gap-1">
                      {repo.name}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-orange-400" />
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 line-clamp-2 h-8 leading-relaxed mb-4">
                  {repo.description}
                </p>

                {/* Language Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {repo.languages.map((lang) => (
                    <span
                      key={lang.name}
                      className="inline-flex items-center gap-1.5 rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[11px] text-zinc-300"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: lang.color }}
                      />
                      <span>{lang.name}</span>
                    </span>
                  ))}
                  {repo.forks > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 ml-auto font-mono">
                      <GitFork className="h-3 w-3" />
                      {formatCount(repo.forks)}
                    </span>
                  )}
                </div>

                {/* Bottom Bar: Stars & Quick Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {/* Star toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(repo.id);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        repo.isStarred
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                          : 'bg-white/5 text-zinc-300 border border-white/5 hover:bg-white/10 hover:text-amber-300'
                      }`}
                      title={repo.isStarred ? 'Retirer l\'étoile' : 'Ajouter une étoile'}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          repo.isStarred
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-amber-400 fill-amber-400/20'
                        }`}
                      />
                      <span className="font-mono tabular-nums">{formatCount(repo.stars)}</span>
                    </button>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      +{repo.starsToday}
                    </span>
                  </div>

                  {/* Copy git clone */}
                  <button
                    onClick={(e) => handleCopyClone(e, repo)}
                    className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-orange-400 transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-orange-500/20"
                    title="Copier la commande git clone"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>git clone</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
