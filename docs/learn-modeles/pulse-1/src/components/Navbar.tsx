import React, { useState } from 'react';
import { Sparkles, Bell, Radio } from 'lucide-react';

interface NavbarProps {
  onSubscribeClick: () => void;
  activeFilter: string;
  onFilterChange: (filter: 'all' | 'github' | 'prompts' | 'news') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSubscribeClick, activeFilter, onFilterChange }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark with subtle orange accent dot */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="group flex items-center gap-2 text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:border-orange-500/40 transition-colors">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">Finjaro</span>
            <span className="font-light tracking-wide text-orange-400">Pulse</span>
          </a>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <button
            onClick={() => onFilterChange('all')}
            className={`transition-colors hover:text-white ${activeFilter === 'all' ? 'text-white' : ''}`}
          >
            Flux Global
          </button>
          <button
            onClick={() => onFilterChange('github')}
            className={`transition-colors hover:text-white ${activeFilter === 'github' ? 'text-orange-400' : ''}`}
          >
            Top Repos
          </button>
          <button
            onClick={() => onFilterChange('prompts')}
            className={`transition-colors hover:text-white ${activeFilter === 'prompts' ? 'text-orange-400' : ''}`}
          >
            Prompt du Jour
          </button>
          <button
            onClick={() => onFilterChange('news')}
            className={`transition-colors hover:text-white ${activeFilter === 'news' ? 'text-orange-400' : ''}`}
          >
            L'Actu IA
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/60 border border-white/5 text-xs text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="font-mono text-[11px] tracking-wide text-zinc-300">LIVE FEED</span>
          </div>

          <button
            onClick={onSubscribeClick}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-orange-400 active:scale-[0.98] shadow-[0_0_20px_rgba(249,115,22,0.35)]"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">S'abonner</span>
          </button>
        </div>
      </div>
    </header>
  );
};
