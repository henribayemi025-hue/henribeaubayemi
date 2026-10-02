import React from 'react';
import { X, Award, Flame, Clock, CheckCircle2, Cpu, Zap, Star } from 'lucide-react';
import { UserStats } from '../types';

interface ProfileModalProps {
  user: UserStats;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const badges = [
    { name: 'CUDA Optimizer', desc: 'Exécution d\'un kernel GPU en < 1ms', icon: Cpu, color: 'text-orange-400' },
    { name: 'Maître Transformers', desc: 'Attention Multi-Head implémentée', icon: Zap, color: 'text-amber-400' },
    { name: 'Streak Titan', desc: '10+ jours d\'affilée sur Finjaro', icon: Flame, color: 'text-orange-500' },
    { name: 'Clean Tensor', desc: 'Zero NaN dans la backprop', icon: Star, color: 'text-emerald-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-orange-500/40 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.3)] overflow-hidden my-auto p-6 sm:p-7 space-y-6">
        
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* PROFILE HEADER */}
        <div className="flex items-center gap-4 pt-1">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
            <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center text-orange-400 font-extrabold text-xl tracking-wider">
              AR
            </div>
            <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-orange-500 rounded-full px-2 py-0.5 text-[10px] font-bold text-orange-400">
              Lvl {user.level}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white tracking-tight font-['Outfit']">
              {user.name}
            </h3>
            <p className="text-xs font-mono text-orange-400">{user.handle}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{user.title}</p>
          </div>
        </div>

        {/* LEVEL PROGRESS */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Progression Niveau {user.level}</span>
            <span className="text-orange-400 font-mono font-bold">
              {user.currentLevelXp} / {user.nextLevelXp} XP
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
              style={{ width: `${(user.currentLevelXp / user.nextLevelXp) * 100}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-400 text-right">
            Total accumulé : <strong className="text-white font-mono">{user.totalXp.toLocaleString()} XP</strong>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/10">
            <Clock className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white font-mono">{user.hoursSpent}h</div>
            <div className="text-[10px] text-zinc-400">Code & IA</div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white font-mono">{user.completedCount}</div>
            <div className="text-[10px] text-zinc-400">Leçons validées</div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/10">
            <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1 fill-orange-500" />
            <div className="text-sm font-bold text-white font-mono">{user.streakDays}j</div>
            <div className="text-[10px] text-zinc-400">Série active</div>
          </div>
        </div>

        {/* BADGES */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-orange-400" />
            Badges Débloqués
          </div>

          <div className="grid grid-cols-2 gap-2">
            {badges.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={idx} className="p-2.5 rounded-xl bg-zinc-950/50 border border-white/5 flex items-start gap-2">
                  <div className="p-1 rounded-lg bg-zinc-900 border border-white/10 shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${b.color}`} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{b.name}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
