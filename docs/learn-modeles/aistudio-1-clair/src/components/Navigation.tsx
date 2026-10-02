import React from 'react';
import {
  BookOpen,
  Bot,
  Layers,
  Network,
  Users,
  Wrench,
  UserCheck,
} from 'lucide-react';
import { useApp, ActiveView } from '../context/AppContext';

export const Navigation: React.FC = () => {
  const { activeView, setActiveView, t, theme } = useApp();

  const navItems: { id: ActiveView; label: string; icon: any; badge?: string }[] = [
    { id: 'courses', label: t.nav.courses, icon: BookOpen },
    { id: 'tutors', label: t.nav.tutors, icon: Bot },
    { id: 'projects', label: t.nav.projects, icon: Layers },
    { id: 'tree', label: t.nav.tree, icon: Network },
    { id: 'community', label: t.nav.community, icon: Users },
    { id: 'tools', label: t.nav.tools, icon: Wrench },
    { id: 'profile', label: t.nav.profile, icon: UserCheck },
  ];

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <nav className={`hidden md:block w-full border-b transition-colors ${
        theme === 'noir'
          ? 'border-slate-800/80 bg-[#0E131F]'
          : 'border-slate-100 bg-slate-50/70'
      }`}>
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 border-b-2 px-3.5 py-3 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Thumb friendly, accessible) */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t backdrop-blur-xl transition-colors ${
          theme === 'noir'
            ? 'border-slate-800/90 bg-[#0B0F17]/95'
            : 'border-slate-200/90 bg-white/95 shadow-lg'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16 items-center justify-around px-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-1 flex-col items-center justify-center py-1 transition-transform ${
                  isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? 'bg-orange-500/15 text-orange-600 dark:bg-orange-500/25 dark:text-orange-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`mt-0.5 text-[10px] font-semibold truncate max-w-[64px] ${
                    isActive
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Quick drawer for Tools & Profile on small mobile */}
          <button
            onClick={() => setActiveView('tools')}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-transform ${
              activeView === 'tools' || activeView === 'profile'
                ? 'scale-105'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                activeView === 'tools'
                  ? 'bg-orange-500/15 text-orange-600 dark:bg-orange-500/25 dark:text-orange-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Wrench className="h-4 w-4" />
            </div>
            <span
              className={`mt-0.5 text-[10px] font-semibold truncate max-w-[64px] ${
                activeView === 'tools'
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t.nav.tools}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
