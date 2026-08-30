import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { CartProvider } from './hooks/useCart';
import { ToastProvider } from './hooks/useToast';
import { UIProvider } from './hooks/useUI';
import { Spinner } from './components/Spinner';
import { RequireAuth } from './components/RequireAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppIntro } from './components/AppIntro';
import { useViewportHeight } from './hooks/useViewportHeight';
import { BuyerLayout } from './screens/buyer/BuyerLayout';
import { VendorLayout } from './screens/vendor/VendorLayout';

// A lazy-loaded chunk's URL is content-hashed to the build that created it. If
// the tab has been open across a newer deploy, the OLD chunk no longer exists
// on the server (the deploy overwrote it) and the dynamic import() 404s —
// React surfaces that as a render error on whichever screen the user opens
// for the first time since the deploy (screens already loaded, like Home,
// keep working from memory). Clicking "Retry" doesn't help: it re-renders the
// SAME already-rejected lazy component, still pointing at the dead URL. The
// only real fix is a fresh index.html with the current build's chunk hashes,
// so: on an import failure, reload the page once (guarded so a genuinely
// broken module doesn't reload-loop — it'll surface as a normal error after).
const CHUNK_RELOAD_KEY = 'finjaro-chunk-reload';

// Le rechargement peut être resservi depuis le cache du service worker —
// donc le MÊME index.html, avec les mêmes adresses de chunk mortes. On vide
// la coquille avant de recharger, sinon la tentative de secours ne sert à
// rien. Sans Cache API (navigateur ancien, mode privé), on recharge quand
// même: le réseau fera le travail.
async function dropShellCache() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('finjaro-')).map((k) => caches.delete(k)));
  } catch {
    /* Cache API indisponible — on continue. */
  }
}

function lazyWithReload(factory) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // Un import qui aboutit prouve qu'on tourne sur un index.html à jour:
      // on réarme le rechargement pour le PROCHAIN déploiement.
      //
      // C'est le correctif du 07/08. Avant, le drapeau était posé une fois
      // et jamais retiré: la tentative de secours ne valait donc que pour le
      // premier déploiement rencontré par l'onglet. Une app installée reste
      // ouverte des jours — au DEUXIÈME déploiement (il y en a eu deux le
      // 07/08), le rechargement était déjà « consommé » et l'écran partait
      // droit en erreur. Constaté en vrai: une vendeuse cliquant sur
      // « Ajouter » depuis son tableau de bord, bloquée sur « Quelque chose
      // n'a pas fonctionné ».
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return mod;
    } catch (err) {
      // Le garde-fou reste: un module réellement cassé ne doit pas faire
      // boucler la page indéfiniment. Il est simplement remis à zéro à
      // chaque chargement réussi.
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        await dropShellCache();
        window.location.reload();
        return new Promise(() => {}); // hold rendering until the reload lands
      }
      throw err;
    }
  });
}

// Lazy-load every route for a small initial payload on 3G / low-end devices.
const Home = lazyWithReload(() => import('./screens/buyer/Home'));
const Search = lazyWithReload(() => import('./screens/buyer/Search'));
const CategoryListing = lazyWithReload(() => import('./screens/buyer/CategoryListing'));
const ProductDetail = lazyWithReload(() => import('./screens/buyer/ProductDetail'));
const ShopProfile = lazyWithReload(() => import('./screens/buyer/ShopProfile'));
const Shops = lazyWithReload(() => import('./screens/buyer/Shops'));
const Cart = lazyWithReload(() => import('./screens/buyer/Cart'));
const CheckoutCOD = lazyWithReload(() => import('./screens/buyer/CheckoutCOD'));
const CheckoutAll = lazyWithReload(() => import('./screens/buyer/CheckoutAll'));
const NearYou = lazyWithReload(() => import('./screens/buyer/NearYou'));
const Fin = lazyWithReload(() => import('./screens/buyer/Fin'));
const Inbox = lazyWithReload(() => import('./screens/buyer/Inbox'));
const VendorChat = lazyWithReload(() => import('./screens/buyer/VendorChat'));
const UserProfile = lazyWithReload(() => import('./screens/buyer/UserProfile'));
const Settings = lazyWithReload(() => import('./screens/buyer/Settings'));
const EditProfile = lazyWithReload(() => import('./screens/buyer/EditProfile'));
const MyOrders = lazyWithReload(() => import('./screens/buyer/MyOrders'));
const MyFavorites = lazyWithReload(() => import('./screens/buyer/MyFavorites'));
const InviteFriend = lazyWithReload(() => import('./screens/buyer/InviteFriend'));
const Help = lazyWithReload(() => import('./screens/buyer/Help'));
const BecomeVendor = lazyWithReload(() => import('./screens/vendor/BecomeVendor'));
const Relance = lazyWithReload(() => import('./screens/buyer/Relance'));
const SwitchMode = lazyWithReload(() => import('./screens/buyer/SwitchMode'));
const Auth = lazyWithReload(() => import('./screens/Auth'));
const Terms = lazyWithReload(() => import('./screens/Terms'));
const About = lazyWithReload(() => import('./screens/About'));
const Privacy = lazyWithReload(() => import('./screens/Privacy'));
const AccountDeletion = lazyWithReload(() => import('./screens/AccountDeletion'));
const ResetPassword = lazyWithReload(() => import('./screens/ResetPassword'));
const Landing = lazyWithReload(() => import('../landing/Landing'));

