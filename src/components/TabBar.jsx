import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Barre d'onglets du bas, partagée acheteuse/vendeuse.
//
// L'ancienne version était une simple rangée « icône + texte » qui changeait
// juste de couleur: rien ne se détachait, la barre faisait plate et bon
// marché (« très laid », dixit Beau). Ici l'onglet actif reçoit une VRAIE
// pastille en fond (l'indicateur d'onglet façon Material 3 / Gmail), ce qui
// donne du relief sans ajouter de bruit, et reste dans la charte « Terre &
// Or » (teal-light sur blanc, jamais une couleur inventée).
//
// Détails qui font la différence:
// - `pb-[env(safe-area-inset-bottom)]`: sur iPhone, la barre ne se collait
//   pas au trait d'accueil, les libellés passaient dessous.
// - ombre douce vers le HAUT: la barre se détache du contenu qui défile
//   dessous, au lieu d'un simple filet gris.
// - la pastille s'anime en largeur au changement d'onglet.
export function TabBar({ items, badges = {} }) {
  const { t } = useTranslation();
  return (
    <nav className="flex items-stretch border-t border-hairline bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(23,27,38,0.05)] lg:hidden">
      {items.map((it) => (
        <NavLink
          key={it.key}
          to={it.to}
          end={it.end}
          className="flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 transition-transform duration-150 active:scale-95"
        >
          {({ isActive }) => {
            const Icon = isActive ? it.on : it.out;
            const badge = badges[it.key];
            return (
              <>
                <span
                  className={`relative flex h-8 items-center justify-center rounded-pill transition-all duration-200 ${
                    isActive ? 'w-14 bg-teal-light' : 'w-10 bg-transparent'
                  }`}
                >
                  <Icon size={22} className={`transition-colors duration-200 ${isActive ? 'text-teal' : 'text-muted'}`} />
                  {badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] leading-none transition-colors duration-200 ${isActive ? 'font-semibold text-teal' : 'text-muted'}`}>
                  {t(`nav.${it.key}`)}
                </span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}
