import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Feuille d'actions qui monte du bas, comme l'appui long de WhatsApp.
// Volontairement sans titre ni croix: la liste d'actions se suffit, et une
// barre de titre ferait "boîte de dialogue" là où on attend un menu.
export function ActionSheet({ open, onClose, actions = [] }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  // Rendu sur <body> plutôt que dans l'arbre de la page: sinon le
  // `z-index` de la feuille ne se compare qu'à ses voisines, à l'intérieur
  // du contexte d'empilement créé par l'écran — et la bannière
  // « installer l'app » comme la bulle Finia, elles posées à la racine,
  // passaient PAR-DESSUS la fenêtre ouverte (constaté le 10/09 en ouvrant
  // le sélecteur d'applications).
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button className="animate-fade-in absolute inset-0 bg-black/40" aria-label="Fermer" onClick={onClose} />
      <div
        className="animate-slide-up relative z-10 w-full max-w-app overflow-hidden rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] sm:animate-fade-in sm:rounded-2xl"
      >
        <div className="mx-auto my-2.5 h-1 w-9 rounded-full bg-hairline sm:hidden" />
        {actions.filter(Boolean).map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => {
              onClose();
              a.onClick();
            }}
            className={`flex w-full items-center gap-3 border-t border-hairline px-5 py-3.5 text-left text-body transition-colors first:border-t-0 hover:bg-base ${
              a.danger ? 'text-danger' : 'text-ink'
            }`}
          >
            <a.icon size={20} className={a.danger ? 'text-danger' : 'text-muted'} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  , document.body);
}
