import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Terminal, 
  Play, 
  RotateCcw, 
  Sliders, 
  Copy, 
  Check, 
  Zap, 
  Activity,
  Layers
} from 'lucide-react';

export const AiToolsView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'loss' | 'prompt' | 'tensor'>('loss');

  // Tool 1: Neural Training Simulator
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(1);
  const [currentLoss, setCurrentLoss] = useState<number>(0.84);
  const [accuracy, setAccuracy] = useState<number>(62.5);

  const startTrainingSim = () => {
    setIsTraining(true);
    let epoch = 1;
    const interval = setInterval(() => {
      epoch += 1;
      setCurrentEpoch(epoch);
      setCurrentLoss((prev) => Math.max(0.042, Number((prev * 0.82 + (Math.random() * 0.02 - 0.01)).toFixed(4))));
      setAccuracy((prev) => Math.min(98.8, Number((prev + (100 - prev) * 0.18).toFixed(1))));

      if (epoch >= 12) {
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 300);
  };

  const resetTrainingSim = () => {
    setCurrentEpoch(1);
    setCurrentLoss(0.84);
    setAccuracy(62.5);
    setIsTraining(false);
  };

  // Tool 2: Prompt Optimizer
  const [rawPrompt, setRawPrompt] = useState<string>(
    'Fais un script Python pour analyser des logs de serveur et extraire les requêtes anormales.'
  );
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleOptimizePrompt = () => {
    setOptimizedPrompt(
`<system_role>
Tu es un Ingénieur SRE & Machine Learning de rang Principal, expert en analyse de télémétrie, regex haute performance et détection d'anomalies non supervisée (Isolation Forest).
</system_role>

<instructions>
1. Analyse le flux de logs bruts selon le standard Common Log Format (CLF).
2. Extrais les timestamps, status HTTP (4xx, 5xx), adresses IP et latences > 500ms.
3. Implémente un script Python 3.12 utilisant \`pydantic\` pour la validation et \`polars\` pour le traitement vectorisé haute vitesse.
4. Structure le résultat en format JSON Lines prêt pour indexation vectorielle.
</instructions>

<output_format>
- Code Python typé sans dépendances superflues
- Benchmark de complexité temporelle O(N)
- Cas de test unitaire pytest
</output_format>`
    );
  };

  const handleCopy = () => {
    if (optimizedPrompt) {
      navigator.clipboard.writeText(optimizedPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-28 pt-2">
      {/* SECTION HEADER */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] flex items-center gap-2">
          Outils & Laboratoire IA
          <Sparkles className="w-5 h-5 text-orange-400" />
        </h2>
        <p className="text-sm text-zinc-400">
          Simulateurs interactifs, optimisation de prompts et calcul tensoriel
        </p>
      </div>

      {/* TOOLS TABS */}
      <div className="flex gap-2 p-1 rounded-2xl bg-zinc-900/60 border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTool('loss')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTool === 'loss'
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          Convergence
        </button>
        <button
          onClick={() => setActiveTool('prompt')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTool === 'prompt'
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Prompt Architect
        </button>
        <button
          onClick={() => setActiveTool('tensor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTool === 'tensor'
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tenseurs
        </button>
      </div>

      {/* TOOL 1: CONVERGENCE & LOSS PLAYGROUND */}
      {activeTool === 'loss' && (
        <div className="space-y-5 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-orange-500/25 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                Simulateur de Descente de Gradient (SGD / AdamW)
              </h3>
              <p className="text-xs text-zinc-400">
                Visualise l'impact du taux d'apprentissage sur la fonction de perte (Loss)
              </p>
            </div>
            <span className="text-xs font-mono text-orange-400 bg-orange-950/50 border border-orange-500/30 px-2 py-0.5 rounded-full">
              GPU TensorCore
            </span>
          </div>

          {/* METRIC SCORECARDS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-center">
              <span className="text-[11px] font-mono text-zinc-400">Époque</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {currentEpoch} / 12
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-center">
              <span className="text-[11px] font-mono text-zinc-400">Loss Cross-Entropy</span>
              <div className="text-xl font-bold font-mono text-orange-400 mt-0.5">
                {currentLoss}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-center">
              <span className="text-[11px] font-mono text-zinc-400">Précision Top-1</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {accuracy}%
              </div>
            </div>
          </div>

          {/* SIMULATED CONVERGENCE SVG GRAPH */}
          <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Courbe de convergence (Cross-Entropy Loss)</span>
              <span className="text-orange-400">Convergence optimale</span>
            </div>

            <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 pb-1 px-2 border-b border-l border-white/10 relative">
              {/* Background horizontal grid lines */}
              <div className="absolute inset-0 cyber-grid-orange opacity-20 pointer-events-none" />

              {/* Dynamic Bars representing loss decrease across epochs */}
              {Array.from({ length: 12 }).map((_, i) => {
                const epochNum = i + 1;
                const isPassed = epochNum <= currentEpoch;
                const heightPercent = Math.max(10, 100 - (epochNum * 7.5));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 z-10">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isPassed
                          ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                          : 'bg-zinc-800/60'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] font-mono text-zinc-400">{epochNum}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300">Taux d'apprentissage (Learning Rate) :</span>
              <span className="text-orange-400 font-bold">{learningRate}</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              disabled={isTraining}
              className="w-full accent-orange-500 bg-zinc-800 rounded-lg cursor-pointer h-2"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={startTrainingSim}
              disabled={isTraining || currentEpoch >= 12}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-white" />
              {isTraining ? 'Entraînement en cours...' : 'Lancer l\'entraînement'}
            </button>
            <button
              onClick={resetTrainingSim}
              className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOOL 2: PROMPT ARCHITECT */}
      {activeTool === 'prompt' && (
        <div className="space-y-5 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-orange-500/25 p-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Prompt Architect & Context Scaffolder
            </h3>
            <p className="text-xs text-zinc-400">
              Transforme des requêtes simples en prompts haute précision pour modèles de raisonnement (o3-mini, Gemini Pro)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-300">Prompt initial :</label>
            <textarea
              rows={3}
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500 font-sans"
            />
          </div>

          <button
            onClick={handleOptimizePrompt}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(249,115,22,0.4)] cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Scaffolder le Prompt avec Balises XML & Rôles
          </button>

          {optimizedPrompt && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-400 font-mono font-semibold">Prompt optimisé prêt pour l'API :</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-zinc-300 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {optimizedPrompt}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: TENSOR DIMENSIONS INSPECTOR */}
      {activeTool === 'tensor' && (
        <div className="space-y-5 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-orange-500/25 p-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Inspecteur Tensoriel Multi-Head Attention
            </h3>
            <p className="text-xs text-zinc-400">
              Vérification des dimensions de batch, sequence length et hidden dimension
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-orange-500/30 space-y-1">
              <span className="text-orange-400 font-bold">Query Tensor Q</span>
              <div className="text-white">[Batch: 16, Heads: 8, Seq: 512, D_k: 64]</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-1">
              <span className="text-amber-400 font-bold">Key Tensor Kᵀ</span>
              <div className="text-white">[Batch: 16, Heads: 8, D_k: 64, Seq: 512]</div>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-400 font-bold">Matrice d'Attention</span>
              <div className="text-white">[Batch: 16, Heads: 8, Seq: 512, Seq: 512]</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 text-xs text-zinc-300 leading-relaxed font-mono">
            <code>Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V</code>
            <p className="mt-2 text-zinc-400 font-sans">
              Le facteur d'échelle <code className="text-orange-400 font-mono">1 / √d_k</code> empêche le produit scalaire de grandir exponentiellement en haute dimension, évitant ainsi que les gradients de la fonction Softmax ne s'annulent.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
