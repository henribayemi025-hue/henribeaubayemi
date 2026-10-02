import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Share2, 
  Bookmark, 
  Check, 
  Sparkles, 
  Volume2, 
  ArrowLeft,
  Terminal,
  ExternalLink 
} from 'lucide-react';
import { NewsArticle } from '../types';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  onToggleBookmark: (articleId: string) => void;
  isBookmarked: boolean;
  onShare: (article: NewsArticle) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
  isBookmarked,
  onShare
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl my-8 bg-[#0B0F19] border border-white/[0.12] rounded-3xl shadow-2xl shadow-cyan-950/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glowing line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold">{article.badgeLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{article.publishedAt}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(article.id)}
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
              onClick={() => onShare(article)}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
              title="Partager"
              aria-label="Partager"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors ml-1"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
            {article.tags.map((tag) => (
              <span key={tag} className="text-cyan-400 font-medium">{tag}</span>
            ))}
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTime}</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
            {article.title}
          </h2>

          {/* Author Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-[1px]">
                <div className="w-full h-full bg-[#0D121F] rounded-[11px] flex items-center justify-center font-mono font-bold text-xs text-white">
                  {article.author.avatarInitials}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{article.author.name}</p>
                <p className="text-xs text-slate-400 font-mono">{article.author.role}</p>
              </div>
            </div>

            {/* Read aloud simulation button */}
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                isPlayingAudio
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 animate-pulse'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? 'Audio en lecture...' : 'Écouter l\'article'}</span>
            </button>
          </div>

          {/* Key Takeaways Box */}
          <div className="p-5 rounded-2xl bg-[#0F1424] border border-cyan-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Synthèse Exécutive & Points Clés</span>
            </div>
            <ul className="space-y-2">
              {article.keyTakeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Paragraphs */}
          <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            {article.fullContent.map((paragraph, index) => (
              <p key={index} className="text-slate-300">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Technical Implementation Insight Note */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Code source & benchmarks complets archivés sur le repo de recherche.</span>
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au flux</span>
          </button>

          <button
            onClick={() => onShare(article)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partager cette analyse</span>
          </button>
        </div>

      </div>
    </div>
  );
};
