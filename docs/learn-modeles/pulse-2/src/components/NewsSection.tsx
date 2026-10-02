import React from 'react';
import { 
  Newspaper, 
  Clock, 
  ArrowUpRight, 
  Bookmark, 
  Share2, 
  Sparkles, 
  Cpu, 
  Bot, 
  Layers 
} from 'lucide-react';
import { NewsArticle } from '../types';

interface NewsSectionProps {
  articles: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
  onToggleBookmark: (articleId: string) => void;
  onShareArticle: (article: NewsArticle) => void;
  bookmarkedIds: Set<string>;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  articles,
  onSelectArticle,
  onToggleBookmark,
  onShareArticle,
  bookmarkedIds
}) => {
  // Render bespoke high-tech procedural artwork cards with glowing circuits and gradient mesh
  const renderVisualArtwork = (article: NewsArticle) => {
    switch (article.accentColor) {
      case 'cyan':
        return (
          <div className="relative w-full h-full bg-[#080D1A] overflow-hidden flex items-center justify-center">
            {/* Photonic Chip & Quantum Circuit Simulation */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 via-slate-950 to-blue-950/80" />
            
            {/* Glowing radial core */}
            <div className="absolute w-44 h-44 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
            
            {/* Silicon wafer geometric grid */}
            <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 240" fill="none">
              <defs>
                <pattern id="grid-cyan" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="grad-circuit" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-cyan)" />
              {/* Photonic waveguide traces */}
              <path d="M 40 120 L 140 120 L 180 80 L 260 80 L 300 120 L 360 120" stroke="url(#grad-circuit)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 100 180 L 160 180 L 200 140 L 240 140 L 280 180 L 320 180" stroke="url(#grad-circuit)" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="180" cy="80" r="4" fill="#22D3EE" className="animate-ping" style={{ animationDuration: '3s' }} />
              <circle cx="200" cy="140" r="3.5" fill="#38BDF8" />
              <circle cx="260" cy="80" r="4" fill="#67E8F9" />
              {/* Die outline */}
              <rect x="130" y="50" width="140" height="120" rx="8" stroke="#06B6D4" strokeWidth="1" strokeOpacity="0.4" fill="rgba(6, 182, 212, 0.05)" />
            </svg>

            {/* Central Holographic Emblem */}
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 backdrop-blur-md flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-500">
              <Cpu className="w-8 h-8 text-cyan-300 stroke-[1.5]" />
            </div>

            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>PHOTONIC INTERCONNECT · 120 GB/s</span>
            </div>
          </div>
        );

      case 'violet':
        return (
          <div className="relative w-full h-full bg-[#0E0B1A] overflow-hidden flex items-center justify-center">
            {/* Autonomous Multi-Agent Swarm Simulation */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-slate-950 to-purple-950/80" />
            
            {/* Glowing radial core */}
            <div className="absolute w-44 h-44 rounded-full bg-violet-600/20 blur-2xl animate-pulse" />
            
            {/* Swarm network graph SVG */}
            <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 240" fill="none">
              <defs>
                <linearGradient id="grad-violet" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Agent nodes & connections */}
              <line x1="100" y1="80" x2="200" y2="120" stroke="url(#grad-violet)" strokeWidth="1.5" />
              <line x1="300" y1="80" x2="200" y2="120" stroke="url(#grad-violet)" strokeWidth="1.5" />
              <line x1="200" y1="120" x2="160" y2="180" stroke="url(#grad-violet)" strokeWidth="1.5" />
              <line x1="200" y1="120" x2="240" y2="180" stroke="url(#grad-violet)" strokeWidth="1.5" />
              <line x1="100" y1="80" x2="160" y2="180" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <line x1="300" y1="80" x2="240" y2="180" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              {/* Nodes */}
              <circle cx="100" cy="80" r="5" fill="#C084FC" />
              <circle cx="300" cy="80" r="5" fill="#C084FC" />
              <circle cx="160" cy="180" r="4" fill="#A855F7" />
              <circle cx="240" cy="180" r="4" fill="#A855F7" />
              <circle cx="200" cy="120" r="7" fill="#E879F9" className="animate-pulse" />
            </svg>

            {/* Central Holographic Emblem */}
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-400/40 backdrop-blur-md flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-500">
              <Bot className="w-8 h-8 text-violet-300 stroke-[1.5]" />
            </div>

            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-violet-300">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span>BROWSER-GROUNDING · DOM COORDS</span>
            </div>
          </div>
        );

      case 'emerald':
        return (
          <div className="relative w-full h-full bg-[#081512] overflow-hidden flex items-center justify-center">
            {/* Native Multimodal Vision-Audio Latent Space */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-slate-950 to-teal-950/80" />
            
            {/* Glowing radial core */}
            <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
            
            {/* Waveform & Spectrogram prism SVG */}
            <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 240" fill="none">
              <defs>
                <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Continuous unified audio-vision spline */}
              <path d="M 20 120 C 60 70, 100 170, 140 120 C 180 70, 220 170, 260 120 C 300 70, 340 170, 380 120" stroke="url(#grad-emerald)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 20 120 C 60 90, 100 150, 140 120 C 180 90, 220 150, 260 120 C 300 90, 340 150, 380 120" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <circle cx="200" cy="120" r="5" fill="#6EE7B7" className="animate-ping" style={{ animationDuration: '4s' }} />
            </svg>

            {/* Central Holographic Emblem */}
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 backdrop-blur-md flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <Layers className="w-8 h-8 text-emerald-300 stroke-[1.5]" />
            </div>

            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>NATIVE MULTIMODAL · &lt;190ms</span>
            </div>
          </div>
        );
    }
  };

  const getHoverBorderClass = (color: NewsArticle['accentColor']) => {
    switch (color) {
      case 'cyan':
        return 'group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/10';
      case 'violet':
        return 'group-hover:border-violet-500/50 group-hover:shadow-violet-500/10';
      case 'emerald':
        return 'group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10';
    }
  };

  return (
    <section className="relative w-full py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  L&apos;Actu IA Décryptée
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  Analyses Approfondies
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Synthèses techniques des dernières annonces et tournants architecturaux.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>{articles.length} synthèses disponibles</span>
          </div>
        </div>

        {/* Vertical Articles Grid (Bento style) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const isBookmarked = bookmarkedIds.has(article.id);

            return (
              <article
                key={article.id}
                className={`group relative bg-[#0D111C]/70 hover:bg-[#101626]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/20 ${getHoverBorderClass(article.accentColor)} hover:-translate-y-1.5`}
              >
                {/* Visual Thumbnail Frame */}
                <div className="relative w-full h-52 overflow-hidden border-b border-white/[0.06] bg-slate-950">
                  <div className="w-full h-full transform transition-transform duration-500 ease-out group-hover:scale-105">
                    {renderVisualArtwork(article)}
                  </div>

                  {/* Top Overlay Badge & Bookmark */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-slate-200 bg-black/60 backdrop-blur-md border border-white/10">
                      {article.badgeLabel}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(article.id);
                      }}
                      className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-amber-300 transition-colors"
                      title={isBookmarked ? 'Retirer des favoris' : 'Sauvegarder l\'article'}
                      aria-label="Sauvegarder l'article"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Article Content Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Tags & Read Time (Clean unboxed text metadata with typographic separators per constitution) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mb-3">
                      <span className="text-cyan-400 font-semibold">{article.tags[0]}</span>
                      {article.tags.slice(1).map((tag, i) => (
                        <React.Fragment key={i}>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span>{tag}</span>
                        </React.Fragment>
                      ))}
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{article.readTime}</span>
                      </span>
                    </div>

                    {/* Article Title */}
                    <h3 
                      onClick={() => onSelectArticle(article)}
                      className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight leading-snug cursor-pointer font-display mb-2.5"
                    >
                      {article.title}
                    </h3>

                    {/* Headline */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4">
                      {article.headline}
                    </p>

                    {/* Key takeaway bullet preview */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-300 space-y-1 mb-5 font-mono">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                        Point Clé :
                      </div>
                      <p className="line-clamp-2 text-slate-300">
                        {article.keyTakeaways[0]}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Author & Read More Trigger */}
                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-violet-600 p-[1px]">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-mono font-bold text-slate-200">
                          {article.author.avatarInitials}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-200">{article.author.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{article.publishedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareArticle(article);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
                        title="Partager cet article"
                        aria-label="Partager"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectArticle(article)}
                        className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 hover:underline transition-colors pl-1"
                      >
                        <span>Lire</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
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
