import React from 'react';

interface NewsVisualArtProps {
  theme: 'neural' | 'agents' | 'hardware';
  className?: string;
}

export const NewsVisualArt: React.FC<NewsVisualArtProps> = ({ theme, className = '' }) => {
  if (theme === 'neural') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black ${className}`}>
        {/* Deep ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/20 rounded-full blur-2xl" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-amber-500/15 rounded-full blur-xl" />

        {/* Neural Matrix SVG Graphic */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 225"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id="grid-neural" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="neural-glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="line-glow" x1="50" y1="112" x2="350" y2="112" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(249, 115, 22, 0.2)" />
              <stop offset="50%" stopColor="rgba(249, 115, 22, 0.8)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.3)" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid-neural)" />

          {/* Reasoning Tree Connection Lines */}
          <path d="M60 112 C 120 70, 160 50, 200 65" stroke="url(#line-glow)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M60 112 C 120 112, 160 112, 200 112" stroke="url(#line-glow)" strokeWidth="2" />
          <path d="M60 112 C 120 150, 160 170, 200 160" stroke="url(#line-glow)" strokeWidth="1.5" strokeDasharray="3 3" />

          <path d="M200 65 C 260 40, 290 50, 340 70" stroke="url(#line-glow)" strokeWidth="1.5" />
          <path d="M200 112 C 250 90, 280 100, 340 105" stroke="url(#line-glow)" strokeWidth="2" />
          <path d="M200 112 C 250 135, 280 130, 340 145" stroke="url(#line-glow)" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M200 160 C 260 180, 290 170, 340 180" stroke="url(#line-glow)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Reasoning Active Nodes */}
          {/* Root node */}
          <circle cx="60" cy="112" r="10" fill="#09090b" stroke="#f97316" strokeWidth="2" />
          <circle cx="60" cy="112" r="4" fill="#f97316" />

          {/* Level 1 Nodes */}
          <circle cx="200" cy="65" r="8" fill="#09090b" stroke="#f97316" strokeWidth="1.5" />
          <circle cx="200" cy="65" r="3" fill="#ea580c" />

          <circle cx="200" cy="112" r="12" fill="#09090b" stroke="#f97316" strokeWidth="2.5" />
          <circle cx="200" cy="112" r="5" fill="#f97316" className="animate-pulse" />

          <circle cx="200" cy="160" r="7" fill="#09090b" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1" />
          <circle cx="200" cy="160" r="2.5" fill="#f97316" opacity="0.6" />

          {/* Output Leaf Nodes */}
          <circle cx="340" cy="70" r="7" fill="#09090b" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="1" />
          <circle cx="340" cy="70" r="2.5" fill="#ea580c" />

          <circle cx="340" cy="105" r="10" fill="#09090b" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="340" cy="105" r="4" fill="#fbbf24" />

          <circle cx="340" cy="145" r="6" fill="#09090b" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1" />
          <circle cx="340" cy="180" r="6" fill="#09090b" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1" />

          {/* Waveform curves */}
          <path
            d="M 20 190 Q 100 160, 200 195 T 380 185"
            fill="none"
            stroke="rgba(249, 115, 22, 0.15)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Bottom subtle banner */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-wider text-orange-400 bg-black/60 px-2 py-0.5 rounded border border-orange-500/20">
            TEST-TIME COMPUTE
          </span>
          <span className="text-[10px] font-mono text-zinc-500">MCTS · PRM 4.2</span>
        </div>
      </div>
    );
  }

  if (theme === 'agents') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black ${className}`}>
        {/* Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-orange-600/20 rounded-full blur-2xl" />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 225"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circular Orbit Rims */}
          <circle cx="200" cy="112" r="85" stroke="rgba(249, 115, 22, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="200" cy="112" r="50" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

          {/* Central Orchestrator Agent */}
          <rect x="180" y="92" width="40" height="40" rx="8" fill="#09090b" stroke="#f97316" strokeWidth="2" />
          <circle cx="200" cy="112" r="6" fill="#f97316" />

          {/* Satellite Agent Nodes */}
          {/* Agent Top */}
          <path d="M200 92 L 200 48" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="186" y="28" width="28" height="28" rx="6" fill="#09090b" stroke="#f97316" strokeWidth="1.5" />
          <circle cx="200" cy="42" r="3" fill="#ea580c" />

          {/* Agent Bottom Right */}
          <path d="M228 126 L 272 152" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.5" />
          <rect x="268" y="146" width="30" height="30" rx="6" fill="#09090b" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="283" cy="161" r="3.5" fill="#fbbf24" />

          {/* Agent Bottom Left */}
          <path d="M172 126 L 126 152" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.5" />
          <rect x="100" y="146" width="30" height="30" rx="6" fill="#09090b" stroke="#ea580c" strokeWidth="1.5" />
          <circle cx="115" cy="161" r="3.5" fill="#ea580c" />

          {/* Connecting outer arc */}
          <path d="M130 161 C 200 200, 250 180, 270 161" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1" strokeDasharray="2 3" />

          {/* Cross lines */}
          <line x1="126" y1="146" x2="186" y2="48" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
          <line x1="272" y1="146" x2="214" y2="48" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
        </svg>

        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-wider text-orange-400 bg-black/60 px-2 py-0.5 rounded border border-orange-500/20">
            STATE GRAPH CYCLES
          </span>
          <span className="text-[10px] font-mono text-zinc-500">120 Agents · Resilient</span>
        </div>
      </div>
    );
  }

  // theme === 'hardware'
  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black ${className}`}>
      {/* Light burst */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl" />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 225"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chip Die Outer Border */}
        <rect x="70" y="32" width="260" height="160" rx="12" fill="#09090b" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <rect x="85" y="47" width="230" height="130" rx="8" fill="#0c0a09" stroke="#f97316" strokeWidth="1" strokeOpacity="0.4" />

        {/* Optical Waveguides & Laser Conduits */}
        {/* Horizontal optical channels */}
        <line x1="95" y1="75" x2="305" y2="75" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.8" />
        <line x1="95" y1="112" x2="305" y2="112" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.9" />
        <line x1="95" y1="150" x2="305" y2="150" stroke="#ea580c" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Photonic Resonator Rings */}
        <circle cx="150" cy="75" r="12" stroke="#f97316" strokeWidth="1.5" fill="none" />
        <circle cx="150" cy="75" r="4" fill="#f97316" />

        <circle cx="200" cy="112" r="16" stroke="#fbbf24" strokeWidth="2" fill="none" className="animate-spin" style={{ animationDuration: '10s' }} />
        <circle cx="200" cy="112" r="6" fill="#fbbf24" />

        <circle cx="250" cy="150" r="12" stroke="#ea580c" strokeWidth="1.5" fill="none" />
        <circle cx="250" cy="150" r="4" fill="#ea580c" />

        {/* Laser input / output beams */}
        <line x1="40" y1="112" x2="85" y2="112" stroke="#fbbf24" strokeWidth="2.5" />
        <line x1="315" y1="112" x2="360" y2="112" stroke="#fbbf24" strokeWidth="2.5" />

        {/* Gold Bond Pads */}
        {[90, 130, 170, 210, 250, 290].map((x) => (
          <React.Fragment key={x}>
            <rect x={x} y="34" width="14" height="6" rx="1.5" fill="#f59e0b" fillOpacity="0.6" />
            <rect x={x} y="185" width="14" height="6" rx="1.5" fill="#f59e0b" fillOpacity="0.6" />
          </React.Fragment>
        ))}
      </svg>

      <div className="absolute bottom-3 left-4 flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-wider text-orange-400 bg-black/60 px-2 py-0.5 rounded border border-orange-500/20">
          PHOTONIC ACCELERATOR
        </span>
        <span className="text-[10px] font-mono text-zinc-500">20x Energy Efficiency</span>
      </div>
    </div>
  );
};
