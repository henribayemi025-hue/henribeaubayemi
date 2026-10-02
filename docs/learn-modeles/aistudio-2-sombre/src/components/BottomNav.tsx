import React from 'react';
import { LayoutGrid, BookOpen, Sparkles, Terminal } from 'lucide-react';

export type TabType = 'hub' | 'etude' | 'outils';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'hub',
      label: 'Hub',
      icon: <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'etude',
      label: 'Étude',
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'outils',
      label: 'Outils IA',
      icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <nav
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xs sm:max-w-md z-40 pointer-events-auto"
      aria-label="Navigation principale"
    >
      {/* Detached ultra-glassmorphic pill container */}
      <div className="relative rounded-full bg-zinc-900/80 backdrop-blur-2xl border border-white/15 p-1.5 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_20px_rgba(249,115,22,0.12)]">
        
        {/* Subtle orange neon bottom glow */}
        <div className="absolute inset-x-8 -bottom-1 h-3 bg-orange-500/25 blur-lg rounded-full pointer-events-none" />

        <div className="relative grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 rounded-full text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_22px_rgba(249,115,22,0.55)] border border-orange-400/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] active:scale-95'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator ping if needed */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] sm:hidden" />
                )}

                <span className={isActive ? 'text-white' : 'text-zinc-400'}>
                  {tab.icon}
                </span>

                <span className="font-['Outfit'] select-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
