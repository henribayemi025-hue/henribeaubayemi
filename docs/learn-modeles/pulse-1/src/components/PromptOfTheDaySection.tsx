import React, { useState } from 'react';
import { PromptOfTheDay } from '../types/pulse';
import { Terminal, Copy, Check, Sparkles, Sliders, Cpu, FileCode2, ChevronDown, ChevronUp, Bot } from 'lucide-react';

interface PromptOfTheDaySectionProps {
  promptData: PromptOfTheDay;
  onCopySuccessToast?: () => void;
}

export const PromptOfTheDaySection: React.FC<PromptOfTheDaySectionProps> = ({
  promptData,
  onCopySuccessToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showOutputExample, setShowOutputExample] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    promptData.variables.forEach((v) => {
      initial[v.key] = v.defaultValue;
    });
    return initial;
  });

  // Generate resolved prompt with current variable values
  const resolvedPrompt = React.useMemo(() => {
    let result = promptData.fullPrompt;
    Object.entries(variableValues).forEach(([key, val]) => {
      result = result.replaceAll(`{{${key}}}`, val || `[${key}]`);
    });
    return result;
  }, [promptData.fullPrompt, variableValues]);

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedPrompt);
    setCopied(true);
    if (onCopySuccessToast) onCopySuccessToast();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  };

  const promptLines = resolvedPrompt.split('\n');

  return (
    <section className="relative my-12">
      {/* Background ambient neon glow for this spotlight section */}
      <div 
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-80 w-[650px] rounded-full bg-orange-500/10 blur-[130px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Le Prompt du Jour
                </h2>
                <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-[11px] font-mono text-orange-400">
                  SYSTEM READY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Instruction de production testée et vérifiée avec garanties de résultat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                showVariables
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-orange-400" />
              <span>Personnaliser les variables</span>
              {showVariables ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Massive Premium Card with Illuminated Edge */}
        <div className="relative rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-orange-500/30 p-6 sm:p-8 shadow-[0_0_50px_-15px_rgba(249,115,22,0.15)] overflow-hidden">
          {/* Top highlight line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

          {/* Card Top Metadata & Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-xs font-semibold text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.2)]">
                  <Bot className="h-3.5 w-3.5" />
                  {promptData.modelBadge}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 border border-white/5 px-2.5 py-1 text-xs text-zinc-300 font-mono">
                  <Cpu className="h-3 w-3 text-zinc-400" />
                  Temp: {promptData.recommendedParams.temperature}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 border border-white/5 px-2.5 py-1 text-xs text-zinc-300 font-mono">
                  Max tokens: {promptData.recommendedParams.maxTokens}
                </span>

                <span className="text-xs text-zinc-500 font-mono ml-auto">
                  ~{promptData.estimatedTokens} tokens
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {promptData.title}
              </h3>
              <p className="mt-1.5 text-sm text-zinc-400 max-w-3xl leading-relaxed">
                {promptData.context}
              </p>
            </div>
          </div>

          {/* Interactive Variables Drawer (Expandable) */}
          {showVariables && (
            <div className="my-6 p-4 rounded-2xl bg-black/40 border border-orange-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5" />
                  Injecter des paramètres dans le prompt
                </span>
                <button
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    promptData.variables.forEach((v) => (reset[v.key] = v.defaultValue));
                    setVariableValues(reset);
                  }}
                  className="text-[11px] text-zinc-500 hover:text-orange-400 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {promptData.variables.map((variable) => (
                  <div key={variable.key} className="space-y-1">
                    <label className="text-[11px] font-mono text-zinc-400 block">
                      {variable.label} <span className="text-orange-400/80">({`{{${variable.key}}}`})</span>
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable.key] || ''}
                      onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                      className="w-full rounded-xl bg-zinc-900/80 border border-white/10 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500/50 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terminal / Code Editor Container */}
          <div className="relative mt-6 rounded-2xl bg-black/50 border border-white/10 shadow-2xl overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/70 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/80 border border-red-400/20" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-400/20" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-400/20" />
                </div>
                <div className="ml-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 text-[11px] font-mono text-zinc-400">
                  <FileCode2 className="h-3 w-3 text-orange-400" />
                  <span>architect_migration_v2.prompt</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                <span>UTF-8</span>
                <span>·</span>
                <span>SYSTEM_PROMPT</span>
              </div>
            </div>

            {/* Terminal Content with Line Numbers */}
            <div className="relative p-4 sm:p-6 overflow-x-auto max-h-[380px] scrollbar-thin">
              <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-300">
                {promptLines.map((line, idx) => {
                  const isSectionHeader = line.startsWith('[') && line.endsWith(']');
                  const isNumberedStep = /^\d+\./.test(line.trim());
                  const isDivider = line.startsWith('----');
                  const hasVariable = line.includes('{{') || Object.values(variableValues).some(v => v && line.includes(v));

                  return (
                    <div key={idx} className="flex hover:bg-white/[0.03] px-1 rounded transition-colors">
                      <span className="w-8 shrink-0 select-none text-right pr-4 text-zinc-600 font-mono text-xs">
                        {idx + 1}
                      </span>
                      <span
                        className={`flex-1 ${
                          isSectionHeader
                            ? 'text-orange-400 font-semibold'
                            : isNumberedStep
                            ? 'text-amber-300 font-medium'
                            : isDivider
                            ? 'text-zinc-600'
                            : 'text-zinc-300'
                        }`}
                      >
                        {line}
                      </span>
                    </div>
                  );
                })}
              </pre>

              {/* Floating Copy Action Button */}
              <div className="sticky bottom-2 right-2 flex justify-end mt-4">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95 shadow-xl ${
                    copied
                      ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'bg-orange-500 text-zinc-950 hover:bg-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.4)]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      <span>Prompt Copié dans le Presse-Papier !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copier le prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Accordion: Example Output Preview */}
          <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Cas d'usage :</span>
              <span className="text-zinc-300">{promptData.useCase}</span>
            </div>

            <button
              onClick={() => setShowOutputExample(!showOutputExample)}
              className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>{showOutputExample ? 'Masquer l\'exemple de sortie' : 'Voir un exemple de sortie Claude'}</span>
              {showOutputExample ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Example Output Box */}
          {showOutputExample && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-zinc-300 font-mono space-y-2 leading-relaxed">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-2 border-b border-white/5">
                <span className="text-orange-400 font-semibold">Exemple de résultat généré (Extrait) :</span>
                <span>Temps de réflexion : 4.2s</span>
              </div>
              <p className="text-zinc-400">
                1. <span className="text-white font-bold">Cartographie DDD :</span> Découplage identifié entre <code className="text-orange-300">OrderProcessor</code> et la couche persistance SQL via un pattern Repository asynchrone.
              </p>
              <p className="text-zinc-400">
                2. <span className="text-white font-bold">Contrat TypeScript :</span>
              </p>
              <pre className="p-2.5 rounded bg-black/60 text-zinc-300 text-[11px] overflow-x-auto">
{`interface IOrderRepository {
  findById(id: OrderId): Promise<Result<Order, DomainError>>;
  save(order: Order, options?: TransactionOptions): Promise<void>;
}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
