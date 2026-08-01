import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Barre d'onglets FLOTTANTE, partagée acheteuse/vendeuse.
//
// Reprend la structure demandée par Beau (capture de référence): une barre
// détachée du bord de l'écran, en pastille arrondie translucide, où l'onglet
// actif devient une pastille blanche pleine avec son libellé À CÔTÉ de
// l'icône — les autres onglets ne montrent que leur icône. C'est ce qui donne
// le côté « app soignée » qu'une rangée d'icônes collée en bas n'aura jamais.
//
// La barre SURVOLE le contenu (position absolue + flou d'arrière-plan): le
// catalogue défile dessous et transparaît, exactement comme sur la capture.
// C'est pour ça que <main> reçoit une marge basse dans les layouts — sans
// elle, le dernier élément de chaque écran passerait sous la barre.
//
// Couleur par onglet (palette vintage « Terre & Or » déjà utilisée pour les
// dégradés de catégories et les avatars de boutiques — rien d'inventé):
// terracotta, prune, vert vintage, moutarde, bronze.
export const TAB_COLORS = {
  home: '#C25E38',
  fin: '#7C5295',
  services: '#2F6D62',
  messages: '#B8860B',
  profile: '#8C6A3D',
  dashboard: '#C25E38',
  products: '#2F6D62',
  orders: '#B8860B',
  shop: '#8C6A3D',
};

// Hauteur réservée sous le contenu pour que rien ne finisse caché derrière la
// barre flottante. Exportée pour rester synchronisée avec les layouts.
export const TAB_BAR_SPACE = 'pb-[96px] lg:pb-0';

export function TabBar({ items, badges = {} }) {
  const { t } = useTranslation();
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] lg:hidden">
      <div className="pointer-events-auto flex items-center gap-1 rounded-pill bg-white/75 p-1.5 shadow-[0_10px_30px_rgba(23,27,38,0.18)] ring-1 ring-black/5 backdrop-blur-xl">
        {items.map((it) => (
          <NavLink
            key={it.key}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `relative flex min-w-0 items-center justify-center gap-1.5 rounded-pill py-2.5 transition-all duration-200 ${
                isActive ? 'flex-[1.7] bg-white shadow-sm' : 'flex-1 active:scale-90'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = isActive ? it.on : it.out;
              const color = TAB_COLORS[it.key];
              const badge = badges[it.key];
              return (
                <>
                  <span className="relative shrink-0">
                    <Icon size={22} stroke={2.2} color={isActive ? color : '#6B6B6B'} />
                    {badge > 0 && (
                      <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  {/* Le libellé n'apparaît QUE sur l'onglet actif — c'est ce
                      qui laisse la place aux autres de respirer au lieu de
                      cinq colonnes de texte serrées. */}
                  {isActive && (
                    <span className="truncate text-[12px] font-semibold" style={{ color }}>
                      {t(`nav.${it.key}`)}
                    </span>
                  )}
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
