import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Terminal, 
  Sliders, 
  Play, 
  Cpu, 
  Bookmark, 
  Layers, 
  Info,
  Maximize2
} from 'lucide-react';
import { AIPrompt } from '../types';

interface PromptOfTheDaySectionProps {
  prompts: AIPrompt[];
  onCopyPrompt: (text: string) => void;
  onOpenPlayground: (prompt: AIPrompt, filledPrompt: string) => void;
  onToggleBookmark: (promptId: string) => void;
  bookmarkedIds: Set<string>;
}

export const PromptOfTheDaySection: React.FC<PromptOfTheDaySectionProps> = ({
  prompts,
  onCopyPrompt,
  onOpenPlayground,
  onToggleBookmark,
  bookmarkedIds
}) => {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const activePrompt = prompts[selectedPromptIndex] || prompts[0];

  // Initialize variables state for the active prompt
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    activePrompt.variables.forEach((v) => {
      init[v.name] = v.defaultValue;
    });
    return init;
  });

  // Handle switching prompt
  const handleSelectPrompt = (index: number) => {
    setSelectedPromptIndex(index);
    const target = prompts[index];
    const newVars: Record<string, string> = {};
    target.variables.forEach((v) => {
      newVars[v.name] = v.defaultValue;
    });
    setVariableValues(newVars);
  };

  const handleVarChange = (name: string, val: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [name]: val
    }));
  };

  // Compute the interpolated prompt text
  const getRenderedPrompt = () => {
    let text = activePrompt.template;
    Object.entries(variableValues).forEach(([key, val]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      text = text.replace(regex, val || `[${key}]`);
    });
    return text;
  };

  const currentFilledText = getRenderedPrompt();

  const handleCopy = () => {
    onCopyPrompt(currentFilledText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const isBookmarked = bookmarkedIds.has(activePrompt.id);

  // Badge gradient based on model
  const getBadgeStyle = (family: AIPrompt['modelFamily']) => {
    switch (family) {
      case 'claude':
        return 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-orange-500/30 text-amber-300';
      case 'gpt':
        return 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border-emerald-500/30 text-emerald-300';
      case 'gemini':
        return 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border-cyan-500/30 text-cyan-300';
      default:
        return 'bg-violet-500/15 border-violet-500/30 text-violet-300';
    }
  };

  const lines = currentFilledText.split('\n');

  return (
    <section className="relative w-full py-8">
      {/* Background ambient lighting halo for this marquee section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-violet-600/15 to-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  Le Prompt du Jour
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                  Prêt pour la production
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modèle d&apos;ingénierie de prompt testé et calibré pour éliminer les hallucinations.
              </p>
            </div>
          </div>

          {/* Model Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl self-start sm:self-auto">
            {prompts.map((p, idx) => {
              const active = idx === selectedPromptIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrompt(idx)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30 text-white border border-white/20 shadow-md font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  {p.modelFamily === 'claude' && 'Claude 3.5'}
                  {p.modelFamily === 'gpt' && 'GPT-4o'}
                  {p.modelFamily === 'gemini' && 'Gemini 1.5'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Massive Highlighted Hero Card */}
        <div className="relative rounded-3xl bg-[#0B0F1A]/80 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-violet-950/30 overflow-hidden">
          
          {/* Subtle top iridescent beam */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 via-cyan-400 to-transparent" />

          {/* Card Upper Info Bar */}
          <div className="p-6 sm:p-7 border-b border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Model badge strictly styled */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(activePrompt.modelFamily)}`}>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{activePrompt.modelBadge}</span>
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  {activePrompt.category}
                </span>

                <span className="text-slate-600" aria-hidden="true">·</span>

                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{activePrompt.efficiencyRating}</span>
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                {activePrompt.title}
              </h3>

              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                {activePrompt.shortDesc}
              </p>
            </div>

            {/* Quick Actions (Bookmark + Variables toggle + Playground) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onToggleBookmark(activePrompt.id)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isBookmarked
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white'
                }`}
                title={isBookmarked ? 'Retirer des favoris' : 'Sauvegarder ce prompt'}
                aria-label="Sauvegarder ce prompt"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>

              <button
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  isCustomizing
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isCustomizing ? 'Masquer variables' : 'Personnaliser'}</span>
              </button>

              <button
                onClick={() => onOpenPlayground(activePrompt, currentFilledText)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 hover:text-white transition-all shadow-lg shadow-violet-500/10 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-violet-300" />
                <span>Tester en live</span>
              </button>
            </div>
          </div>

          {/* Interactive Variables Panel (if toggled) */}
          {isCustomizing && (
            <div className="px-6 py-4 bg-[#080B12]/90 border-b border-white/[0.06] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>PARAMÈTRES DYNAMIQUES DU PROMPT</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Les modifications s&apos;injectent en direct dans le terminal ci-dessous
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activePrompt.variables.map((variable) => (
                  <div key={variable.name} className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                      <span className="text-cyan-300">{`{{${variable.name}}}`}</span>
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => handleVarChange(variable.name, e.target.value)}
                      placeholder={variable.defaultValue}
                      className="w-full px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.1] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 truncate">{variable.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Terminal / Editor View */}
          <div className="relative bg-[#07090F] group/terminal">
            
            {/* Terminal Window Header Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-black/40 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-slate-500 pl-2">prompt_v1.prompt</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-slate-500 font-mono">
                  Longueur : <span className="text-slate-300 tabular-nums">~{activePrompt.tokenCount} tokens</span>
                </span>
                <span className="hidden sm:inline-block text-slate-500">
                  Encodage : <span className="text-slate-300">UTF-8 / cl100k_base</span>
                </span>
              </div>
            </div>

            {/* Prompt Body with Line Numbers */}
            <div className="p-5 sm:p-6 overflow-x-auto max-h-[380px] font-mono text-xs sm:text-[13px] leading-relaxed select-text text-slate-200">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => {
                    const isSectionHeader = line.startsWith('[') && line.includes(']');
                    const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim());
                    const isSystemRole = idx === 0;

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="w-8 pr-4 text-right text-slate-600 select-none align-top font-mono text-xs tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="whitespace-pre-wrap break-words pl-2">
                          {isSectionHeader ? (
                            <span className="text-cyan-400 font-bold tracking-wide">
                              {line}
                            </span>
                          ) : isSystemRole ? (
                            <span className="text-violet-300 font-semibold">
                              {line}
                            </span>
                          ) : isBullet ? (
                            <span className="text-slate-200">
                              {line}
                            </span>
                          ) : (
                            <span className="text-slate-300">
                              {line}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Floating Action Button: "Copier le prompt" */}
            <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-20">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm tracking-tight transition-all duration-300 shadow-2xl active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40 ring-2 ring-emerald-400'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-cyan-500/25 ring-1 ring-cyan-300/40 hover:scale-[1.02]'
                }`}
                aria-label="Copier le prompt dans le presse-papier"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Copié dans le presse-papier !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2]" />
                    <span>Copier le prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Explanation Footer / Why this prompt works */}
          <div className="px-6 py-4 bg-white/[0.015] border-t border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Pourquoi ce pattern surclasse les prompts génériques :</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
              {activePrompt.explanation.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
