import React, { useRef } from 'react';
import { 
  Code2, 
  Database, 
  Terminal, 
  Eye, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { Track } from '../types';

interface TracksCarouselProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (track: Track) => void;
}

export const TracksCarousel: React.FC<TracksCarouselProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getIcon = (iconName: Track['iconName']) => {
    switch (iconName) {
      case 'code':
        return <Code2 className="w-5 h-5 text-orange-400" />;
      case 'database':
        return <Database className="w-5 h-5 text-amber-400" />;
      case 'terminal':
        return <Terminal className="w-5 h-5 text-orange-500" />;
      case 'eye':
        return <Eye className="w-5 h-5 text-orange-400" />;
      default:
        return <Layers className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* SECTION HEADER: Title & Arrows */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
            Tes Parcours
            <span className="text-xs font-mono font-normal text-zinc-400">
              ({tracks.length})
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Formations modulaires de niveau ingénieur IA
          </p>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-zinc-900/80 border border-white/10 hover:border-orange-500/40 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
            aria-label="Faire défiler vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-zinc-900/80 border border-white/10 hover:border-orange-500/40 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
            aria-label="Faire défiler vers la droite"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL SNAP SCROLL CAROUSEL */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {tracks.map((track) => {
          const isSelected = selectedTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`snap-start shrink-0 w-[270px] sm:w-[305px] rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer relative overflow-hidden group select-none ${
                isSelected
                  ? 'bg-zinc-900/90 border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] scale-[1.01]'
                  : 'bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/10 hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]'
              }`}
            >
              {/* Internal subtle gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${track.gradient} opacity-50 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none`}
              />

              {/* Ambient micro glow in top right */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full justify-between gap-5">
                
                {/* TOP BAR OF CARD: Icon & Level Tag */}
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-950/80 border border-white/15 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)] group-hover:border-orange-500/50 group-hover:scale-105 transition-all duration-200">
                    {getIcon(track.iconName)}
                  </div>

                  <span className="text-[11px] font-mono font-medium text-orange-400 bg-orange-950/40 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
                    {track.badge}
                  </span>
                </div>

                {/* CARD CONTENT: Title & Subtitle */}
                <div className="space-y-1.5">
                  <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight font-['Outfit'] group-hover:text-orange-400 transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-xs font-semibold text-zinc-400 tracking-tight line-clamp-1">
                    {track.subtitle}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mt-1">
                    {track.description}
                  </p>
                </div>

                {/* BOTTOM METRICS: Progress & Arrow */}
                <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">
                      {track.completedLessons}/{track.totalLessons} leçons
                    </span>
                    <span className="text-orange-400 font-bold font-mono">
                      {track.progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-zinc-950/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all duration-500"
                      style={{ width: `${track.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Niveau {track.level}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-orange-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Explorer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
