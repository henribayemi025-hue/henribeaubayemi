import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/i18n';
import './styles/global.css';
import App from './App';

// Register the service worker (Web Push). Non-blocking; ignore failures.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
