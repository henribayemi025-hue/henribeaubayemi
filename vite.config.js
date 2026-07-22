import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Manual chunking keeps the initial payload small for 3G / low-end Android.
export default defineConfig({
  plugins: [react()],
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