const VendorDashboard = lazyWithReload(() => import('./screens/vendor/VendorDashboard'));
const VendorProducts = lazyWithReload(() => import('./screens/vendor/VendorProducts'));
const VendorProductEdit = lazyWithReload(() => import('./screens/vendor/VendorProductEdit'));
const VendorProductsBulk = lazyWithReload(() => import('./screens/vendor/VendorProductsBulk'));
const VendorOrders = lazyWithReload(() => import('./screens/vendor/VendorOrders'));
const VendorMessages = lazyWithReload(() => import('./screens/vendor/VendorMessages'));
const VendorReels = lazyWithReload(() => import('./screens/vendor/VendorReels'));
const VendorShop = lazyWithReload(() => import('./screens/vendor/VendorShop'));
const VendorStats = lazyWithReload(() => import('./screens/vendor/VendorStats'));
const VendorFinances = lazyWithReload(() => import('./screens/vendor/VendorFinances'));
const VendorLeaderboard = lazyWithReload(() => import('./screens/vendor/VendorLeaderboard'));

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

// Écrans à précharger dès que l'accueil est affiché et la connexion au repos.
//
// Chaque onglet est un fichier séparé, téléchargé SEULEMENT au moment du clic.
// Depuis le Cameroun, avec la latence vers l'Europe, ça se voit: on tape, il ne
// se passe rien, puis l'écran arrive. Beau (04/08): « quand je clique sur un
// truc ça rame, les gens se plaignent de ça ».
//
// On les récupère donc à l'avance, pendant que la personne regarde l'accueil.
// `requestIdleCallback` attend que le navigateur n'ait plus rien d'urgent à
// faire: le préchargement ne ralentit jamais l'affichage en cours. Au clic, le
// fichier est déjà en cache et la navigation est instantanée.
const PREFETCH = [
  () => import('./screens/buyer/ProductDetail'),
  () => import('./screens/buyer/Search'),
  () => import('./screens/buyer/CategoryListing'),
  () => import('./screens/buyer/Fin'),
  () => import('./screens/buyer/NearYou'),
  () => import('./screens/buyer/UserProfile'),
  () => import('./screens/buyer/ShopProfile'),
  () => import('./screens/buyer/Cart'),
];

function usePrefetchRoutes() {
  useEffect(() => {
    // Sur un forfait limité, on n'impose pas 500 Ko à quelqu'un qui n'a rien
    // demandé: les navigateurs qui signalent une connexion lente ou le mode
    // économie de données sont épargnés.
    const net = navigator.connection;
    if (net && (net.saveData || /2g/.test(net.effectiveType || ''))) return undefined;

    let cancelled = false;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    const cancelIdle = window.cancelIdleCallback || clearTimeout;

    // Un par un: huit téléchargements simultanés se disputeraient la bande
    // passante avec les photos de l'accueil, qui, elles, sont visibles.
    let i = 0;
    const next = () => {
      if (cancelled || i >= PREFETCH.length) return;
      PREFETCH[i++]().catch(() => {}).then(() => idle(next));
    };
    const handle = idle(next);
    return () => {
      cancelled = true;
      cancelIdle(handle);
    };
  }, []);
}

