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
  build: {
    target: 'es2018',
    cssCodeSplit: true,
    rollupOptions: {
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
