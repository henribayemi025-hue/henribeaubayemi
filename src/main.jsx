import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/i18n';
import './styles/global.css';
import App from './App';

// Register the service worker (auto-update + Web Push). The user should never
// have to delete/reinstall the app to get a new version. We check for updates
// whenever the app regains focus; when a NEW worker takes control (i.e. a real
// update, not the first install) we reload once so the fresh build takes over.
if ('serviceWorker' in navigator) {
  const controlledAtLoad = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Ignore the very first install's claim (nothing to refresh into yet).
    if (!controlledAtLoad || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        const check = () => reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
        setInterval(check, 60 * 1000);
      })
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
