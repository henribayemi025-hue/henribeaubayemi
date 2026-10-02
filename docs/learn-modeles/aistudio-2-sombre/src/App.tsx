/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  Code2, 
  Cpu, 
  ArrowUpRight, 
  Smartphone, 
  Monitor,
  Trophy,
  Zap,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Header } from './components/Header';
import { HeroCurrentLesson } from './components/HeroCurrentLesson';
import { TracksCarousel } from './components/TracksCarousel';
import { BottomNav, TabType } from './components/BottomNav';
import { LessonModal } from './components/LessonModal';
import { StreakModal } from './components/StreakModal';
import { ProfileModal } from './components/ProfileModal';
import { StudyView } from './components/StudyView';
import { AiToolsView } from './components/AiToolsView';

import { INITIAL_USER, CURRENT_HERO_LESSON, TRACKS, DAILY_CHALLENGE } from './data/learningData';
import { Track, Lesson, UserStats } from './types';

export default function App() {
  const [user, setUser] = useState<UserStats>(INITIAL_USER);
  const [currentLesson, setCurrentLesson] = useState<Lesson>(CURRENT_HERO_LESSON);
  const [tracks, setTracks] = useState<Track[]>(TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('hub');

  // Modals State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Daily Challenge State
  const [dailySolved, setDailySolved] = useState(false);

  // Viewport Device Frame Switcher (for desktop testing of mobile-first experience)
  const [deviceFrameMode, setDeviceFrameMode] = useState<'mobile' | 'fluid'>('mobile');

  const handleResumeLesson = () => {
    setIsLessonModalOpen(true);
  };

  const handleCompleteLesson = () => {
    // Increase progress and XP
    setCurrentLesson((prev) => ({
      ...prev,
      progress: Math.min(100, prev.progress + 15),
    }));

    setUser((prev) => ({
      ...prev,
      totalXp: prev.totalXp + 250,
      currentLevelXp: Math.min(prev.nextLevelXp, prev.currentLevelXp + 250),
      completedCount: prev.completedCount + 1,
    }));
  };

  const handleSelectTrack = (track: Track) => {
    setSelectedTrackId(track.id);
  };

  const handleSolveDaily = () => {
    if (!dailySolved) {
      setDailySolved(true);
      setUser((prev) => ({
        ...prev,
        totalXp: prev.totalXp + DAILY_CHALLENGE.xp,
      }));
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f97316', '#ea580c', '#fbbf24'],
        });
      } catch (e) {
        // fallback
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center relative overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* ========================================================================= */}
      {/* 🌌 AMBIENT NEON GLOW LIGHTS (Blur-3xl for Cyber / Night Coding Atmosphere) */}
      {/* ========================================================================= */}
      <div 
        className="fixed top-0 left-1/4 -translate-x-1/2 w-[520px] h-[480px] bg-orange-600/12 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-glow" 
        aria-hidden="true" 
      />
      <div 
        className="fixed top-1/3 right-1/4 translate-x-1/3 w-[460px] h-[420px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none -z-10" 
        aria-hidden="true" 
      />
      <div 
        className="fixed -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-orange-700/10 rounded-full blur-[160px] pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      {/* Subtle background cyber grid */}
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP DESKTOP DEVICE SWITCHER (Allows toggling between iPhone frame & fluid) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex items-center gap-3 py-2 px-4 mt-2 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-xs text-zinc-400 z-30">
        <span className="font-mono text-orange-400 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Aperçu Maquette :
        </span>
        <button
          onClick={() => setDeviceFrameMode('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors cursor-pointer ${
            deviceFrameMode === 'mobile'
              ? 'bg-orange-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.5)]'
              : 'hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Vue Mobile-First (iPhone 16 Pro)
        </button>
        <button
          onClick={() => setDeviceFrameMode('fluid')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors cursor-pointer ${
            deviceFrameMode === 'fluid'
              ? 'bg-orange-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.5)]'
              : 'hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Vue Fluide Écran Large
        </button>
      </div>

      {/* ========================================================================= */}
      {/* APP CONTAINER: EITHER MOBILE FRAME OR FLUID CONTAINER                     */}
      {/* ========================================================================= */}
      <div
        className={`w-full transition-all duration-300 ${
          deviceFrameMode === 'mobile'
            ? 'max-w-[430px] my-0 lg:my-6 rounded-none lg:rounded-[48px] border-0 lg:border-4 lg:border-zinc-800 lg:shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_40px_rgba(249,115,22,0.15)] bg-zinc-950 relative min-h-screen lg:min-h-[880px] overflow-hidden'
            : 'max-w-4xl px-4 sm:px-6'
        }`}
      >
        {/* iPhone Speaker Notch for Desktop Mobile Frame */}
        {deviceFrameMode === 'mobile' && (
          <div className="hidden lg:flex justify-center pt-3 pb-1 bg-zinc-950 sticky top-0 z-50">
            <div className="w-24 h-4 bg-zinc-900 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-zinc-950 mr-2" />
              <div className="w-8 h-1 bg-zinc-800 rounded-full" />
            </div>
          </div>
        )}

        {/* 1. HEADER */}
        <Header
          user={user}
          onOpenStreak={() => setIsStreakModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* MAIN BODY CONTENT */}
        <main className="px-4 sm:px-6 pt-5 pb-32 space-y-7">
          
          {/* TAB 1: HUB (Main requested view) */}
          {activeTab === 'hub' && (
            <div className="space-y-7 animate-in fade-in duration-300">
              
              {/* WELCOME BANNER / KICKER */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Outfit']">
                    Ravi de te revoir, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-400 font-extrabold">{user.name.split(' ')[0]}</span> 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    Objectif du jour : termine la propagation avant pour garder ta série.
                  </p>
                </div>
              </div>

              {/* 2. CARTE HERO "EN COURS" (L'élément central) */}
              <section aria-label="Leçon en cours">
                <HeroCurrentLesson
                  lesson={currentLesson}
                  onResumeLesson={handleResumeLesson}
                />
              </section>

              {/* 3. CAROUSEL "TES PARCOURS" */}
              <section aria-label="Tes parcours">
                <TracksCarousel
                  tracks={tracks}
                  selectedTrackId={selectedTrackId}
                  onSelectTrack={handleSelectTrack}
                />
              </section>

              {/* BONUS HUB ELEMENT: DÉFI QUOTIDIEN (Daily Challenge) */}
              <section aria-label="Défi quotidien">
                <div className="relative overflow-hidden rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-5 sm:p-6 space-y-4">
                  {/* Subtle orange accent */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                        <Zap className="w-4 h-4 fill-orange-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white font-['Outfit']">
                          {DAILY_CHALLENGE.title}
                        </h4>
                        <span className="text-xs text-orange-400 font-mono">
                          +{DAILY_CHALLENGE.xp} XP · {DAILY_CHALLENGE.streakBonus}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-white/5">
                      Python 3.12
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {DAILY_CHALLENGE.description}
                  </p>

                  <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/10 font-mono text-xs text-orange-300">
                    <code>def scaled_dot_product(q, k, v): return torch.softmax(q @ k.T / math.sqrt(d), -1) @ v</code>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400">
                      {dailySolved ? '✓ Défi résolu avec brio !' : 'Temps estimé : 2 min'}
                    </span>
                    <button
                      onClick={handleSolveDaily}
                      disabled={dailySolved}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                        dailySolved
                          ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95'
                      }`}
                    >
                      {dailySolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Résolu (+150 XP)
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Tester & Valider
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>

              {/* QUICK LEARNING STATS FOOTPRINT */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div 
                  onClick={() => setIsStreakModalOpen(true)}
                  className="p-4 rounded-3xl bg-zinc-900/30 backdrop-blur-xl border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    Série Active
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {user.streakDays} jours
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Prochain palier : 15 jours
                  </div>
                </div>

                <div 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-4 rounded-3xl bg-zinc-900/30 backdrop-blur-xl border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                    <Trophy className="w-3.5 h-3.5" />
                    XP Total
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {user.totalXp.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Niveau 24 · Architecte
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ÉTUDE (Curriculum roadmap view) */}
          {activeTab === 'etude' && (
            <div className="animate-in fade-in duration-300">
              <StudyView
                tracks={tracks}
                onOpenLesson={handleResumeLesson}
              />
            </div>
          )}

          {/* TAB 3: OUTILS IA (Interactive tools view) */}
          {activeTab === 'outils' && (
            <div className="animate-in fade-in duration-300">
              <AiToolsView />
            </div>
          )}

        </main>

        {/* 4. NAVIGATION FLOTTANTE (BOTTOM NAV) */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS & DRAWERS                                              */}
      {/* ========================================================================= */}
      
      {/* 1. Full Interactive Lesson Modal */}
      <LessonModal
        lesson={currentLesson}
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onCompleteLesson={handleCompleteLesson}
      />

      {/* 2. Streak Flame Details Modal */}
      <StreakModal
        user={user}
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
      />

      {/* 3. User Profile Modal */}
      <ProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

    </div>
  );
}
