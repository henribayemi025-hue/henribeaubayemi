import React from 'react';
import { NewsArticle } from '../types/pulse';
import { X, Clock, Calendar, Bookmark, Share2, Check, ArrowUpRight } from 'lucide-react';
import { NewsVisualArt } from './NewsVisualArt';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  if (!article) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-3xl rounded-3xl bg-zinc-950 border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

        {/* Visual Header */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden border-b border-white/5">
          <NewsVisualArt theme={article.visualTheme} />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-orange-500/40 transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-400 font-mono">
              <span className="text-orange-400 font-semibold">{article.source}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readTime}
              </span>
              <span>·</span>
              <span>{article.publishedAt}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSaved(!saved)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  saved
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>{saved ? 'Enregistré' : 'Sauvegarder'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? 'Lien copié' : 'Partager'}</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {article.title}
          </h2>

          {/* Author */}
          <div className="flex items-center gap-3 py-2 border-y border-white/5">
            <div className="h-8 w-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-mono font-bold text-orange-400">
              {article.author.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{article.author}</p>
              <p className="text-[11px] text-zinc-500">Analyste Stratégie Finjaro Intelligence</p>
            </div>
          </div>

          {/* Key Takeaways Card */}
          <div className="rounded-2xl bg-zinc-900/60 border border-orange-500/20 p-5 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Ce qu'il faut retenir (Key Takeaways) :
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {article.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-400 font-mono font-bold">{i + 1}.</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Article Content */}
          <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line font-normal">
            {article.fullBody}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 pt-4 border-t border-white/5 flex-wrap">
            <span className="text-xs text-zinc-500 font-mono">Thématiques :</span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-orange-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 bg-zinc-900/40 border-t border-white/5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Fermer la vue
          </button>
        </div>
      </div>
    </div>
  );
};