export default function App() {
  useViewportHeight();
  usePrefetchRoutes();
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <ToastProvider>
              <UIProvider>
                {/* Au-dessus des routes: la présentation du premier lancement
                    doit s'afficher quelle que soit la page d'arrivée, et sans
                    attendre qu'un compte existe. */}
                <ErrorBoundary silent><AppIntro /></ErrorBoundary>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/reset" element={<ResetPassword />} />
                    {/* Pas de route /admin ici: la console d'administration
                        est une application à part (src/AdminApp.jsx), livrée
                        sur son propre domaine. Voir wrangler.admin.toml. */}
                    <Route path="/landing" element={<Landing />} />
                    {/* Page légale hors layout: accessible depuis l'écran de
                        connexion, l'espace acheteur et l'espace vendeur. */}
                    <Route path="/legal/terms" element={<Terms />} />
                    <Route path="/a-propos" element={<About />} />
                    {/* URL exigée telle quelle par Google Play et l'App Store:
                        publique, sans connexion, hors de tout layout privé. */}
                    <Route path="/legal/confidentialite" element={<Privacy />} />
                    {/* Adresse déclarée à Google Play (« URL de suppression
                        de compte »): publique, sans connexion, sinon
                        l'examinateur ne peut pas l'ouvrir. */}
                    <Route path="/suppression-compte" element={<AccountDeletion />} />

                    <Route element={<BuyerLayout />}>
                      <Route index element={<Home />} />
                      <Route path="search" element={<Search />} />
                      <Route path="category/:categoryId" element={<CategoryListing />} />
                      <Route path="product/:id" element={<ProductDetail />} />
                      <Route path="boutiques" element={<Shops />} />
                      <Route path="boutique/:slug" element={<ShopProfile />} />
                      <Route path="fin" element={<Fin />} />
                      {/* Pivot: l'onglet s'appelle désormais "Services" — /near-you
                          reste servi pour les anciens liens/PWA épinglées. */}
                      <Route path="services" element={<NearYou />} />
                      <Route path="near-you" element={<NearYou />} />
                      <Route path="cart" element={<Cart />} />
                      {/* Avant checkout/:shopId — sinon « tout » serait pris pour
                          un identifiant de boutique, comme products/bulk. */}
                      <Route path="checkout/tout" element={<RequireAuth><CheckoutAll /></RequireAuth>} />
                      <Route path="checkout/:shopId" element={<RequireAuth><CheckoutCOD /></RequireAuth>} />
                      <Route path="inbox" element={<RequireAuth><Inbox /></RequireAuth>} />
                      <Route path="chat/:conversationId" element={<RequireAuth><VendorChat /></RequireAuth>} />
                      <Route path="profile" element={<UserProfile />} />
                      <Route path="profile/settings" element={<Settings />} />
                      <Route path="profile/edit" element={<RequireAuth><EditProfile /></RequireAuth>} />
                      <Route path="profile/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
                      <Route path="profile/favorites" element={<RequireAuth><MyFavorites /></RequireAuth>} />
                      <Route path="profile/invite" element={<RequireAuth><InviteFriend /></RequireAuth>} />
                      <Route path="profile/help" element={<Help />} />
                      <Route path="become-vendor" element={<RequireAuth><BecomeVendor /></RequireAuth>} />
                      <Route path="relance/:id" element={<RequireAuth><Relance /></RequireAuth>} />
                      <Route path="switch/:direction" element={<RequireAuth><SwitchMode /></RequireAuth>} />
                    </Route>

                    <Route path="/vendor" element={<RequireAuth><VendorLayout /></RequireAuth>}>
                      <Route index element={<VendorDashboard />} />
                      <Route path="products" element={<VendorProducts />} />
                      {/* Avant products/:id — sinon "bulk" serait pris pour
                          un identifiant d'article. */}
                      <Route path="products/bulk" element={<VendorProductsBulk />} />
                      <Route path="products/:id" element={<VendorProductEdit />} />
                      <Route path="orders" element={<VendorOrders />} />
                      <Route path="messages" element={<VendorMessages />} />
                      <Route path="messages/:conversationId" element={<VendorChat vendor />} />
                      <Route path="reels" element={<VendorReels />} />
                      <Route path="shop" element={<VendorShop />} />
                      <Route path="stats" element={<VendorStats />} />
                      <Route path="finances" element={<VendorFinances />} />
                      <Route path="leaderboard" element={<VendorLeaderboard />} />
                    </Route>

                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </UIProvider>
            </ToastProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
