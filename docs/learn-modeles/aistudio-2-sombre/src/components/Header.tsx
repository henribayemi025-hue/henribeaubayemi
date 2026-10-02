import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  user: UserStats;
  onOpenStreak: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenStreak,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full px-4 sm:px-6 py-3.5 backdrop-blur-xl bg-zinc-950/75 border-b border-white/[0.07] transition-all duration-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* LOGO: Finjaro Learn */}
        <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/40 group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-black text-lg tracking-tighter select-none">F</span>
            {/* Ambient tiny spark */}
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300" />
          </div>
          
          <div className="flex items-baseline">
            <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
              Finjaro
            </span>
            <span className="text-xl font-extrabold tracking-tight text-orange-500 ml-1.5 drop-shadow-[0_0_12px_rgba(249,115,22,0.65)] font-['Outfit']">
              Learn
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: Streak & Profile */}
        <div className="flex items-center gap-3">
          
          {/* STREAK BADGE: Flame + "12 jours" with orange neon glow */}
          <button
            onClick={onOpenStreak}
            className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-950/30 hover:bg-orange-900/40 border border-orange-500/40 hover:border-orange-500/70 shadow-[0_0_18px_rgba(249,115,22,0.3)] hover:shadow-[0_0_26px_rgba(249,115,22,0.5)] transition-all duration-200 active:scale-95 cursor-pointer"
            title="Voir ta série d'apprentissage"
            aria-label="Série de 12 jours"
          >
            {/* Ambient orange pulse */}
            <span className="absolute inset-0 rounded-full bg-orange-500/10 blur-sm group-hover:bg-orange-500/20 transition-all pointer-events-none" />
            
            <div className="relative flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-500 animate-bounce group-hover:scale-110 transition-transform" />
            </div>

            <div className="relative flex items-baseline gap-1">
              <span className="text-sm font-bold text-orange-400 tracking-tight tabular-nums group-hover:text-orange-300">
                {user.streakDays}
              </span>
              <span className="text-xs font-semibold text-orange-500/90 tracking-tight">
                jours
              </span>
            </div>
          </button>

          {/* USER PROFILE AVATAR */}
          <button
            onClick={onOpenProfile}
            className="relative group p-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer active:scale-95 transition-transform"
            aria-label="Profil utilisateur"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20 group-hover:border-orange-500/60 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              {/* High-character dark cyber avatar */}
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center text-orange-400 font-bold text-xs tracking-wider">
                AR
              </div>
            </div>

            {/* Level indicator pill */}
            <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-orange-500/60 rounded-full px-1.5 py-0.2 text-[9px] font-bold text-orange-400 shadow-sm">
              {user.level}
            </div>
            
            {/* Online glow dot */}
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
          </button>

        </div>

      </div>
    </header>
  );
};
