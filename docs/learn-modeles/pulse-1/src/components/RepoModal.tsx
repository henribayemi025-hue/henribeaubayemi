import React, { useState } from 'react';
import { GitHubRepo } from '../types/pulse';
import { X, Github, Star, GitFork, Copy, Check, ExternalLink, Terminal, ShieldCheck } from 'lucide-react';

interface RepoModalProps {
  repo: GitHubRepo | null;
  onClose: () => void;
  onToggleStar: (repoId: string) => void;
}

export const RepoModal: React.FC<RepoModalProps> = ({ repo, onClose, onToggleStar }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!repo) return null;

  const cloneCmd = `git clone ${repo.url}.git`;
  const pipCmd = `pip install ${repo.name.toLowerCase()}`;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 sm:p-8 border-b border-white/5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white">
              <Github className="h-6 w-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-zinc-500">{repo.owner}</span>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {repo.name}
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Rang #{repo.rank}
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {repo.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
              <span className="text-[11px] font-mono text-zinc-500 block">Étoiles totales</span>
              <span className="text-lg font-bold text-amber-400 font-mono flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {repo.stars.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
              <span className="text-[11px] font-mono text-zinc-500 block">Gain 24h</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                +{repo.starsToday.toLocaleString('fr-FR')}
              </span>
            </div>

            <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3">
              <span className="text-[11px] font-mono text-zinc-500 block">Forks</span>
              <span className="text-lg font-bold text-zinc-200 font-mono flex items-center gap-1">
                <GitFork className="h-4 w-4 text-zinc-400" />
                {repo.forks.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Tech Stacks */}
          <div>
            <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
              Langages & Technologies
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {repo.languages.map((l) => (
                <span
                  key={l.name}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span>{l.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* CLI Commands */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Installation & Démarrage Rapide
            </h4>

            {/* Git Clone */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
              <span className="text-zinc-300 truncate mr-3">{cloneCmd}</span>
              <button
                onClick={() => copyText(cloneCmd, 'clone')}
                className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 shrink-0 font-medium"
              >
                {copiedCmd === 'clone' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* Pip / Runtime command */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
              <span className="text-zinc-300 truncate mr-3">{pipCmd}</span>
              <button
                onClick={() => copyText(pipCmd, 'pip')}
                className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 shrink-0 font-medium"
              >
                {copiedCmd === 'pip' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 bg-zinc-900/40 border-t border-white/5">
          <button
            onClick={() => onToggleStar(repo.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              repo.isStarred
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${repo.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{repo.isStarred ? 'Étoile attribuée' : 'Ajouter une étoile'}</span>
          </button>

          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            <span>Ouvrir sur GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
