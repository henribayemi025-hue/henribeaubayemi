import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { CartProvider } from './hooks/useCart';
import { ToastProvider } from './hooks/useToast';
import { UIProvider } from './hooks/useUI';
import { Spinner } from './components/Spinner';
import { RequireAuth } from './components/RequireAuth';
import { BuyerLayout } from './screens/buyer/BuyerLayout';
import { VendorLayout } from './screens/vendor/VendorLayout';

// Lazy-load every route for a small initial payload on 3G / low-end devices.
const Home = lazy(() => import('./screens/buyer/Home'));
const Search = lazy(() => import('./screens/buyer/Search'));
const CategoryListing = lazy(() => import('./screens/buyer/CategoryListing'));
const ProductDetail = lazy(() => import('./screens/buyer/ProductDetail'));
const ShopProfile = lazy(() => import('./screens/buyer/ShopProfile'));
const Cart = lazy(() => import('./screens/buyer/Cart'));
const CheckoutCOD = lazy(() => import('./screens/buyer/CheckoutCOD'));
const NearYou = lazy(() => import('./screens/buyer/NearYou'));
const Fin = lazy(() => import('./screens/buyer/Fin'));
const Inbox = lazy(() => import('./screens/buyer/Inbox'));
const VendorChat = lazy(() => import('./screens/buyer/VendorChat'));
const UserProfile = lazy(() => import('./screens/buyer/UserProfile'));
const Settings = lazy(() => import('./screens/buyer/Settings'));
const EditProfile = lazy(() => import('./screens/buyer/EditProfile'));
const MyOrders = lazy(() => import('./screens/buyer/MyOrders'));
const MyFavorites = lazy(() => import('./screens/buyer/MyFavorites'));
const Help = lazy(() => import('./screens/buyer/Help'));
const BecomeVendor = lazy(() => import('./screens/vendor/BecomeVendor'));
const SwitchMode = lazy(() => import('./screens/buyer/SwitchMode'));
const Auth = lazy(() => import('./screens/Auth'));
const Landing = lazy(() => import('../landing/Landing'));

const VendorDashboard = lazy(() => import('./screens/vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./screens/vendor/VendorProducts'));
const VendorProductEdit = lazy(() => import('./screens/vendor/VendorProductEdit'));
const VendorOrders = lazy(() => import('./screens/vendor/VendorOrders'));
const VendorMessages = lazy(() => import('./screens/vendor/VendorMessages'));
const VendorReels = lazy(() => import('./screens/vendor/VendorReels'));
const VendorShop = lazy(() => import('./screens/vendor/VendorShop'));
const VendorStats = lazy(() => import('./screens/vendor/VendorStats'));

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function App() {
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
                    <Route path="/landing" element={<Landing />} />

                    <Route element={<BuyerLayout />}>
                      <Route index element={<Home />} />
                      <Route path="search" element={<Search />} />
                      <Route path="category/:categoryId" element={<CategoryListing />} />
                      <Route path="product/:id" element={<ProductDetail />} />
                      <Route path="boutique/:slug" element={<ShopProfile />} />
                      <Route path="fin" element={<Fin />} />
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
                      <Route path="profile/help" element={<Help />} />
                      <Route path="become-vendor" element={<RequireAuth><BecomeVendor /></RequireAuth>} />
                      <Route path="switch/:direction" element={<RequireAuth><SwitchMode /></RequireAuth>} />
                    </Route>

                    <Route path="/vendor" element={<RequireAuth><VendorLayout /></RequireAuth>}>
                      <Route index element={<VendorDashboard />} />
                      <Route path="products" element={<VendorProducts />} />
                      <Route path="products/:id" element={<VendorProductEdit />} />
                      <Route path="orders" element={<VendorOrders />} />
                      <Route path="messages" element={<VendorMessages />} />
                      <Route path="messages/:conversationId" element={<VendorChat vendor />} />
                      <Route path="reels" element={<VendorReels />} />
                      <Route path="shop" element={<VendorShop />} />
                      <Route path="stats" element={<VendorStats />} />
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
