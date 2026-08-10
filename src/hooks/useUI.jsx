import { createContext, useContext, useState, useCallback } from 'react';

// Shared UI overlays: Finou Chou chat + the login/signup prompt gate.
const UICtx = createContext(null);

export function UIProvider({ children }) {
  const [finouOpen, setFinouOpen] = useState(false);
  // Question posée à Finia à l'ouverture. Sert à la visite guidée: on ouvre
  // l'assistante AVEC la question déjà envoyée, au lieu de laisser la personne
  // devant un champ vide en se demandant quoi écrire.
  const [finouSeed, setFinouSeed] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  // Tracks whether the buyer→vendor transition screen already ran this session.
  const [switchScreenShown, setSwitchScreenShown] = useState(false);

  const value = {
    finouOpen,
    openFinou: useCallback((seed) => { setFinouSeed(seed || null); setFinouOpen(true); }, []),
    closeFinou: useCallback(() => { setFinouOpen(false); setFinouSeed(null); }, []),
    finouSeed,
    consumeFinouSeed: useCallback(() => setFinouSeed(null), []),
    loginPrompt,
    requireLogin: useCallback(() => setLoginPrompt(true), []),
    closeLoginPrompt: useCallback(() => setLoginPrompt(false), []),
    switchScreenShown,
    markSwitchShown: useCallback(() => setSwitchScreenShown(true), []),
  };
  return <UICtx.Provider value={value}>{children}</UICtx.Provider>;
}

export function useUI() {
  const ctx = useContext(UICtx);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
