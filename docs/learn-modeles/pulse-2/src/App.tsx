import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { TopReposSection } from './components/TopReposSection';
import { PromptOfTheDaySection } from './components/PromptOfTheDaySection';
import { NewsSection } from './components/NewsSection';
import { ArticleModal } from './components/ArticleModal';
import { PlaygroundModal } from './components/PlaygroundModal';
import { SubscribeModal } from './components/SubscribeModal';
import { RepoDetailModal } from './components/RepoDetailModal';
import { Toast } from './components/Toast';
import { GITHUB_REPOS, AI_PROMPTS, NEWS_ARTICLES } from './data/pulseData';
import { FilterType, GitHubRepo, AIPrompt, NewsArticle } from './types';
import { 
  Sparkles, 
  Terminal, 
  Rss, 
  Check, 
  SearchX, 
  ArrowUp, 
  Heart, 
  Cpu, 
  Zap, 
  Layers 
} from 'lucide-react';

export default function App() {
  // State
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Bookmarks & Starred stores
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set(['vllm', 'photonic-ai-chips']));
  const [starredRepoIds, setStarredRepoIds] = useState<Set<string>>(() => new Set(['deepseek-v3']));

  // Modals state
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [playgroundPrompt, setPlaygroundPrompt] = useState<{ prompt: AIPrompt; text: string } | null>(null);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; subMessage?: string }>({
    isVisible: false,
    message: '',
    subMessage: ''
  });

  const showToast = (message: string, subMessage?: string) => {
    setToast({ isVisible: true, message, subMessage });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 2800);
  };

  // Bookmark toggle
  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Retiré de vos favoris');
      } else {
        next.add(id);
        showToast('Ajouté à vos favoris', 'Retrouvez-le dans l\'onglet Favoris');
      }
      return next;
    });
  };

  // Star toggle
  const handleToggleStar = (repoId: string) => {
    setStarredRepoIds((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
        showToast('Étoile retirée');
      } else {
        next.add(repoId);
        showToast('Étoile attribuée au dépôt !', '+1 star enregistrée');
      }
      return next;
    });
  };

  // Copy clone command
  const handleCopyClone = (repo: GitHubRepo) => {
    const cmd = `git clone ${repo.url}.git`;
    navigator.clipboard?.writeText(cmd);
    showToast('Commande Git copiée', cmd);
  };

  // Copy prompt
  const handleCopyPrompt = (text: string) => {
    navigator.clipboard?.writeText(text);
    showToast('Prompt copié dans le presse-papier !', 'Prêt à coller dans votre LLM');
  };

  // Share article
  const handleShareArticle = (article: NewsArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.headline,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${article.title} - ${window.location.href}`);
      showToast('Lien de l\'article copié', 'Partagez-le avec votre équipe');
    }
  };

  // Filtered lists
  const filteredRepos = useMemo(() => {
    return GITHUB_REPOS.filter((repo) => {
      if (showSavedOnly && !bookmarkedIds.has(repo.id)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        repo.name.toLowerCase().includes(q) ||
        repo.owner.toLowerCase().includes(q) ||
        repo.description.toLowerCase().includes(q) ||
        repo.languages.some((l) => l.name.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, showSavedOnly, bookmarkedIds]);

  const filteredPrompts = useMemo(() => {
    return AI_PROMPTS.filter((prompt) => {
      if (showSavedOnly && !bookmarkedIds.has(prompt.id)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(q) ||
        prompt.shortDesc.toLowerCase().includes(q) ||
        prompt.category.toLowerCase().includes(q) ||
        prompt.template.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, showSavedOnly, bookmarkedIds]);

  const filteredArticles = useMemo(() => {
    return NEWS_ARTICLES.filter((article) => {
      if (showSavedOnly && !bookmarkedIds.has(article.id)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(q) ||
        article.headline.toLowerCase().includes(q) ||
        article.tags.some((t) => t.toLowerCase().includes(q)) ||
        article.author.name.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, showSavedOnly, bookmarkedIds]);

  const totalFilteredCount = filteredRepos.length + filteredPrompts.length + filteredArticles.length;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Dynamic Background Light Halos with blur-3xl */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-[450px] h-[450px] bg-emerald-600/08 rounded-full blur-[130px] pointer-events-none -z-10" />
      
      {/* Subtle background tech grid */}
      <div className="fixed inset-0 grid-pattern opacity-60 pointer-events-none -z-10" />

      {/* Main Header with Sticky Top Bar, Audio player, and Glass Filters */}
      <Header
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSubscribe={() => setIsSubscribeOpen(true)}
        savedCount={bookmarkedIds.size}
        showSavedOnly={showSavedOnly}
        onToggleSavedOnly={() => setShowSavedOnly(!showSavedOnly)}
        itemCounts={{
          github: filteredRepos.length,
          prompts: filteredPrompts.length,
          news: filteredArticles.length
        }}
      />

      {/* Active Search & Filter Banner (if filtering) */}
      {(searchQuery || showSavedOnly) && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 px-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 backdrop-blur-md flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                Filtre actif : {showSavedOnly ? 'Vos favoris' : ''}{' '}
                {searchQuery ? `« ${searchQuery} »` : ''} ·{' '}
                <strong className="text-white">{totalFilteredCount} résultats</strong>
              </span>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setShowSavedOnly(false);
              }}
              className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[11px]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {/* Main Content Feed Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-0 sm:px-2 lg:px-4 py-4 space-y-4">
        
        {/* Empty state when query yields zero results */}
        {totalFilteredCount === 0 && (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">
              Aucun résultat correspondant
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nous n&apos;avons trouvé aucun élément pour votre recherche. Essayez avec un mot-clé plus générique comme « Claude », « Python » ou « Agents ».
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSavedOnly(false);
                setCurrentFilter('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] transition-all"
            >
              Effacer la recherche
            </button>
          </div>
        )}

        {/* SECTION 1 : TOP REPOS GITHUB DU JOUR (Horizontal Scroll) */}
        {(currentFilter === 'all' || currentFilter === 'github') && filteredRepos.length > 0 && (
          <TopReposSection
            repos={filteredRepos}
            onSelectRepo={(repo) => setSelectedRepo(repo)}
            onToggleStar={handleToggleStar}
            onToggleBookmark={handleToggleBookmark}
            onCopyClone={handleCopyClone}
            bookmarkedIds={bookmarkedIds}
            starredIds={starredRepoIds}
          />
        )}

        {/* SECTION 2 : LE PROMPT DU JOUR (Massive Highlighted Hero) */}
        {(currentFilter === 'all' || currentFilter === 'prompts') && filteredPrompts.length > 0 && (
          <PromptOfTheDaySection
            prompts={filteredPrompts}
            onCopyPrompt={handleCopyPrompt}
            onOpenPlayground={(prompt, text) => setPlaygroundPrompt({ prompt, text })}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
          />
        )}

        {/* SECTION 3 : L'ACTU IA (Vertical / Bento Grid) */}
        {(currentFilter === 'all' || currentFilter === 'news') && filteredArticles.length > 0 && (
          <NewsSection
            articles={filteredArticles}
            onSelectArticle={(article) => setSelectedArticle(article)}
            onToggleBookmark={handleToggleBookmark}
            onShareArticle={handleShareArticle}
            bookmarkedIds={bookmarkedIds}
          />
        )}

      </main>

      {/* Editorial Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-[#06080D]/90 backdrop-blur-2xl mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
            
            {/* Brand in footer */}
            <div className="space-y-1.5 max-w-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-mono text-[10px] font-bold text-white">
                  FP
                </div>
                <span className="text-base font-bold text-white font-display">
                  Finjaro<span className="text-cyan-400 font-light">Pulse</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le condensé quotidien d&apos;ingénierie et de recherche en intelligence artificielle pour les bâtisseurs de produits.
              </p>
            </div>

            {/* Newsletter CTA shortcut */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsSubscribeOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.1] transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recevoir par email chaque matin</span>
              </button>

              <button
                onClick={scrollToTop}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white transition-all flex items-center justify-center self-end sm:self-auto"
                aria-label="Remonter en haut de page"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Bottom Copyright & Editorial Specs */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-4">
              <span>© 2026 Finjaro Pulse</span>
              <span>·</span>
              <span>Propulsé par la communauté IA</span>
              <span>·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tous systèmes nominaux</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hover:text-slate-400 cursor-pointer transition-colors" onClick={() => showToast('Flux RSS synchronisé')}>
                Flux RSS 2.0
              </span>
              <span>·</span>
              <span className="hover:text-slate-400 cursor-pointer transition-colors" onClick={() => showToast('Export JSON prêt')}>
                API JSON
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onToggleBookmark={handleToggleBookmark}
        isBookmarked={selectedArticle ? bookmarkedIds.has(selectedArticle.id) : false}
        onShare={handleShareArticle}
      />

      <RepoDetailModal
        repo={selectedRepo}
        onClose={() => setSelectedRepo(null)}
        onToggleStar={handleToggleStar}
        onToggleBookmark={handleToggleBookmark}
        isStarred={selectedRepo ? starredRepoIds.has(selectedRepo.id) : false}
        isBookmarked={selectedRepo ? bookmarkedIds.has(selectedRepo.id) : false}
        onCopyClone={handleCopyClone}
      />

      <PlaygroundModal
        prompt={playgroundPrompt?.prompt || null}
        filledPromptText={playgroundPrompt?.text || ''}
        isOpen={!!playgroundPrompt}
        onClose={() => setPlaygroundPrompt(null)}
        onCopy={handleCopyPrompt}
      />

      <SubscribeModal
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        onSuccess={(email) => {
          showToast('Inscription confirmée !', `Brief envoyé à ${email}`);
        }}
      />

      {/* Global Interactive Feedback Toast */}
      <Toast
        message={toast.message}
        subMessage={toast.subMessage}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

    </div>
  );
}
