import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBanner } from '../../components/AnnouncementBanner';
import { BuyerNav } from '../../components/BuyerNav';
import { BuyerSidebarNav } from '../../components/BuyerSidebarNav';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { FinouChou } from '../../components/FinouChou';
import { LoginPrompt } from '../../components/LoginPrompt';
import { NameGate } from '../../components/NameGate';
import { WelcomeTour } from '../../components/WelcomeTour';
import { SuspendedNotice } from '../../components/SuspendedNotice';
import CartDrawer from '../../components/CartDrawer';
import { useAuth } from '../../hooks/useAuth';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { useScrollRestore } from '../../hooks/useScrollRestore';

// Mobile (unchanged): fixed full-bleed app-shell (TikTok-style), header +
// bottom nav stay put, only <main> scrolls; --app-height keeps the keyboard
// from pushing the shell around.
// Desktop (lg+): a real website layout instead of the mobile shell just
// centered on grey — a persistent left sidebar (BuyerSidebarNav) + the
// content column filling the rest of the width, not capped at 480px.
export function BuyerLayout() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  useViewportHeight();
  // La barre principale est un <main> qui défile — la position de scroll
  // vit sur cet élément, pas sur document. Le hook restaure la place quand
  // on revient en arrière (voir hooks/useScrollRestore.js).
  const mainRef = useRef(null);
  useScrollRestore(mainRef);
  if (profile?.is_suspended) return <SuspendedNotice />;
  return (
    <div className="lg:flex lg:h-dvh lg:bg-[#FAF6F0]">
      <BuyerSidebarNav />
      <div
        className="fixed left-0 right-0 top-0 mx-auto flex w-full max-w-app flex-col overflow-hidden bg-white lg:relative lg:mx-0 lg:h-dvh lg:min-w-0 lg:max-w-none lg:flex-1"
        style={{
          height: 'var(--app-height, 100dvh)',
          // L'appli mobile dessine SOUS la barre d'état et le trou de la
          // caméra: index.html demande « viewport-fit=cover », et depuis
          // Android 15 le système impose ce plein écran. Aucune règle ne
          // réservait la place — d'où le titre collé à la caméra constaté
          // par Beau. Sur le web le navigateur pose sa propre barre
          // par-dessus, ce qui masquait complètement le problème.
          // env(...) vaut 0 partout où il n'y a pas d'encoche, donc cette
          // marge ne coûte rien sur un écran ordinaire.
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'var(--kb, 0px)',
        }}
      >
        {/* Hors du <main> qui défile: le bandeau reste en haut de la coque,
            visible sur tous les onglets (Accueil, Fin, Services…) comme la
            bande orange du prototype. Il ne rend rien s'il n'y a aucune
            annonce active — pas de bande vide. Masqué sur le plein écran
            vidéo, où toute barre casse l'immersion. */}
        {!pathname.startsWith('/fin') && <AnnouncementBanner />}
        {/* La barre d'onglets flotte AU-DESSUS du contenu (voir TabBar): sans
            cette marge basse, le dernier élément de chaque écran finirait
            caché derrière elle. Même règle que BuyerNav pour savoir si la
            barre est là — masquée dans un fil de discussion, qui gère sa
            propre hauteur. `/fin` est plein écran par nature. */}
        <main
          ref={mainRef}
          className={`flex-1 overflow-y-auto overscroll-contain ${
            pathname.startsWith('/chat') || pathname.startsWith('/fin') ? '' : TAB_BAR_SPACE
          }`}
        >
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <BuyerNav />
        {/* Finia vit DANS la mise en page, donc au-dessus du garde-fou qui
            protège les écrans: la moindre exception chez elle faisait
            disparaître toute l'application, sans rien laisser à l'écran
            qu'un fond blanc. Son propre garde-fou la contient — l'assistant
            s'efface, le reste de l'app continue de fonctionner. */}
        {/* La visite guidée passe par le même garde-fou que Finia: si elle
            plante, elle disparaît en silence au lieu d'emporter toute
            l'application avec elle. */}
        <ErrorBoundary silent>
          <WelcomeTour />
        </ErrorBoundary>
        <ErrorBoundary silent>
          <FinouChou />
        </ErrorBoundary>
        <LoginPrompt />
        {/* Rattrape les comptes créés sans nom par l'ancien écran de
            connexion. Ne s'affiche que pour eux, une seule fois. */}
        <ErrorBoundary silent>
          <NameGate />
        </ErrorBoundary>
        <CartDrawer />
      </div>
    </div>
  );
}
