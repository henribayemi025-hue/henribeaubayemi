import React from 'react';
import { Play, Sparkles, Clock, Zap, ArrowRight, Activity } from 'lucide-react';
import { Lesson } from '../types';

interface HeroCurrentLessonProps {
  lesson: Lesson;
  onResumeLesson: () => void;
}

export const HeroCurrentLesson: React.FC<HeroCurrentLessonProps> = ({
  lesson,
  onResumeLesson,
}) => {
  return (
    <div className="relative w-full group">
      
      {/* AMBIENT GLOW EFFECT BEHIND HERO */}
      <div 
        className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-600/30 via-amber-500/25 to-orange-500/20 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
        aria-hidden="true" 
      />

      {/* MAIN HERO CARD CONTAINER */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.15)] group-hover:border-orange-500/50 transition-all duration-300 p-6 sm:p-8">
        
        {/* Subtle Cyber Grid Accent inside card */}
        <div className="absolute inset-0 cyber-grid-orange opacity-40 pointer-events-none" />
        
        {/* Subtle Top-Right Corner Light Flare */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
          
          {/* HEADER ROW OF CARD: Tag & Status */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
              </span>
              <span className="text-xs font-bold tracking-widest text-orange-400 uppercase font-mono">
                {lesson.topic}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>12 min restantes</span>
            </div>
          </div>

          {/* LESSON TITLE & DESCRIPTION */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight font-['Outfit']">
              Leçon {lesson.lessonNumber} : {lesson.title}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl line-clamp-2">
              {lesson.conceptSummary}
            </p>
          </div>

          {/* INTERACTIVE NEURAL FLOW MINI-PREVIEW */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 border border-white/10 p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Activity className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                Architecture Perceptron & Backprop
              </span>
              <span className="text-orange-400 font-semibold">+250 XP</span>
            </div>

            {/* Neural Net Nodes Diagram Representation */}
            <div className="flex items-center justify-between py-2 px-2 sm:px-6">
              {/* Layer 1: Inputs */}
              <div className="flex flex-col gap-2 items-center">
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-orange-500/50 flex items-center justify-center text-[10px] font-mono text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.4)]">
                  x₁
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-orange-500/50 flex items-center justify-center text-[10px] font-mono text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.4)]">
                  x₂
                </div>
              </div>

              {/* Connections with pulse */}
              <div className="flex-1 px-3 sm:px-6 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-orange-500/40 via-orange-400 to-amber-400/40 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                </div>
              </div>

              {/* Layer 2: Hidden ReLU */}
              <div className="flex flex-col gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-orange-950/80 border-2 border-orange-500 flex items-center justify-center text-[10px] font-mono text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.6)]">
                  h₁
                </div>
                <div className="w-7 h-7 rounded-full bg-orange-950/80 border-2 border-orange-500 flex items-center justify-center text-[10px] font-mono text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.6)]">
                  h₂
                </div>
              </div>

              {/* Connections */}
              <div className="flex-1 px-3 sm:px-6 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400/60 relative">
                  <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                </div>
              </div>

              {/* Layer 3: Output */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-amber-400 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)]">
                  ŷ
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS BAR SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <span className="text-zinc-300">Progression globale</span>
              <span className="text-orange-400 font-mono font-bold tabular-nums">
                {lesson.progress}% complété
              </span>
            </div>

            {/* Glowing Orange Gradient Progress Bar */}
            <div className="h-3 w-full rounded-full bg-zinc-950/90 border border-white/10 p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 shadow-[0_0_16px_rgba(249,115,22,0.7)] transition-all duration-700 ease-out relative"
                style={{ width: `${lesson.progress}%` }}
              >
                {/* Light reflection effect on progress bar */}
                <div className="absolute inset-0 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>

          {/* MASSIF CALL TO ACTION BUTTON */}
          <button
            onClick={onResumeLesson}
            className="group/btn relative w-full flex items-center justify-center gap-3 py-4 sm:py-4.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white font-extrabold text-base sm:text-lg tracking-tight shadow-[0_0_28px_rgba(249,115,22,0.45)] hover:shadow-[0_0_40px_rgba(249,115,22,0.7)] hover:scale-[1.015] active:scale-[0.985] transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Ambient sliding light flare */}
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover/btn:scale-110 transition-transform">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>

            <span className="font-['Outfit'] drop-shadow-sm">
              Reprendre la leçon
            </span>

            <ArrowRight className="w-5 h-5 text-white/90 group-hover/btn:translate-x-1.5 transition-transform" />
          </button>

        </div>

      </div>

    </div>
  );
};
