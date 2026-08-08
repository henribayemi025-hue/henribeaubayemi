import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './hooks/useSettings';
import { ToastProvider } from './hooks/useToast';
import { UIProvider } from './hooks/useUI';
import { RequireAuth } from './components/RequireAuth';
import { Spinner } from './components/Spinner';
import { useViewportHeight } from './hooks/useViewportHeight';

// Application d'ADMINISTRATION — bâtie depuis le même dépôt que la boutique
// mais livrée séparément (voir vite.admin.config.js + wrangler.admin.toml),
// sur son propre domaine. finjaro.net ne contient donc plus une seule ligne
// d'administration, et inversement: aucune page acheteur/vendeur n'est
// atteignable ici.
//
// Ce qui reste partagé, volontairement: les composants, les traductions, la
// charte graphique et la base Supabase. Dupliquer tout ça dans un second
// dépôt aurait garanti qu'un correctif appliqué d'un côté manque de l'autre.
//
// Pas de CartProvider: il n'y a pas de panier dans une console d'admin.
const AdminDashboard = lazy(() => import('./screens/AdminDashboard'));
const Auth = lazy(() => import('./screens/Auth'));
const ResetPassword = lazy(() => import('./screens/ResetPassword'));

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function AdminApp() {
  useViewportHeight();
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <UIProvider>
              {/* Le document lui-même ne défile JAMAIS (`overflow: hidden`
                  sur html/body dans global.css — c'est ce qui empêche le
                  clavier iOS de pousser toute l'app vers le haut). Chaque
                  écran défile donc dans son propre cadre; la console avait
                  été livrée sans, et ne défilait pas du tout. */}
              <div className="flex flex-col overflow-hidden" style={{ height: 'var(--app-height, 100dvh)', paddingTop: 'env(safe-area-inset-top)' }}>
                <main className="flex-1 overflow-y-auto overscroll-contain">
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/auth" element={<Auth consoleMode />} />
                      <Route path="/auth/reset" element={<ResetPassword />} />
                      <Route path="/" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
                      {/* Toute autre adresse ramène à la console: il n'y a
                          rien d'autre à servir sur ce domaine. */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </UIProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
