import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { renameSync, copyFileSync, existsSync } from 'fs';

// Construction de la console d'ADMINISTRATION, séparée de la boutique.
//
// Même dépôt, même code partagé, mais deux sorties distinctes:
//   npm run build        -> dist/        -> Worker `finjaro`       -> finjaro.net
//   npm run build:admin  -> dist-admin/  -> Worker `finjaro-admin` -> admin.finjaro.net
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const OUT = 'dist-admin';

export default defineConfig({
  plugins: [
    react(),
    {
      // `admin.html` doit s'appeler `index.html` en sortie: le Worker sert le
      // dossier tel quel et lui faut un index à la racine. Le renommage se
      // fait sur le disque après écriture — c'est le seul moment où l'on est
      // certain que le HTML de Vite est déjà émis.
      name: 'admin-html-as-index',
      closeBundle() {
        const from = resolve(process.cwd(), OUT, 'admin.html');
        const to = resolve(process.cwd(), OUT, 'index.html');
        if (existsSync(from)) renameSync(from, to);
        // `publicDir` est désactivé (voir plus bas) pour ne pas embarquer les
        // 12 Mo de photos de démonstration de la boutique dans une console
        // d'administration — mais l'icône d'onglet, elle, sert.
        const favicon = resolve(process.cwd(), 'public/favicon.svg');
        if (existsSync(favicon)) copyFileSync(favicon, resolve(process.cwd(), OUT, 'favicon.svg'));
      },
    },
  ],
  // Rien du dossier public/ (images de démo, service worker, manifeste PWA)
  // n'a de sens ici: une console interne ne s'installe pas comme une app et
  // n'a pas à fonctionner hors ligne.
  publicDir: false,
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    outDir: OUT,
    emptyOutDir: true,
    target: 'es2018',
    cssCodeSplit: true,
    rollupOptions: {
      input: resolve(process.cwd(), 'admin.html'),
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
