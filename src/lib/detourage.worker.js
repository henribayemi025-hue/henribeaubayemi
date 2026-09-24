// « Retirer le fond » — le calcul, dans un Web Worker pour que l'écran de la
// vendeuse ne gèle pas pendant le détourage.
//
// Tout est servi par finjaro.net (même origine, fichiers à empreinte cachés
// pour un an) — voir docs/plans/2026-09-24-retirer-le-fond.md:
// - le modèle u2netp (U²-Net, Apache-2.0, 4,6 Mo), rangé dans src/assets;
// - le moteur ONNX Runtime Web (MIT) et son fichier WebAssembly.
// Ce fichier n'est chargé qu'au premier appui sur « Retirer le fond »: rien de
// tout ça n'entre dans le paquet principal.
import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import modelUrl from '../assets/modeles/u2netp.onnx?url';

ort.env.wasm.wasmPaths = { wasm: wasmUrl };
// Plusieurs fils demandent une page « isolée » (en-têtes COOP/COEP) que
// finjaro.net n'a pas; un seul fil évite une tentative inutile.
ort.env.wasm.numThreads = 1;

let session = null;

function getSession() {
  if (!session) {
    session = ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] }).catch((err) => {
      session = null; // un réseau coupé ne doit pas bloquer l'essai suivant
      throw err;
    });
  }
  return session;
}

// La sortie de u2netp est une carte de probabilité 320×320. Comme rembg, on
// la ramène entre 0 et 1, puis on écrase les extrêmes: un léger voile
// résiduel sur le fond se verrait comme une tache sur un fond crème uni.
function versMasque(data) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const etendue = max - min || 1;
  const masque = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - min) / etendue;
    masque[i] = v < 0.05 ? 0 : v > 0.95 ? 1 : (v - 0.05) / 0.9;
  }
  return masque;
}

self.onmessage = async (e) => {
  const { id, type, input, taille } = e.data;
  try {
    const s = await getSession();
    if (type === 'preparer') {
      self.postMessage({ id, ok: true });
      return;
    }
    const tensor = new ort.Tensor('float32', input, [1, 3, taille, taille]);
    const sortie = await s.run({ [s.inputNames[0]]: tensor });
    // La première sortie (d0) est la carte fusionnée, la plus fine.
    const masque = versMasque(sortie[s.outputNames[0]].data);
    self.postMessage({ id, ok: true, masque }, [masque.buffer]);
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message || err) });
  }
};
