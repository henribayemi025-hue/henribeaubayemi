import { Link } from 'react-router-dom';
import {
  IconHome, IconChartPie, IconPigMoney, IconRepeat,
  IconStack2, IconSparkles, IconUsersGroup, IconGridDots,
} from '@tabler/icons-react';

// La coque de « Mon argent » — une application à part entière.
//
// Beau, 22/09, devant la première version: « c'est quoi cette merde, ça doit
// être un truc à part entière comme Finjaro Accounting, je t'ai envoyé les
// photos même les couleurs ». Puis: « c'est une app à part entière comme
// Athlo, il doit avoir sa version ordi et téléphone comme les autres, ce
// n'est pas possible que je sois là et que je voie ça dans Finjaro avec
// Services et tout ».
//
// Il avait raison deux fois. J'avais posé son application DANS la place de
// marché: la barre latérale de Finjaro à gauche avec Accueil, Fin, Services,
// Messages, le crème, le terracotta, et un bouton large comme la page. Ce
// n'était pas son produit, c'était le mien avec son contenu dedans.
//
// Donc ici: aucune barre de la place de marché, aucun lien vers Services,
// aucune couleur « Terre & Or ». Une vraie coque, avec ses deux formes —
// barre du bas sur téléphone, colonne de gauche sur ordinateur, comme toute
// application qui se respecte.
//
// Les couleurs vivent dans `tailwind.config.js` sous `money.*`, séparées de
// « Terre & Or ». Les mélanger est exactement l'erreur d'avant.

const ONGLETS = [
  { cle: 'comptes', Icone: IconHome },
  { cle: 'budget', Icone: IconChartPie },
  { cle: 'epargne', Icone: IconPigMoney },
  { cle: 'njangi', Icone: IconRepeat },
  { cle: 'projets', Icone: IconStack2 },
  { cle: 'analyste', Icone: IconSparkles },
  { cle: 'espaces', Icone: IconUsersGroup },
];

function Marque({ t }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-card bg-gradient-to-br from-money-accent to-money-accent-soft text-body font-bold text-white">
        F
      </span>
      <span className="text-section font-semibold">{t('money.title')}</span>
    </div>
  );
}

export function MoneyShell({ onglet, setOnglet, prenom, t, children }) {
  return (
    // Le fond est posé ici et sur toute la hauteur: sinon le crème de la
    // place de marché dépasse sous le contenu.
    <div className="money-app min-h-screen bg-money-bg text-money-ink lg:flex">
      {/* ORDINATEUR — la colonne de gauche. Cachée sur téléphone. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-money-line px-3 py-5 lg:flex">
        <div className="px-2">
          <Marque t={t} />
        </div>

        <ul className="mt-6 flex-1 space-y-1">
          {ONGLETS.map(({ cle, Icone }) => {
            const actif = onglet === cle;
            return (
              <li key={cle}>
                <button
                  type="button"
                  onClick={() => setOnglet(cle)}
                  aria-current={actif ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-card px-3 py-2 text-body ${
                    actif
                      ? 'bg-money-accent/15 font-semibold text-money-accent'
                      : 'text-money-muted hover:bg-white/5'
                  }`}
                >
                  <Icone size={20} stroke={actif ? 2 : 1.6} />
                  <span className="truncate">{t(`money.tab.${cle}`)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Le seul lien vers le reste: le sélecteur d'applications. Pas la
            barre de la place de marché, pas Services. */}
        <Link
          to="/apps"
          className="flex items-center gap-3 rounded-card px-3 py-2 text-caption text-money-muted hover:bg-white/5"
        >
          <IconGridDots size={18} />
          <span className="truncate">{t('apps.title')}</span>
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        {/* TÉLÉPHONE — l'entête. Sur ordinateur la marque est déjà à gauche. */}
        <header className="flex items-center justify-between px-4 pb-2 pt-4 lg:hidden">
          <Marque t={t} />
          {prenom && (
            <span className="max-w-[45%] truncate text-caption text-money-muted">
              {t('money.hello', { name: prenom })}
            </span>
          )}
        </header>

        {/* Sur ordinateur on laisse respirer, mais on ne laisse pas les
            cartes s'étirer sur 2 000 px: elles deviendraient illisibles. */}
        <main className="mx-auto w-full max-w-3xl pb-28 lg:pb-8 lg:pt-6">{children}</main>
      </div>

      {/* TÉLÉPHONE — la barre du bas, comme sur ses captures. Sept onglets
          tiennent à 390 px parce qu'ils n'ont qu'une icône et un mot court. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-money-line bg-money-bg/95 backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-app items-stretch justify-between px-1 py-1">
          {ONGLETS.map(({ cle, Icone }) => {
            const actif = onglet === cle;
            return (
              <li key={cle} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setOnglet(cle)}
                  aria-current={actif ? 'page' : undefined}
                  className={`flex w-full flex-col items-center gap-0.5 rounded-card px-0.5 py-1.5 ${
                    actif ? 'text-money-accent' : 'text-money-muted'
                  }`}
                >
                  <Icone size={20} stroke={actif ? 2 : 1.6} />
                  <span className="w-full truncate text-center text-[10px] leading-tight">
                    {t(`money.tab.${cle}`)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
