import React, { useState } from 'react';
import { 
  X, 
  Star, 
  GitFork, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal, 
  Bookmark, 
  Code2, 
  Layers 
} from 'lucide-react';
import { GitHubRepo } from '../types';

interface RepoDetailModalProps {
  repo: GitHubRepo | null;
  onClose: () => void;
  onToggleStar: (repoId: string) => void;
  onToggleBookmark: (repoId: string) => void;
  isStarred: boolean;
  isBookmarked: boolean;
  onCopyClone: (repo: GitHubRepo) => void;
}

export const RepoDetailModal: React.FC<RepoDetailModalProps> = ({
  repo,
  onClose,
  onToggleStar,
  onToggleBookmark,
  isStarred,
  isBookmarked,
  onCopyClone
}) => {
  const [copiedClone, setCopiedClone] = useState(false);

  if (!repo) return null;

  const cloneCommand = `git clone ${repo.url}.git`;

  const handleCopy = () => {
    onCopyClone(repo);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0C101B] border border-white/[0.12] rounded-3xl shadow-2xl shadow-emerald-950/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono">{repo.owner}</p>
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <span>{repo.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {repo.category}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(repo.id)}
              className={`p-2 rounded-xl border transition-all ${
                isBookmarked 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
              title={isBookmarked ? 'Retirer des favoris' : 'Sauvegarder'}
              aria-label="Sauvegarder"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
              {repo.description}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center font-mono">
            <div>
              <p className="text-[10px] uppercase text-slate-400">Total Étoiles</p>
              <p className="text-base font-bold text-white flex items-center justify-center gap-1 mt-0.5 tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {(repo.stars + (isStarred ? 1 : 0)).toLocaleString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Croissance 24h</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5 tabular-nums">
                +{repo.todayStars}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Forks</p>
              <p className="text-base font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5 tabular-nums">
                <GitFork className="w-3.5 h-3.5 text-slate-400" />
                {repo.forks.toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Languages Stack */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Stack Technologique :</p>
            <div className="flex flex-wrap gap-2">
              {repo.languages.map((l) => (
                <span 
                  key={l.name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-slate-200"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span>{l.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Git Clone command terminal box */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Installation & Clonage :</p>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/60 border border-white/[0.1] font-mono text-xs text-slate-300">
              <span className="text-cyan-300 select-all">{cloneCommand}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white transition-all ml-2"
              >
                {copiedClone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between">
          <button
            onClick={() => onToggleStar(repo.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isStarred
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isStarred ? 'Étoile attribuée' : 'Attribuer une étoile'}</span>
          </button>

          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all"
          >
            <span>Ouvrir sur GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
