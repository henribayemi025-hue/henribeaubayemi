import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Play, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  Code2, 
  Database, 
  Terminal,
  Search
} from 'lucide-react';
import { Track } from '../types';

interface StudyViewProps {
  tracks: Track[];
  onOpenLesson: () => void;
}

export const StudyView: React.FC<StudyViewProps> = ({
  tracks,
  onOpenLesson,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string>('programmation');
  const [searchQuery, setSearchQuery] = useState('');

  const currentTrack = tracks.find((t) => t.id === selectedTrack) || tracks[0];

  const modules = [
    {
      title: 'Module 1 : Tensors & Mathématiques du Gradient',
      lessons: [
        { name: '1. Espaces vectoriels et matrices en PyTorch', duration: '18 min', status: 'completed' },
        { name: '2. Différentiation automatique & autograd', duration: '24 min', status: 'completed' },
        { name: '3. Descente de gradient stochastique (SGD vs AdamW)', duration: '20 min', status: 'completed' },
      ]
    },
    {
      title: 'Module 2 : Architectures Perceptron & MLP',
      lessons: [
        { name: '4. Réseau de neurones & activation ReLU', duration: '25 min', status: 'current' },
        { name: '5. Régularisation Dropout & BatchNorm', duration: '22 min', status: 'locked' },
        { name: '6. Projet : Classifier Fashion-MNIST à 92%', duration: '45 min', status: 'locked' },
      ]
    },
    {
      title: 'Module 3 : Mécanisme d\'Attention & Transformers',
      lessons: [
        { name: '7. Query, Key, Value & Scaled Dot-Product', duration: '30 min', status: 'locked' },
        { name: '8. Multi-Head Attention from scratch', duration: '35 min', status: 'locked' },
        { name: '9. Position Embeddings (RoPE & Sinusoidal)', duration: '28 min', status: 'locked' },
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-28 pt-2">
      {/* SECTION HEADER */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          Programme d'Étude & Roadmaps
        </h2>
        <p className="text-sm text-zinc-400">
          Curriculum structuré par des chercheurs et ingénieurs IA
        </p>
      </div>

      {/* TRACK SELECTOR TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {tracks.map((t) => {
          const isActive = selectedTrack === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTrack(t.id)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-[0_0_18px_rgba(249,115,22,0.4)]'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 border border-white/10 hover:text-white'
              }`}
            >
              {t.title}
            </button>
          );
        })}
      </div>

      {/* TRACK SUMMARY CARD */}
      <div className="p-6 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-orange-500/25 relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Parcours actif : {currentTrack.title}
          </div>
          <span className="text-xs font-bold text-orange-400 bg-orange-950/50 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-mono">
            {currentTrack.progress}% Maîtrisé
          </span>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white font-['Outfit']">
            {currentTrack.subtitle}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {currentTrack.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
            style={{ width: `${currentTrack.progress}%` }}
          />
        </div>
      </div>

      {/* MODULES LIST */}
      <div className="space-y-4">
        {modules.map((mod, mIdx) => (
          <div
            key={mIdx}
            className="rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                {mod.title}
              </h4>
              <span className="text-xs text-zinc-400 font-mono">
                {mod.lessons.length} leçons
              </span>
            </div>

            <div className="space-y-2">
              {mod.lessons.map((lesson, lIdx) => {
                const isCurrent = lesson.status === 'current';
                const isCompleted = lesson.status === 'completed';
                const isLocked = lesson.status === 'locked';

                return (
                  <div
                    key={lIdx}
                    onClick={() => {
                      if (!isLocked) onOpenLesson();
                    }}
                    className={`p-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                      isCurrent
                        ? 'bg-orange-950/40 border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)] cursor-pointer hover:bg-orange-900/40'
                        : isCompleted
                        ? 'bg-zinc-950/60 border border-white/5 hover:border-white/15 cursor-pointer text-zinc-300'
                        : 'bg-zinc-950/30 border border-white/5 opacity-50 cursor-not-allowed text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        )}
                        {isCurrent && (
                          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-[0_0_10px_rgba(249,115,22,0.6)]">
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          </div>
                        )}
                        {isLocked && (
                          <Lock className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>

                      <div>
                        <div className={`text-xs sm:text-sm font-semibold ${
                          isCurrent ? 'text-white' : 'text-zinc-200'
                        }`}>
                          {lesson.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-orange-400/80" />
                          <span>{lesson.duration}</span>
                          {isCurrent && (
                            <span className="text-orange-400 font-bold font-mono">
                              · En cours (68%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <button className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-[0_0_12px_rgba(249,115,22,0.5)] cursor-pointer">
                          Continuer
                        </button>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
