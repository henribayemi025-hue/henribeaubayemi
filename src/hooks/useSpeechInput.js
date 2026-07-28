import { useCallback, useEffect, useRef, useState } from 'react';

// Dictée vocale pour la barre de saisie de Finou, via l'API Web Speech du
// navigateur (aucun service tiers, aucun audio envoyé à un serveur: la
// reconnaissance se fait par le moteur du système).
//
// Support réel, à connaître avant de promettre la fonctionnalité:
//   - iOS Safari (à partir de 14.5) et Chrome: OK, sous le préfixe `webkit`.
//   - Firefox: pas de support -> `supported` vaut false et le bouton micro
//     n'est tout simplement pas rendu, plutôt qu'un bouton qui ne fait rien.
// Ce n'est PAS un mot-clé de réveil type « Hey Siri »: un navigateur web ne
// peut pas écouter en permanence en arrière-plan. L'utilisateur appuie sur le
// micro, parle, et le texte arrive dans le champ.
export function useSpeechInput({ lang = 'fr-FR', onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef(null);
  // Garde la dernière callback sans relancer l'effet à chaque rendu.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SpeechRecognition;

  useEffect(() => {
    if (!supported) return undefined;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;   // s'arrête sur une pause: on veut une phrase, pas un flux
    recognition.interimResults = true; // aperçu pendant qu'on parle

    recognition.onresult = (event) => {
      let finalText = '';
      let partial = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else partial += chunk;
      }
      setInterim(partial);
      if (finalText.trim()) {
        setInterim('');
        onResultRef.current?.(finalText.trim());
      }
    };

    recognition.onerror = () => {
      // Micro refusé, aucun son capté, réseau indisponible… Dans tous les cas
      // on retombe simplement sur la saisie clavier, sans message d'erreur
      // bloquant.
      setListening(false);
      setInterim('');
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* déjà arrêtée */ }
      recognitionRef.current = null;
    };
  }, [SpeechRecognition, supported, lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() lève si une session est déjà en cours — on ignore.
    }
  }, [listening]);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* rien en cours */ }
    setListening(false);
  }, []);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  return { supported, listening, interim, start, stop, toggle };
}
