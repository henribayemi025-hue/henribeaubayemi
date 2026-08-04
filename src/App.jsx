import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { CartProvider } from './hooks/useCart';
import { ToastProvider } from './hooks/useToast';
import { UIProvider } from './hooks/useUI';
import { Spinner } from './components/Spinner';
import { RequireAuth } from './components/RequireAuth';
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
function lazyWithReload(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const key = 'finjaro-chunk-reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
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
const Cart = lazyWithReload(() => import('./screens/buyer/Cart'));
const CheckoutCOD = lazyWithReload(() => import('./screens/buyer/CheckoutCOD'));
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
const SwitchMode = lazyWithReload(() => import('./screens/buyer/SwitchMode'));
const Auth = lazyWithReload(() => import('./screens/Auth'));
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

export default function App() {
  useViewportHeight();
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <ToastProvider>
              <UIProvider>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/reset" element={<ResetPassword />} />
                    {/* Pas de route /admin ici: la console d'administration
                        est une application à part (src/AdminApp.jsx), livrée
                        sur son propre domaine. Voir wrangler.admin.toml. */}
                    <Route path="/landing" element={<Landing />} />

                    <Route element={<BuyerLayout />}>
                      <Route index element={<Home />} />
                      <Route path="search" element={<Search />} />
                      <Route path="category/:categoryId" element={<CategoryListing />} />
                      <Route path="product/:id" element={<ProductDetail />} />
                      <Route path="boutique/:slug" element={<ShopProfile />} />
                      <Route path="fin" element={<Fin />} />
                      {/* Pivot: l'onglet s'appelle désormais "Services" — /near-you
                          reste servi pour les anciens liens/PWA épinglées. */}
                      <Route path="services" element={<NearYou />} />
                      <Route path="near-you" element={<NearYou />} />
                      <Route path="cart" element={<Cart />} />
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
