import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A human-readable build id (UTC), shown small in the app so we can confirm on
// a real device which version is actually running (cache debugging).
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

// Manual chunking keeps the initial payload small for 3G / low-end Android.
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  // MapLibre (la carte des Services) contient des littéraux BigInt, que la
  // cible es2018 ne sait pas réécrire. On dit à esbuild de les laisser tels
  // quels: le morceau « carte » est chargé à la demande, donc un très vieux
  // téléphone sans BigInt perd la carte, pas l'application.
  esbuild: {
    supported: { bigint: true },
  },
  build: {
    target: 'es2018',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Un fichier par icône: 41 requêtes pour 20 ko en tout. Sur un
        // téléphone, c'est l'aller-retour qui coûte, pas les octets. Toutes
        // les icônes utilisées tiennent donc dans un seul morceau.
        manualChunks(id) {
          if (id.includes('node_modules/@tabler/icons-react')) return 'icones';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(id)) return 'i18n';
          if (id.includes('node_modules/@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
  },
});
