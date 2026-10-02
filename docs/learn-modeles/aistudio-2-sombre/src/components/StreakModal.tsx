import React from 'react';
import { X, Flame, Shield, Sparkles, Trophy, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';

interface StreakModalProps {
  user: UserStats;
  isOpen: boolean;
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleCelebrate = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#f97316', '#ea580c', '#fb923c', '#ffffff'],
      });
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-orange-500/40 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.3)] overflow-hidden my-auto p-6 sm:p-7 space-y-6">
        
        {/* Glow orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* FLAME HERO SECTION */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 p-0.5 shadow-[0_0_30px_rgba(249,115,22,0.6)]">
              <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
                <Flame className="w-10 h-10 text-orange-400 fill-orange-500 animate-bounce" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
              {user.streakDays} jours d'affilée !
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Tu es dans le top 5% des développeurs les plus réguliers sur Finjaro Learn.
            </p>
          </div>
        </div>

        {/* 7-DAY STREAK CALENDAR */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Activité des 7 derniers jours
            </span>
            <span className="text-orange-400 font-bold">100% régulier</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-400">{day}</span>
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/60 flex items-center justify-center text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.4)]">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PERKS ROW */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-orange-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Boucliers de gel</span>
            </div>
            <div className="text-white font-bold text-base font-mono">2 actifs</div>
            <p className="text-[11px] text-zinc-400">Protège ta série si tu manques 1 jour.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Trophy className="w-4 h-4" />
              <span>Multiplicateur XP</span>
            </div>
            <div className="text-white font-bold text-base font-mono">x 1.5 XP</div>
            <p className="text-[11px] text-zinc-400">Bonus de série actif sur chaque quiz.</p>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleCelebrate}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
        >
          <Sparkles className="w-4 h-4" />
          Célébrer la régularité ⚡
        </button>

      </div>
    </div>
  );
};
