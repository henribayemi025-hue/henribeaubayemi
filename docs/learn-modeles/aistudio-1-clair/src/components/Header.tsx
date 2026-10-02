import React, { useState } from 'react';
import {
  Flame,
  Award,
  Sun,
  Moon,
  Globe,
  Sliders,
  User,
  Bot,
  BotOff,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenAccessibility: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAccessibility }) => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    user,
    logoutUser,
    loginAsDemoUser,
    aiDisabled,
    toggleAiDisabled,
    t,
    setActiveView,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
      theme === 'noir'
        ? 'border-slate-800/80 bg-[#0B0F17]/90 text-white'
        : 'border-orange-100 bg-white/95 text-slate-900 shadow-xs'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <div
          onClick={() => setActiveView('courses')}
          className="flex cursor-pointer items-center gap-2.5 transition-transform hover:scale-[1.01]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-orange-600 dark:text-orange-400">
                Finjaro
              </span>
              <span className="rounded-md bg-orange-500/10 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                Learn
              </span>
            </div>
            <p className="hidden text-[11px] font-medium text-slate-500 sm:block dark:text-slate-400">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Center / Right Status & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Streak Indicator */}
          <button
            onClick={() => setActiveView('tree')}
            title={`${user.streak} ${t.topbar.streak}`}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
              theme === 'noir'
                ? 'bg-orange-950/40 text-orange-400 border border-orange-800/40'
                : 'bg-orange-50 text-orange-600 border border-orange-200/60'
            }`}
          >
            <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-pulse" />
            <span>{user.streak}</span>
            <span className="hidden md:inline">{t.topbar.streak}</span>
          </button>

          {/* XP Badge */}
          <div
            className={`hidden sm:flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              theme === 'noir'
                ? 'bg-slate-800/60 text-amber-400 border border-slate-700'
                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span>{user.xp} XP</span>
          </div>

          {/* AI Mode Toggle ("On peut aussi tout utiliser sans IA") */}
          <button
            onClick={toggleAiDisabled}
            title={aiDisabled ? t.topbar.aiOff : t.topbar.aiOn}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
              aiDisabled
                ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                : 'bg-orange-500/10 text-orange-600 border border-orange-500/30 dark:bg-orange-500/20 dark:text-orange-400'
            }`}
          >
            {aiDisabled ? (
              <>
                <BotOff className="h-4 w-4" />
                <span className="hidden lg:inline text-[11px] font-semibold">{t.topbar.aiOff}</span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 text-orange-500" />
                <span className="hidden lg:inline text-[11px] font-semibold">{t.topbar.aiOn}</span>
              </>
            )}
          </button>

          {/* Theme Switcher: Finjaro vs Noir */}
          <button
            onClick={() => setTheme(theme === 'finjaro' ? 'noir' : 'finjaro')}
            title={theme === 'finjaro' ? t.topbar.themeNoir : t.topbar.themeFinjaro}
            className={`rounded-lg p-2 transition-colors ${
              theme === 'noir'
                ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            {theme === 'noir' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Language Switcher: FR / EN */}
          <button
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            title={t.topbar.language}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold uppercase transition-colors ${
              theme === 'noir'
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <span>{language}</span>
          </button>

          {/* Accessibility Settings Modal Button */}
          <button
            onClick={onOpenAccessibility}
            title={t.nav.accessibility}
            className={`rounded-lg p-2 transition-colors ${
              theme === 'noir'
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
          </button>

          {/* Account Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full border border-slate-200 p-1 transition-all hover:border-orange-400 dark:border-slate-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-sm font-bold text-white shadow-xs">
                {user.avatar || '👤'}
              </span>
            </button>

            {showUserMenu && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-xl backdrop-blur-md transition-all ${
                  theme === 'noir'
                    ? 'border-slate-800 bg-slate-900/95 text-white'
                    : 'border-slate-200 bg-white/95 text-slate-800'
                }`}
              >
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email || t.topbar.guest}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveView('profile');
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-orange-500/10 hover:text-orange-600"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>{t.nav.profile}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('tree');
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-orange-500/10 hover:text-orange-600"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>{t.nav.tree}</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                  {user.isLoggedIn ? (
                    <button
                      onClick={() => {
                        logoutUser();
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{language === 'fr' ? 'Se déconnecter' : 'Sign out'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        loginAsDemoUser();
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>{t.topbar.login}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
