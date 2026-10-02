import React, { useState, useMemo } from 'react';
import { FilterCategory, GitHubRepo, NewsArticle } from './types/pulse';
import { REPOS_DATA, PROMPT_OF_THE_DAY, NEWS_ARTICLES } from './data/pulseData';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { GithubReposSection } from './components/GithubReposSection';
import { PromptOfTheDaySection } from './components/PromptOfTheDaySection';
import { NewsSection } from './components/NewsSection';
import { NewsletterSubscribe } from './components/NewsletterSubscribe';
import { ArticleModal } from './components/ArticleModal';
import { RepoModal } from './components/RepoModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>(REPOS_DATA);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toggle star for GitHub repos
  const handleToggleStar = (repoId: string) => {
    setRepos((prev) =>
      prev.map((repo) => {
        if (repo.id === repoId) {
          const nextStarred = !repo.isStarred;
          const delta = nextStarred ? 1 : -1;
          showToast(nextStarred ? `Étoile ajoutée à ${repo.name} !` : `Étoile retirée de ${repo.name}`);
          return {
            ...repo,
            isStarred: nextStarred,
            stars: repo.stars + delta,
            starsToday: repo.starsToday + delta,
          };
        }
        return repo;
      })
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Filtered Repos based on search
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos;
    const query = searchQuery.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.languages.some((l) => l.name.toLowerCase().includes(query)) ||
        r.owner.toLowerCase().includes(query)
    );
  }, [repos, searchQuery]);

  // Filtered Articles based on search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return NEWS_ARTICLES;
    const query = searchQuery.toLowerCase();
    return NEWS_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Prompt matching search
  const promptMatchesSearch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      PROMPT_OF_THE_DAY.title.toLowerCase().includes(query) ||
      PROMPT_OF_THE_DAY.fullPrompt.toLowerCase().includes(query) ||
      PROMPT_OF_THE_DAY.targetModel.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const scrollToSubscribe = () => {
    const el = document.getElementById('newsletter');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top Fixed/Sticky Navbar */}
      <Navbar
        onSubscribeClick={scrollToSubscribe}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Flow Content */}
      <main className="flex-1">
        {/* Header with Title, Date, Halos, and Glassmorphic Filters */}
        <HeroHeader
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          repoCount={filteredRepos.length}
          articleCount={filteredArticles.length}
        />

        {/* Empty Search Feedback if nothing found */}
        {searchQuery && filteredRepos.length === 0 && filteredArticles.length === 0 && !promptMatchesSearch && (
          <div className="mx-auto max-w-md my-16 p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/5">
            <p className="text-sm text-zinc-400">
              Aucun résultat pour "<span className="text-white">{searchQuery}</span>".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-orange-400 hover:text-orange-300 font-semibold"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}

        {/* SECTION 1: TOP REPOS GITHUB DU JOUR (Horizontal Scroll) */}
        {(activeFilter === 'all' || activeFilter === 'github') && filteredRepos.length > 0 && (
          <GithubReposSection
            repos={filteredRepos}
            onSelectRepo={setSelectedRepo}
            onToggleStar={handleToggleStar}
          />
        )}

        {/* SECTION 2: LE PROMPT DU JOUR (Mise en avant massive) */}
        {(activeFilter === 'all' || activeFilter === 'prompts') && promptMatchesSearch && (
          <PromptOfTheDaySection
            promptData={PROMPT_OF_THE_DAY}
            onCopySuccessToast={() => showToast('Prompt système copié dans le presse-papier !')}
          />
        )}

        {/* SECTION 3: L'ACTU IA (Grille verticale) */}
        {(activeFilter === 'all' || activeFilter === 'news') && filteredArticles.length > 0 && (
          <NewsSection
            articles={filteredArticles}
            onSelectArticle={setSelectedArticle}
          />
        )}

        {/* Conversion & Subscription Box */}
        <NewsletterSubscribe id="newsletter" />
      </main>

      {/* Quiet Footer */}
      <Footer />

      {/* Article Detail Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {/* GitHub Repo Inspector Modal */}
      <RepoModal
        repo={selectedRepo}
        onClose={() => setSelectedRepo(null)}
        onToggleStar={handleToggleStar}
      />

      {/* Feedback Toast */}
      <Toast
        message={toastMessage || ''}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
