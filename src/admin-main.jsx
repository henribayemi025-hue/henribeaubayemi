import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/i18n';
import './styles/global.css';
import AdminApp from './AdminApp';

// Point d'entrée de la console d'administration. Volontairement dépouillé
// par rapport à src/main.jsx: pas de préchargement de l'accueil, pas de
// comptage de visite (une visite d'admin n'est pas une visite de cliente et
// fausserait les statistiques qu'elle sert justement à afficher), pas de
// service worker (une console interne n'a rien à faire hors ligne, et éviter
// le cache garantit qu'on voit toujours la version fraîche).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
