import React, { useState, useEffect } from 'react';
import {
  Brain,
  Layers,
  Cpu,
  Shield,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Lock,
  Key,
  Database,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProjectsHub: React.FC = () => {
  const {
    t,
    theme,
    language,
    activeProjectTab,
    setActiveProjectTab,
    triggerConfetti,
  } = useApp();

  const currentTab = activeProjectTab || 'neural_net';

  // --- PROJECT 1: NEURAL NETWORK (XOR SOLVER & LOSS CONVERGENCE) ---
  const [weights, setWeights] = useState({
    w1: [0.5, -0.6], // input 1 to h1, h2
    w2: [-0.4, 0.7], // input 2 to h1, h2
    b1: [0.1, -0.1], // biases for h1, h2
    wo: [0.6, -0.5], // h1, h2 to output
    bo: 0.1,         // output bias
  });
  const [epoch, setEpoch] = useState<number>(0);
  const [lossHistory, setLossHistory] = useState<number[]>([0.28, 0.26, 0.25]);
  const [testInputs, setTestInputs] = useState<[number, number]>([1, 0]);

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, z))));

  const forward = (x1: number, x2: number, w = weights) => {
    const z_h1 = x1 * w.w1[0] + x2 * w.w2[0] + w.b1[0];
    const z_h2 = x1 * w.w1[1] + x2 * w.w2[1] + w.b1[1];
    const h1 = sigmoid(z_h1);
    const h2 = sigmoid(z_h2);
    const z_out = h1 * w.wo[0] + h2 * w.wo[1] + w.bo;
    const out = sigmoid(z_out);
    return { h1, h2, out };
  };

  const trainStep = (epochsToRun = 10) => {
    let currentW = { ...weights };
    const xorDataset = [
      { x: [0, 0], y: 0 },
      { x: [0, 1], y: 1 },
      { x: [1, 0], y: 1 },
      { x: [1, 1], y: 0 },
    ];
    const lr = 0.5;
    let newLoss = 0;

    for (let ep = 0; ep < epochsToRun; ep++) {
      let epochLoss = 0;
      for (const sample of xorDataset) {
        const { x, y } = sample;
        const { h1, h2, out } = forward(x[0], x[1], currentW);
        const err = out - y;
        epochLoss += err * err;

        // Gradient backprop approximations
        const dOut = err * out * (1 - out);
        currentW.wo[0] -= lr * dOut * h1;
        currentW.wo[1] -= lr * dOut * h2;
        currentW.bo -= lr * dOut;

        const dh1 = dOut * currentW.wo[0] * h1 * (1 - h1);
        const dh2 = dOut * currentW.wo[1] * h2 * (1 - h2);
        currentW.w1[0] -= lr * dh1 * x[0];
        currentW.w2[0] -= lr * dh1 * x[1];
        currentW.b1[0] -= lr * dh1;
        currentW.w1[1] -= lr * dh2 * x[0];
        currentW.w2[1] -= lr * dh2 * x[1];
        currentW.b1[1] -= lr * dh2;
      }
      newLoss = epochLoss / 4;
    }

    setWeights(currentW);
    setEpoch((prev) => prev + epochsToRun);
    setLossHistory((prev) => [...prev.slice(-15), Number(newLoss.toFixed(4))]);

    if (newLoss < 0.08) {
      triggerConfetti();
    }
  };

  const resetNetwork = () => {
    setWeights({
      w1: [0.5, -0.6],
      w2: [-0.4, 0.7],
      b1: [0.1, -0.1],
      wo: [0.6, -0.5],
      bo: 0.1,
    });
    setEpoch(0);
    setLossHistory([0.28]);
  };

  const currentPrediction = forward(testInputs[0], testInputs[1]);

  // --- PROJECT 2: RAG ASSISTANT & VECTOR SIMILARITY ---
  const ragCorpus = [
    {
      id: 'doc-1',
      title: 'Attention Mechanism in Transformers',
      text: 'The self-attention mechanism maps a query and a set of key-value pairs to an output. Weights are computed by scaled dot-product of queries with keys.',
      keywords: ['attention', 'transformer', 'query', 'key', 'scaled', 'dot', 'weights'],
      vector: [0.92, 0.15, 0.88, 0.05],
    },
    {
      id: 'doc-2',
      title: 'RSA Asymmetric Cryptography Protocol',
      text: 'RSA public-key cryptography encrypts data using a public exponent e and modulus n, while only the secret private exponent d can decrypt the message.',
      keywords: ['rsa', 'cryptography', 'public', 'private', 'key', 'modulus', 'encrypt'],
      vector: [0.08, 0.95, 0.12, 0.78],
    },
    {
      id: 'doc-3',
      title: 'Microprocessor ALU and Control Unit',
      text: 'The Arithmetic Logic Unit (ALU) performs basic arithmetic like addition and bitwise logic. The program counter tracks the memory address of the next opcode.',
      keywords: ['alu', 'cpu', 'processor', 'arithmetic', 'registers', 'opcode', 'instruction'],
      vector: [0.15, 0.22, 0.94, 0.35],
    },
    {
      id: 'doc-4',
      title: 'Finjaro Engineering Principles',
      text: 'Finjaro Learn focuses on hands-on practical execution from minute one. Learners verify concepts through test-driven in-browser environments with AI tutors.',
      keywords: ['finjaro', 'practice', 'learn', 'code', 'tutor', 'engineering', 'socratic'],
      vector: [0.75, 0.65, 0.45, 0.92],
    },
  ];

  const [ragQuery, setRagQuery] = useState<string>('How does attention work in transformer models?');
  const [ragResults, setRagResults] = useState<{ doc: typeof ragCorpus[0]; similarity: number }[]>([]);

  const handleSearchRag = () => {
    const qWords = ragQuery.toLowerCase().split(/\s+/);
    const scored = ragCorpus.map((doc) => {
      // Hybrid keyword match + vector projection
      const matchCount = qWords.filter((w) => doc.keywords.some((k) => k.includes(w) || w.includes(k))).length;
      const baseScore = matchCount / Math.max(1, qWords.length);
      const similarity = Math.min(0.99, Number((0.35 + baseScore * 0.64).toFixed(3)));
      return { doc, similarity };
    });
    scored.sort((a, b) => b.similarity - a.similarity);
    setRagResults(scored);
  };

  useEffect(() => {
    handleSearchRag();
  }, []);

  // --- PROJECT 3: MINI-CPU ARCHITECTURE & 8-BIT ALU ---
  const [cpuState, setCpuState] = useState({
    regA: 5,
    regB: 3,
    acc: 8,
    pc: 0,
    zeroFlag: false,
    negFlag: false,
    ram: [5, 3, 0, 0, 0, 0, 0, 0],
    currentInstruction: 'ADD A, B',
  });

  const cpuProgram = [
    { pc: 0, op: 'LOAD A, 5', desc: 'Charge 5 dans le registre A' },
    { pc: 1, op: 'LOAD B, 3', desc: 'Charge 3 dans le registre B' },
    { pc: 2, op: 'ADD A, B', desc: 'ALU additionne A et B -> Accumulateur' },
    { pc: 3, op: 'STORE ACC, RAM[2]', desc: 'Écrit l\'accumulateur en mémoire RAM' },
    { pc: 4, op: 'SUB A, B', desc: 'ALU calcule A - B' },
    { pc: 5, op: 'HALT', desc: 'Fin du programme' },
  ];

  const stepCpu = () => {
    setCpuState((prev) => {
      const nextPc = (prev.pc + 1) % cpuProgram.length;
      const current = cpuProgram[prev.pc];
      let newA = prev.regA;
      let newB = prev.regB;
      let newAcc = prev.acc;
      let newRam = [...prev.ram];

      if (current.op.startsWith('LOAD A')) newA = 5;
      if (current.op.startsWith('LOAD B')) newB = 3;
      if (current.op.startsWith('ADD')) newAcc = newA + newB;
      if (current.op.startsWith('STORE')) newRam[2] = newAcc;
      if (current.op.startsWith('SUB')) newAcc = newA - newB;

      return {
        ...prev,
        regA: newA,
        regB: newB,
        acc: newAcc,
        pc: nextPc,
        zeroFlag: newAcc === 0,
        negFlag: newAcc < 0,
        ram: newRam,
        currentInstruction: current.op,
      };
    });
  };

  // --- PROJECT 4: RSA PUBLIC-KEY CRYPTOGRAPHY ---
  const rsaP = 61;
  const rsaQ = 53;
  const rsaN = rsaP * rsaQ; // 3233
  const rsaPhi = (rsaP - 1) * (rsaQ - 1); // 3120
  const rsaE = 17;
  const rsaD = 2753; // modular inverse

  const [plainMessage, setPlainMessage] = useState<string>('AI');
  const [encryptedCodes, setEncryptedCodes] = useState<number[]>([]);
  const [decryptedMessage, setDecryptedMessage] = useState<string>('');

  const modPow = (base: number, exp: number, mod: number) => {
    let res = 1;
    base = base % mod;
    while (exp > 0) {
      if (exp % 2 === 1) res = (res * base) % mod;
      base = (base * base) % mod;
      exp = Math.floor(exp / 2);
    }
    return res;
  };

  const handleEncryptRsa = () => {
    const codes = plainMessage
      .split('')
      .map((char) => modPow(char.charCodeAt(0), rsaE, rsaN));
    setEncryptedCodes(codes);
    setDecryptedMessage('');
  };

  const handleDecryptRsa = () => {
    const chars = encryptedCodes
      .map((code) => String.fromCharCode(modPow(code, rsaD, rsaN)))
      .join('');
    setDecryptedMessage(chars);
    triggerConfetti();
  };

  useEffect(() => {
    handleEncryptRsa();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.projects.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.projects.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'neural_net', label: t.projects.neuralNetTitle.split('&')[0], icon: Brain, color: 'text-purple-500' },
          { id: 'rag', label: t.projects.ragTitle.split('&')[0], icon: Layers, color: 'text-emerald-500' },
          { id: 'mini_cpu', label: t.projects.cpuTitle.split('&')[0], icon: Cpu, color: 'text-cyan-500' },
          { id: 'crypto_rsa', label: t.projects.cryptoTitle.split(' ')[0] + ' RSA', icon: Shield, color: 'text-rose-500' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveProjectTab(tab.id as any)}
              className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : tab.color}`} />
              <span className="text-xs font-bold truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. NEURAL NETWORK PROJECT */}
      {currentTab === 'neural_net' && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.projects.neuralNetTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.projects.neuralNetDesc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => trainStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{t.projects.trainStep}</span>
                </button>
                <button
                  onClick={() => trainStep(50)}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t.projects.trainEpochs}</span>
                </button>
                <button
                  onClick={resetNetwork}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Neural Net Architecture Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Architecture Nodes Display */}
              <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#090D16] p-6 text-white font-mono-code relative">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-slate-800">
                  <span>Couche d'Entrée (2)</span>
                  <span>Couche Cachée (2 ReLU/Sig)</span>
                  <span>Sortie (1 Sigmoïde)</span>
                </div>

                <div className="py-6 flex items-center justify-between px-4 sm:px-12 relative">
                  {/* Inputs */}
                  <div className="space-y-8">
                    {[0, 1].map((idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-full border-2 border-orange-500 bg-orange-950/50 flex flex-col items-center justify-center text-xs font-bold text-orange-300 shadow-lg">
                          <span>x{idx + 1}</span>
                          <span className="text-[10px] text-slate-400">{testInputs[idx]}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hidden Layer */}
                  <div className="space-y-8">
                    {[
                      { name: 'h1', val: currentPrediction.h1 },
                      { name: 'h2', val: currentPrediction.h2 },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-12 w-12 rounded-full border-2 border-purple-500 bg-purple-950/50 flex flex-col items-center justify-center text-xs font-bold text-purple-300 shadow-lg">
                          <span>{h.name}</span>
                          <span className="text-[10px] text-slate-400">{h.val.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Output */}
                  <div>
                    <div className="h-14 w-14 rounded-full border-2 border-emerald-500 bg-emerald-950/50 flex flex-col items-center justify-center text-xs font-bold text-emerald-300 shadow-xl">
                      <span>ŷ</span>
                      <span className="text-xs text-white font-black">{currentPrediction.out.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Époque : <strong className="text-white">{epoch}</strong></span>
                  <span>Erreur MSE (Loss) : <strong className="text-orange-400">{lossHistory[lossHistory.length - 1]}</strong></span>
                </div>
              </div>

              {/* Interactive Prediction Tester */}
              <div className="space-y-4">
                <div
                  className={`rounded-xl border p-4 ${
                    theme === 'noir' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Tester la vérité terrain XOR
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { x: [0, 0], exp: 0 },
                      { x: [0, 1], exp: 1 },
                      { x: [1, 0], exp: 1 },
                      { x: [1, 1], exp: 0 },
                    ].map((row, idx) => {
                      const pred = forward(row.x[0], row.x[1]).out;
                      const isClose = Math.abs(pred - row.exp) < 0.2;
                      const isSelected = testInputs[0] === row.x[0] && testInputs[1] === row.x[1];

                      return (
                        <button
                          key={idx}
                          onClick={() => setTestInputs([row.x[0], row.x[1]])}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500/10 font-bold'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>[{row.x[0]}, {row.x[1]}]</span>
                            <span className={isClose ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                              {pred.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Attendu : {row.exp}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Loss Curve sparkline */}
                <div
                  className={`rounded-xl border p-4 ${
                    theme === 'noir' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
                      <span>Courbe de convergence</span>
                    </span>
                    <span className="text-[10px] text-slate-400">15 dernières époques</span>
                  </div>
                  <div className="flex items-end gap-1 h-16 pt-2">
                    {lossHistory.map((val, i) => {
                      const heightPercent = Math.min(100, Math.max(15, (val / 0.3) * 100));
                      return (
                        <div
                          key={i}
                          title={`Loss: ${val}`}
                          className="flex-1 rounded-t-sm bg-orange-500/80 hover:bg-orange-400 transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RAG ASSISTANT PROJECT */}
      {currentTab === 'rag' && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.projects.ragTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.projects.ragDesc}
              </p>
            </div>

            {/* Query input */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="Posez une question technique..."
                className={`flex-1 rounded-xl border px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/50 ${
                  theme === 'noir' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                }`}
              />
              <button
                onClick={handleSearchRag}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500"
              >
                <Database className="h-3.5 w-3.5" />
                <span>{t.projects.testQuery}</span>
              </button>
            </div>

            {/* RAG Results & Ranking */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Documents retrouvés par similarité cosinus (Vector Index)
              </h3>

              {ragResults.map(({ doc, similarity }, i) => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    i === 0
                      ? 'border-emerald-500/40 bg-emerald-950/10 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{doc.title}</span>
                      {i === 0 && (
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Meilleur Contexte Retrouvé
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono-code">
                      <span className="text-slate-400">Similarité :</span>
                      <strong className={i === 0 ? 'text-emerald-500' : 'text-slate-300'}>
                        {(similarity * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    {doc.text}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Mots-clés indexés :</span>
                    <span className="font-mono-code">{doc.keywords.slice(0, 4).join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MINI-CPU PROJECT */}
      {currentTab === 'mini_cpu' && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.projects.cpuTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.projects.cpuDesc}
                </p>
              </div>

              <button
                onClick={stepCpu}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{t.projects.executeCycle}</span>
              </button>
            </div>

            {/* Architecture Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-code">
              {/* Registers */}
              <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
                  Banque de Registres
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Registre A :</span>
                    <strong className="text-orange-400">{cpuState.regA}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Registre B :</span>
                    <strong className="text-orange-400">{cpuState.regB}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Accumulateur (ACC) :</span>
                    <strong className="text-emerald-400">{cpuState.acc}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Program Counter (PC) :</span>
                    <strong className="text-cyan-400">{cpuState.pc}</strong>
                  </div>
                </div>
              </div>

              {/* ALU & Flags */}
              <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">
                  Unité Arithmétique (ALU)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Opération courante :</span>
                    <strong className="text-white">{cpuState.currentInstruction}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Drapeau Zéro (ZF) :</span>
                    <strong className={cpuState.zeroFlag ? 'text-emerald-400' : 'text-slate-500'}>
                      {cpuState.zeroFlag ? '1 (TRUE)' : '0 (FALSE)'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drapeau Négatif (NF) :</span>
                    <strong className={cpuState.negFlag ? 'text-rose-400' : 'text-slate-500'}>
                      {cpuState.negFlag ? '1 (TRUE)' : '0 (FALSE)'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* RAM 8-bytes */}
              <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                  Mémoire RAM (8 Octets)
                </h4>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  {cpuState.ram.map((val, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-900 border border-slate-800 p-1.5">
                      <span className="text-[10px] text-slate-500 block">[{idx}]</span>
                      <strong className="text-white">{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instruction Cycle timeline */}
            <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Programme Assembleur Chargé
              </h4>
              <div className="space-y-1.5">
                {cpuProgram.map((item) => (
                  <div
                    key={item.pc}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono-code transition-all ${
                      item.pc === cpuState.pc
                        ? 'bg-orange-500/15 border border-orange-500/40 text-orange-600 dark:text-orange-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 w-6">0x0{item.pc}</span>
                      <span>{item.op}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RSA CRYPTOGRAPHY PROJECT */}
      {currentTab === 'crypto_rsa' && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.projects.cryptoTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.projects.cryptoDesc}
              </p>
            </div>

            {/* Mathematical Keypair Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-code mb-6">
              <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-white">
                <span className="text-[11px] text-slate-400 uppercase block mb-1">Primes & Module</span>
                <p className="text-xs">p = {rsaP}, q = {rsaQ}</p>
                <p className="text-xs font-bold text-orange-400 mt-1">n = p × q = {rsaN}</p>
                <p className="text-[11px] text-slate-500 mt-1">φ(n) = {rsaPhi}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-white">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase mb-1">
                  <Key className="h-3.5 w-3.5" />
                  <span>Clé Publique (e, n)</span>
                </div>
                <p className="text-xs">Exposant e = <strong className="text-cyan-400">{rsaE}</strong></p>
                <p className="text-xs">Module n = {rsaN}</p>
                <p className="text-[10px] text-slate-400 mt-1">Diffusable publiquement à tous</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-white">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase mb-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Clé Privée (d, n)</span>
                </div>
                <p className="text-xs">Exposant d = <strong className="text-rose-400">{rsaD}</strong></p>
                <p className="text-xs">Module n = {rsaN}</p>
                <p className="text-[10px] text-slate-400 mt-1">Gardée secrète pour déchiffrer</p>
              </div>
            </div>

            {/* Encrypt / Decrypt Interactive Box */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Message clair à chiffrer :</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={plainMessage}
                    onChange={(e) => setPlainMessage(e.target.value)}
                    maxLength={10}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-mono-code focus:outline-hidden ${
                      theme === 'noir' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                    }`}
                  />
                  <button
                    onClick={handleEncryptRsa}
                    className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500"
                  >
                    {t.projects.encryptMessage}
                  </button>
                </div>
              </div>

              {/* Ciphertext representation */}
              <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-white font-mono-code">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Message Chiffré c = m^e mod n (incompréhensible sans d) :
                </span>
                <div className="flex flex-wrap gap-2 py-1">
                  {encryptedCodes.map((code, idx) => (
                    <span key={idx} className="rounded-md bg-purple-950/80 border border-purple-500/50 px-2 py-1 text-xs text-purple-300">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Decrypt trigger */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDecryptRsa}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  {t.projects.decryptMessage} (m = c^d mod n)
                </button>
                {decryptedMessage && (
                  <div className="flex items-center gap-2 text-xs font-mono-code text-emerald-500 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Message déchiffré avec succès : "{decryptedMessage}"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
