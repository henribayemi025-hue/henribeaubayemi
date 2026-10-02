import React, { useState } from 'react';
import { 
  X, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Cpu, 
  Terminal, 
  RotateCcw,
  Zap,
  Sliders,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson } from '../types';

interface LessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onCompleteLesson: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  isOpen,
  onClose,
  onCompleteLesson,
}) => {
  if (!isOpen) return null;

  // Interactive Neural Simulation State
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(-0.4);
  const [bias, setBias] = useState(0.2);
  const [activeTab, setActiveTab] = useState<'interactive' | 'code' | 'quiz'>('interactive');

  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Simulated code execution state
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);

  // Compute forward pass
  const x1 = 1.0;
  const x2 = 0.5;
  const z = Number((x1 * w1 + x2 * w2 + bias).toFixed(3));
  const reluOut = Number(Math.max(0, z).toFixed(3));

  const handleRunCode = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      setIsRunningCode(false);
      setCodeOutput(
`[Finjaro PyTorch Tensor Core v2.4]
Initializing CUDA device: NVIDIA H100 SXM5 80GB...
Model Architecture:
  (fc1): Linear(in_features=128, out_features=64, bias=True)
  (relu): ReLU()
  (fc2): Linear(in_features=64, out_features=10, bias=True)
Batch Tensor Size: torch.Size([32, 128])
Forward Pass Executed in 0.42ms.
Output Logits: tensor([[-0.142,  1.821, -0.443,  2.190,  0.012, ...]], device='cuda:0')
Loss (CrossEntropy): 0.3842 | Accuracy: 94.2%
Status: ⚡ Forward pass réussi avec convergence optimale.`
      );
    }, 600);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);

    if (selectedOption === lesson.quizQuestion.correctIndex) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#ea580c', '#fbbf24', '#ffffff'],
        });
      } catch (e) {
        // fallback silently
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* MODAL WRAPPER */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-orange-500/40 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Subtle orange glow orb */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* TOP BAR OF MODAL */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Zap className="w-4 h-4 fill-orange-500 text-orange-400" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-orange-400 font-semibold tracking-wider uppercase">
                {lesson.topic} · Leçon {lesson.lessonNumber}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Outfit']">
                {lesson.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer la leçon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-white/10 bg-zinc-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('interactive')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'interactive'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Simulateur Neuronal
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Code PyTorch GPU
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Quiz & Validation (+250 XP)
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* TAB 1: INTERACTIVE NEURON SIMULATOR */}
          {activeTab === 'interactive' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Calcul en direct : Perceptron & Activation ReLU
                  </span>
                  <span className="text-xs font-mono text-orange-400">
                    z = (x₁·w₁) + (x₂·w₂) + b
                  </span>
                </div>

                {/* Mathematical Formula Preview */}
                <div className="flex items-center justify-around py-3 px-2 bg-zinc-900/60 rounded-xl border border-white/5 text-center">
                  <div>
                    <div className="text-[11px] text-zinc-400 font-mono">Entrée z</div>
                    <div className={`text-base font-bold font-mono ${z >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {z}
                    </div>
                  </div>
                  <div className="text-zinc-400 text-lg">→</div>
                  <div>
                    <div className="text-[11px] text-zinc-400 font-mono">ReLU(z)</div>
                    <div className="text-xl font-bold font-mono text-orange-400">
                      {reluOut}
                    </div>
                  </div>
                  <div className="text-zinc-400 text-lg">→</div>
                  <div>
                    <div className="text-[11px] text-zinc-400 font-mono">État Neurone</div>
                    <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      reluOut > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {reluOut > 0 ? 'ACTIF (Passant)' : 'INACTIF (0)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">Poids synaptique w₁ (x₁ = 1.0)</span>
                    <span className="text-orange-400 font-bold">{w1.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={w1}
                    onChange={(e) => setW1(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 bg-zinc-800 rounded-lg cursor-pointer h-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">Poids synaptique w₂ (x₂ = 0.5)</span>
                    <span className="text-orange-400 font-bold">{w2.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={w2}
                    onChange={(e) => setW2(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 bg-zinc-800 rounded-lg cursor-pointer h-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">Biais neuronal b</span>
                    <span className="text-orange-400 font-bold">{bias.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={bias}
                    onChange={(e) => setBias(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 bg-zinc-800 rounded-lg cursor-pointer h-2"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/20 text-xs text-orange-200/90 leading-relaxed">
                💡 <strong>Intuition IA :</strong> La fonction ReLU annule toute valeur négative (<code className="bg-black/40 px-1 py-0.5 rounded text-orange-300">max(0, z)</code>), ce qui introduit la non-linéarité indispensable pour que le réseau apprenne des frontières de décision complexes.
              </div>
            </div>
          )}

          {/* TAB 2: CODE PYTORCH */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-zinc-400 text-[11px] ml-2">model_nn.py</span>
                  </div>
                  <span className="text-orange-400 text-[11px]">Python 3.11 · PyTorch 2.4</span>
                </div>
                
                <pre className="p-4 text-zinc-300 leading-relaxed overflow-x-auto selection:bg-orange-500/30">
                  {lesson.codeSnippet}
                </pre>
              </div>

              <button
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isRunningCode ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    Compilation & Exécution CUDA...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Exécuter sur GPU Virtuel (Simulation)
                  </>
                )}
              </button>

              {codeOutput && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed animate-in fade-in">
                  {codeOutput}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUIZ & VALIDATION */}
          {activeTab === 'quiz' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                  {lesson.quizQuestion.question}
                </h4>

                <div className="space-y-2">
                  {lesson.quizQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === lesson.quizQuestion.correctIndex;

                    let optionStyle = 'bg-zinc-950/80 border-white/10 hover:border-orange-500/50 text-zinc-300';
                    if (isAnswered) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                      } else if (isSelected) {
                        optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-orange-950/40 border-orange-500 text-orange-200';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => !isAnswered && setSelectedOption(idx)}
                        disabled={isAnswered}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center justify-between cursor-pointer ${optionStyle}`}
                      >
                        <span>{option}</span>
                        {isAnswered && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isAnswered ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedOption === null}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-sm shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all cursor-pointer"
                >
                  Valider la réponse
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-300 leading-relaxed">
                    <strong>Explication :</strong> {lesson.quizQuestion.explanation}
                  </div>

                  <button
                    onClick={() => {
                      onCompleteLesson();
                      onClose();
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Valider la leçon (+250 XP & série maintenue !)
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-zinc-950/80 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>Finjaro Engine · Deep Learning Core</span>
          <span className="font-mono text-orange-400 font-semibold">12 / 25 min complétées</span>
        </div>

      </div>

    </div>
  );
};
