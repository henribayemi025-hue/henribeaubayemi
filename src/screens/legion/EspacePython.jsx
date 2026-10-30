import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PleinEcran } from './parties/Vues';

// L'espace de code (Python, bibliothèques, terminal, agents) de Finjaro Learn,
// ouvert dans Léo pour toutes les entreprises : même compte, même éditeur.
export default function EspacePython() {
  const { t, i18n } = useTranslation();
  const naviguer = useNavigate();
  const retour = () => naviguer(-1);
  useEffect(() => {
    const ecoute = (e) => { if (e.origin === window.location.origin && e.data === 'finjaro:fermer') retour(); };
    window.addEventListener('message', ecoute);
    return () => window.removeEventListener('message', ecoute);
  });
  const lg = String(i18n.language).startsWith('fr') ? 'fr' : 'en';
  return (
    <div className="legion-app">
      <PleinEcran titre={t('legion.atelier.espacePython')} onFermer={retour} t={t}>
        <iframe title={t('legion.atelier.espacePython')} src={`/learn/?lang=${lg}&integre=1#/espace?integre=1`} className="h-full w-full border-0" allow="clipboard-read; clipboard-write" />
      </PleinEcran>
    </div>
  );
}
