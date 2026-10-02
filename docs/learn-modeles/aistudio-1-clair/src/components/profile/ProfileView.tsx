import React from 'react';
import {
  User,
  Award,
  Flame,
  CheckCircle2,
  Code2,
  Clock,
  Sparkles,
  ShieldCheck,
  LogOut,
  LogIn,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProfileView: React.FC = () => {
  const {
    t,
    theme,
    language,
    user,
    logoutUser,
    loginAsDemoUser,
    setActiveView,
    triggerConfetti,
  } = useApp();

  return (
    <div className="space-y-6 pb-20">
      {/* Profile Header Card */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 ${
          theme === 'noir'
            ? 'border-slate-800 bg-gradient-to-br from-slate-900 via-[#0E131F] to-[#141C2E]'
            : 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 text-4xl shadow-xl text-white">
              {user.avatar}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {user.name}
                </h1>
                <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                  Niveau {Math.floor(user.xp / 100) + 1}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {user.email || t.topbar.guest}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 text-xs">
                <span className="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400">
                  <Flame className="h-4 w-4 fill-current" />
                  <span>{user.streak} {t.topbar.streak}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Award className="h-4 w-4" />
                  <span>{user.xp} XP</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.isLoggedIn ? (
              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
              >
                <LogOut className="h-4 w-4" />
                <span>{language === 'fr' ? 'Se déconnecter' : 'Log out'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  loginAsDemoUser();
                  triggerConfetti();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
              >
                <LogIn className="h-4 w-4" />
                <span>{t.topbar.login}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verified Metrics Breakdown */}
      <div
        className={`rounded-2xl border p-6 ${
          theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Bilan Personnel Vérifié
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          Tous les chiffres affichés proviennent des tests unitaires réels que votre code a passés dans le navigateur.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] text-slate-500 font-semibold block">{t.stats.lessonsCompleted}</span>
            <strong className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
              {user.completedLessons.length}
            </strong>
          </div>
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] text-slate-500 font-semibold block">{t.stats.codeRuns}</span>
            <strong className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {user.codeRunsCount}
            </strong>
          </div>
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] text-slate-500 font-semibold block">Tests Unitaires Validés</span>
            <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {user.testPassCount}
            </strong>
          </div>
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] text-slate-500 font-semibold block">{t.stats.studyTime}</span>
            <strong className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
              {user.studyMinutes} min
            </strong>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setActiveView('tree')}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            <span>Voir l'arbre de compétences complet</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
