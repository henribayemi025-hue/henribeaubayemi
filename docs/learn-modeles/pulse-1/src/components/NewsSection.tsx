import React from 'react';
import { NewsArticle } from '../types/pulse';
import { Newspaper, Clock, ArrowRight, BookOpen, Share2, Check } from 'lucide-react';
import { NewsVisualArt } from './NewsVisualArt';

interface NewsSectionProps {
  articles: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ articles, onSelectArticle }) => {
  const [sharedId, setSharedId] = React.useState<string | null>(null);

  const handleShare = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}#article-${article.id}`);
    setSharedId(article.id);
    setTimeout(() => setSharedId(null), 2000);
  };

  return (
    <section className="relative my-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <Newspaper className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  L'Actu IA
                </h2>
                <span className="hidden sm:inline-flex rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-[11px] font-mono text-orange-400">
                  BRIEFING QUOTIDIEN
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Analyses de fond, ruptures matérielles et paradigmes algorithmiques
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-mono">
            {articles.length} articles sélectionnés
          </div>
        </div>

        {/* Vertical Grid of Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const isShared = sharedId === article.id;

            return (
              <article
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className="group relative flex flex-col cursor-pointer rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:bg-zinc-900/70 hover:shadow-[0_0_35px_-8px_rgba(249,115,22,0.25)]"
              >
                {/* Visual Miniature Container (with hover zoom effect) */}
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/5 bg-zinc-950">
                  <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105">
                    <NewsVisualArt theme={article.visualTheme} />
                  </div>

                  {/* Gradient contrast scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

                  {/* Top Bar on Miniature */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
                      {article.publishedAt}
                    </span>

                    <button
                      onClick={(e) => handleShare(e, article)}
                      className="pointer-events-auto h-7 w-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition-colors"
                      title="Copier le lien direct de l'article"
                    >
                      {isShared ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Article Content */}
                <div className="flex flex-1 flex-col p-5">
                  {/* Tags & Read Time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-mono text-orange-400/90 hover:text-orange-300 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug group-hover:text-orange-300 transition-colors line-clamp-2 mb-2.5">
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4 flex-1">
                    {article.summary}
                  </p>

                  {/* Key points preview bullet */}
                  <div className="mb-4 rounded-xl bg-black/30 border border-white/5 p-2.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-orange-400/90 block mb-1">
                      Point clé :
                    </span>
                    <p className="text-[11px] text-zinc-300 line-clamp-1 italic">
                      "{article.keyPoints[0]}"
                    </p>
                  </div>

                  {/* Bottom Footer: Author & Read CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <span className="text-[11px] text-zinc-400 truncate max-w-[160px]">
                      {article.author.split('·')[0]}
                    </span>

                    <span className="flex items-center gap-1 font-semibold text-orange-400 group-hover:translate-x-0.5 transition-transform text-xs">
                      <span>Lire l'analyse</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
