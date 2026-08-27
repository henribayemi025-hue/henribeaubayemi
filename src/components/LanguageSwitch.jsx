import { IconWorld } from '@tabler/icons-react';
import { useSettings } from '../hooks/useSettings';

// Choisir sa langue AVANT d'avoir un compte.
//
// Un vendeur anglophone est allé jusqu'à l'écran d'inscription et s'est
// arrêté là: « I have enter there everything is in French ». Le changement de
// langue existait pourtant — mais dans Profil > Paramètres, c'est-à-dire
// derrière le compte qu'il n'arrivait justement pas à créer. Beau: « La
// langue doit être choisie même à l'inscription ».
//
// Les deux libellés sont écrits CHACUN DANS SA PROPRE LANGUE et ne passent
// jamais par t(). « Anglais » ne veut rien dire pour qui ne lit pas le
// français, et c'est exactement la personne à qui ce bouton s'adresse.
const LANGUES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

export function LanguageSwitch({ className = '' }) {
  const { language, setLanguage } = useSettings();
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <IconWorld size={16} className="text-muted" aria-hidden="true" />
      {LANGUES.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          aria-pressed={language === l.code}
          onClick={() => setLanguage(l.code)}
          className={`chip ${language === l.code ? 'chip-active' : 'text-ink'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
