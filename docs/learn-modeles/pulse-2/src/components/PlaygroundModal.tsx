import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Terminal, 
  RotateCw, 
  Copy, 
  Check, 
  Sparkles, 
  Cpu, 
  Clock 
} from 'lucide-react';
import { AIPrompt } from '../types';

interface PlaygroundModalProps {
  prompt: AIPrompt | null;
  filledPromptText: string;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({
  prompt,
  filledPromptText,
  isOpen,
  onClose,
  onCopy
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [hasRun, setHasRun] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  if (!isOpen || !prompt) return null;

  const handleSimulateRun = () => {
    setIsRunning(true);
    setOutput('');
    setHasRun(true);

    const simulationText = `[INITIALISATION MODÈLE : ${prompt.modelBadge}]
Token input : ${prompt.tokenCount} tokens | Temperature : 0.2 | Top_p : 0.95
Connexion au cluster d'inférence sécurisé... OK (latence 42ms)

{
  "statut": "SUCCÈS_RÉSOLUTION",
  "architecture_graphe": {
    "agent_a_parsing": {
      "rôle": "Normalisation des flux d'ingestion",
      "contrat_entrée": "StreamingPayload<JSON>",
      "invariants": "Strict UTF-8, détection des anomalies de schéma"
    },
    "agent_b_raisonnement": {
      "rôle": "Moteur décisionnel et inférence fonctionnelle",
      "contrat_sortie": "DecisionGraphNode",
      "invariants": "Zéro extrapolation probabiliste hors base de connaissances"
    },
    "agent_c_validation": {
      "rôle": "Audit des invariants de sécurité et SLA",
      "latence_observée": "12.4ms",
      "invariants": "Fail-fast immédiat si dérive temporelle > 150ms"
    }
  },
  "checklist_risques_latence": [
    "✅ Sérialisation binaire via FlatBuffers",
    "✅ Découplage asynchrone des écritures d'audit",
    "✅ Inférence GPU quantifiée FP8 vérifiée"
  ]
}

[DÉCOMPILATION COMPLÈTE - 384 TOKENS GÉNÉRÉS EN 0.24s (1600 tokens/s)]`;

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex += 18;
      if (currentIndex >= simulationText.length) {
        setOutput(simulationText);
        setIsRunning(false);
        clearInterval(interval);
      } else {
        setOutput(simulationText.slice(0, currentIndex));
      }
    }, 25);
  };

  const handleCopyOutput = () => {
    onCopy(output);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl my-8 bg-[#0A0D17] border border-white/[0.12] rounded-3xl shadow-2xl shadow-violet-950/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 via-cyan-400 to-indigo-500" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>Playground d&apos;Inférence</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-normal">
                  {prompt.modelBadge}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Test interactif du prompt calibré</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Split view (Prompt Input / Execution Output) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] max-h-[68vh] overflow-y-auto">
          {/* Left Side: Prepared Prompt */}
          <div className="p-5 flex flex-col justify-between bg-[#080B13]">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Prompt Injecté</span>
                </span>
                <span className="tabular-nums">~{prompt.tokenCount} tokens</span>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/[0.06] text-xs font-mono text-slate-300 leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap">
                {filledPromptText}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">Prêt pour l&apos;exécution</span>
              <button
                onClick={handleSimulateRun}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Inférence en cours...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Exécuter la simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Output Console */}
          <div className="p-5 flex flex-col justify-between bg-[#06080F]">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Console de Réponse</span>
                </span>
                {hasRun && (
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>0.24s · 100% Déterministe</span>
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-black/80 border border-emerald-500/20 text-xs font-mono text-emerald-300 leading-relaxed min-h-[300px] max-h-[360px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                {isRunning && (
                  <div className="flex items-center gap-2 text-cyan-400 mb-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Génération des tokens par le modèle...</span>
                  </div>
                )}
                {output ? (
                  output
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                    <Terminal className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs">Cliquez sur &quot;Exécuter la simulation&quot; pour tester</p>
                  </div>
                )}
              </div>
            </div>

            {hasRun && output && (
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-end">
                <button
                  onClick={handleCopyOutput}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.1] transition-all"
                >
                  {copiedOutput ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Sortie copiée</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier la réponse</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
