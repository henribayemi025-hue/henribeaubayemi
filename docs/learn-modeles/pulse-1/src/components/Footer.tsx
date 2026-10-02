import React from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/5 bg-zinc-950 py-12 text-xs text-zinc-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="font-semibold text-white tracking-tight">Finjaro Pulse</span>
            <span className="text-zinc-600">·</span>
            <span>Flux & Radar d'Intelligence Artificielle</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-300 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Flux RSS</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Confidentialité</a>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>Haut de page</span>
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600">
          <p>© {new Date().getFullYear()} Finjaro Labs Inc. Tous droits réservés.</p>
          <p>Conçu pour les ingénieurs et chercheurs en intelligence artificielle.</p>
        </div>
      </div>
    </footer>
  );
};
